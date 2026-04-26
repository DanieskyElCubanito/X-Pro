import { createClient } from '@supabase/supabase-js';
import { TonClient, WalletContractV5R1, internal, toNano } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import axios from 'axios';

const supabase = createClient(
  "https://shfogfihzkwmusarhlxv.supabase.co",
  "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx"
);

// --- CONFIGURACIÓN PRINCIPAL ---
const BOT_TOKEN = "8272127366:AAHwAbfVqQDklyLYI0PVo5gvveLaTGtUS6Y";
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = "TU_API_KEY_AQUI"; // Consíguela en @tonapibot si usas mainnet
const PAYMENTS_CHANNEL = "-1002100816898";

// 👇 PEGA AQUÍ TUS 24 PALABRAS SEPARADAS POR ESPACIOS 👇
const ADMIN_MNEMONIC = "palabra1 palabra2 palabra3 palabra4 palabra5 palabra6 palabra7 palabra8 palabra9 palabra10 palabra11 palabra12 palabra13 palabra14 palabra15 palabra16 palabra17 palabra18 palabra19 palabra20 palabra21 palabra22 palabra23 palabra24";

async function checkMembership(userId, chatId) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`;
    const response = await fetch(url);
    const resData = await response.json();
    if (!resData.ok) return false;
    const status = resData.result.status;
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (error) {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { user, action, userId, amount, address, start_param } = req.body; 

    // --- ACCIÓN: VERIFICAR CANALES ---
    if (action === 'check-channels') {
      const isMember1 = await checkMembership(userId, "-1002228067712");
      const isMember2 = await checkMembership(userId, "-1002049802477");
      return res.status(200).json({
        success: true,
        channel1: isMember1,
        channel2: isMember2,
        allJoined: isMember1 && isMember2
      });
    }

    // --- ACCIÓN: COBRAR BONO DIARIO ---
    if (action === 'claim-bonus') {
      const { data: u } = await supabase.from('users').select('*').eq('id', userId).single();
      const now = Date.now();
      const lastBonus = u.last_bonus ? new Date(u.last_bonus).getTime() : 0;
      if (now - lastBonus < 24 * 60 * 60 * 1000) return res.status(400).json({ error: `Espera 24h` });

      const reward = 0.001;
      const newB = (Number(u.balance) || 0) + reward;
      await supabase.from('users').update({ balance: newB, last_bonus: new Date().toISOString() }).eq('id', userId);
      return res.status(200).json({ success: true, newBalance: newB });
    }

    // --- [NUEVA] ACCIÓN: RETIRO REAL BLOCKCHAIN ---
    if (action === 'withdraw') {
      const withdrawAmount = parseFloat(amount);
      const { data: u } = await supabase.from('users').select('*').eq('id', userId).single();

      if (!u || u.balance < withdrawAmount) return res.status(400).json({ error: 'Saldo insuficiente' });
      if (withdrawAmount < 0.1) return res.status(400).json({ error: 'Mínimo 0.1 TON' });

      let txHash = null;
      try {
        const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
        
        // Usamos la variable que definimos arriba
        const keyPair = await mnemonicToPrivateKey(ADMIN_MNEMONIC.trim().split(/\s+/));
        const wallet = client.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));

        const seqno = await wallet.getSeqno();
        await wallet.sendTransfer({
          seqno,
          secretKey: keyPair.secretKey,
          messages: [internal({
            to: address,
            value: toNano(withdrawAmount.toFixed(4)),
            bounce: false,
            body: "IA Profit Payment ✅",
          })]
        });

        // Esperar confirmación básica
        let success = false;
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 3000));
          if ((await wallet.getSeqno()) > seqno) { success = true; break; }
        }
        if (!success) throw new Error("La red TON tarda demasiado.");

        const transactions = await client.getTransactions(wallet.address, { limit: 1 });
        txHash = transactions[0]?.hash().toString('hex');
      } catch (e) {
        return res.status(500).json({ error: "Error Blockchain: " + e.message });
      }

      if (txHash) {
        // Descontamos usando RPC para seguridad
        await supabase.rpc('decrement_balance', { user_id_input: userId, amount_input: withdrawAmount });
        await supabase.from('withdrawals').insert([{ 
          user_id: userId, amount: withdrawAmount, status: 'SUCCESS', tx_hash: txHash, address: address 
        }]);

        // Notificación al canal
        const msg = `💎 <b>PAGO ENVIADO</b>\n\n👤 <b>Usuario:</b> ${u.username}\n💰 <b>Monto:</b> ${withdrawAmount} TON\n🔗 <a href="https://tonscan.org/tx/${txHash}">Ver Transacción</a>`;
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { chat_id: PAYMENTS_CHANNEL, text: msg, parse_mode: 'HTML' });

        return res.status(200).json({ success: true, txHash });
      }
    }

    // --- ACCIÓN: VERIFICAR / INICIO (Lógica de Referidos) ---
    if (!user?.id) return res.status(400).json({ error: 'No user id' });
    let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (!dbUser) {
      const newUserObj = { id: user.id, username: user.username || 'Gamer', balance: 0 };
      if (start_param && start_param !== String(user.id)) newUserObj.referred_by = start_param;
      const { data: newUser } = await supabase.from('users').insert([newUserObj]).select().single();
      dbUser = newUser;

      if (newUserObj.referred_by) {
        const { data: inviter } = await supabase.from('users').select('balance').eq('id', newUserObj.referred_by).single();
        if (inviter) await supabase.from('users').update({ balance: (inviter.balance || 0) + 0.003 }).eq('id', newUserObj.referred_by);
      }
    }

    const isMember1 = await checkMembership(user.id, "-1002228067712");
    const isMember2 = await checkMembership(user.id, "-1002049802477");

    // Cálculo de Red (Niveles 1, 2, 3)
    const { data: lv1 } = await supabase.from('users').select('id, balance').eq('referred_by', user.id);
    const n1 = lv1?.length || 0;
    const ids1 = lv1?.map(u => u.id) || [];
    let n2 = 0, ids2 = [];
    if (ids1.length > 0) {
      const { data: lv2 } = await supabase.from('users').select('id').in('referred_by', ids1);
      n2 = lv2?.length || 0;
      ids2 = lv2?.map(u => u.id) || [];
    }
    let n3 = 0;
    if (ids2.length > 0) {
      const { data: lv3 } = await supabase.from('users').select('id').in('referred_by', ids2);
      n3 = lv3?.length || 0;
    }

    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { n1, c1: (n1 * 0.003).toFixed(4), n2, c2: (n2 * 0.002).toFixed(4), n3, c3: (n3 * 0.001).toFixed(4) },
      mustJoin: !(isMember1 && isMember2),
      channels: { c1: isMember1, c2: isMember2 }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}