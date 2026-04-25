import { createClient } from '@supabase/supabase-js';
import { TonClient, WalletContractV5R1, internal, toNano } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import axios from 'axios';

const supabase = createClient(
  "https://shfogfihzkwmusarhlxv.supabase.co",
  "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx"
);

// CONFIGURACIÓN GLOBAL
const BOT_TOKEN = "8272127366:AAHwAbfVqQDklyLYI0PVo5gvveLaTGtUS6Y";
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC"; 
const TON_API_KEY = "TU_TONCENTER_API_KEY"; // Consíguela gratis en @tonapibot
const PAYMENTS_CHANNEL = "-1002228067712"; // ID del canal donde se publican los pagos
const MIN_WITHDRAW = 0.1;
const MAX_DAILY_WITHDRAW = 5.0;

// Función para verificar membresía en canales
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

    // --- ACCIÓN: CHECK CHANNELS ---
    if (action === 'check-channels') {
      const isMember1 = await checkMembership(userId, "-1002228067712");
      const isMember2 = await checkMembership(userId, "-1003747302094");
      return res.status(200).json({
        success: true,
        channel1: isMember1, channel2: isMember2,
        allJoined: isMember1 && isMember2
      });
    }

    // --- ACCIÓN: CLAIM BONUS ---
    if (action === 'claim-bonus') {
      const { data: u } = await supabase.from('users').select('*').eq('id', userId).single();
      const now = Date.now();
      const lastBonus = u.last_bonus ? new Date(u.last_bonus).getTime() : 0;
      if (now - lastBonus < 86400000) return res.status(400).json({ error: 'Faltan horas para tu próximo bono' });

      const newB = (Number(u.balance) || 0) + 0.001;
      await supabase.from('users').update({ balance: newB, last_bonus: new Date().toISOString() }).eq('id', userId);
      return res.status(200).json({ success: true, newBalance: newB });
    }

    // --- ACCIÓN: RETIRO REAL (BLOCKCHAIN) ---
    if (action === 'withdraw') {
      const MNEMONIC = process.env.ADMIN_MNEMONIC; // Guardar en Vercel Env Variables
      const withdrawAmount = parseFloat(amount);
      const cleanAddress = address?.trim();

      if (!userId || !cleanAddress || isNaN(withdrawAmount)) return res.status(400).json({ error: "Datos incompletos" });
      if (withdrawAmount < MIN_WITHDRAW) return res.status(400).json({ error: `Mínimo ${MIN_WITHDRAW} TON` });

      // Verificar usuario y saldo en DB
      const { data: dbUser } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!dbUser || dbUser.balance < withdrawAmount) return res.status(400).json({ error: "Saldo insuficiente" });

      // Lógica de pago en TON
      let txHash = null;
      try {
        const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
        const keyPair = await mnemonicToPrivateKey(MNEMONIC.split(/\s+/));
        const wallet = client.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));
        
        const balanceAdmin = await wallet.getBalance();
        const withdrawInNano = toNano(withdrawAmount.toFixed(4));

        if (balanceAdmin < (withdrawInNano + toNano("0.05"))) {
          return res.status(500).json({ error: "Sin liquidez en la bóveda principal" });
        }

        const seqno = await wallet.getSeqno();
        await wallet.sendTransfer({
          seqno,
          secretKey: keyPair.secretKey,
          messages: [internal({ to: cleanAddress, value: withdrawInNano, bounce: false, body: "IA Profit Payment" })]
        });

        // Esperar confirmación
        let confirmed = false;
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const currentSeqno = await wallet.getSeqno();
          if (currentSeqno > seqno) { confirmed = true; break; }
        }
        if (!confirmed) throw new Error("La red TON tarda demasiado, verifica tu wallet");

        const txs = await client.getTransactions(wallet.address, { limit: 1 });
        txHash = txs[0]?.hash().toString('hex');
      } catch (e) {
        return res.status(500).json({ error: "Error Blockchain: " + e.message });
      }

      if (txHash) {
        // Ejecutar decremento y guardar log
        await supabase.rpc('decrement_balance', { user_id_input: String(userId), amount_input: withdrawAmount });
        await supabase.from('withdrawals').insert([{ user_id: userId, amount: withdrawAmount, tx_hash: txHash, address: cleanAddress, status: 'SUCCESS' }]);

        // Notificar al canal
        const msg = `💎 <b>PAGO REALIZADO</b>\n\n👤 <b>Usuario:</b> ${dbUser.username}\n💸 <b>Monto:</b> ${withdrawAmount} TON\n🔗 <a href="https://tonscan.org/tx/${txHash}">Ver Transacción</a>`;
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { chat_id: PAYMENTS_CHANNEL, text: msg, parse_mode: 'HTML' });

        return res.status(200).json({ success: true, txHash });
      }
    }

    // --- ACCIÓN: VERIFY / INICIO ---
    if (!user?.id) return res.status(400).json({ error: 'No user id' });
    let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (!dbUser) {
      const newUserObj = { id: user.id, username: user.username || 'Gamer', balance: 0 };
      if (start_param && start_param !== String(user.id)) newUserObj.referred_by = start_param;
      
      const { data: newUser } = await supabase.from('users').insert([newUserObj]).select().single();
      dbUser = newUser;

      if (newUserObj.referred_by) {
        const { data: inviter } = await supabase.from('users').select('balance').eq('id', newUserObj.referred_by).single();
        if (inviter) {
          await supabase.from('users').update({ balance: (inviter.balance || 0) + 0.003 }).eq('id', newUserObj.referred_by);
        }
      }
    }

    const isMember1 = await checkMembership(user.id, "-1002228067712");
    const isMember2 = await checkMembership(user.id, "-1003747302094");

    // Lógica simplificada de red (puedes mantener la de 3 niveles anterior aquí)
    const { data: lv1 } = await supabase.from('users').select('id, balance').eq('referred_by', user.id);
    const n1 = lv1?.length || 0;

    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { n1, c1: (n1 * 0.003).toFixed(4) },
      mustJoin: !(isMember1 && isMember2),
      channels: { c1: isMember1, c2: isMember2 }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}