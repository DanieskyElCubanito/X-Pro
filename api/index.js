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
const TON_API_KEY = "f8c2008d8ba557465e49df5bdd98eb987ef639a5ffabca82203c6d6f6b802fb5"; 
const PAYMENTS_CHANNEL = "-1002100816898";

const ADMIN_MNEMONIC = "victory end nothing roast ice begin paddle orient dish three poem salute bright term mixed under nature bacon make amazing add round dynamic market";

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

    // --- NUEVA ACCIÓN: OBTENER HISTORIAL ---
    if (action === 'get-history') {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', String(userId))
        .order('created_at', { ascending: false });
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, history: data });
    }

    // --- NUEVA ACCIÓN: VERIFICAR HUMANO (CAPTCHA ANTI-BOTS) ---
    if (action === 'verify-human') {
      const { error } = await supabase
        .from('users')
        .update({ is_human: true })
        .eq('id', String(userId));
        
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

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
      const { data: u } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      const now = Date.now();
      const lastBonus = u.last_bonus ? new Date(u.last_bonus).getTime() : 0;
      if (now - lastBonus < 24 * 60 * 60 * 1000) return res.status(400).json({ error: `Espera 24h` });

      const reward = 0.001;
      const newB = (Number(u.balance) || 0) + reward;
      await supabase.from('users').update({ balance: newB, last_bonus: new Date().toISOString() }).eq('id', String(userId));
      return res.status(200).json({ success: true, newBalance: newB });
    }

    // --- ACCIÓN: RETIRO REAL BLOCKCHAIN ---
    if (action === 'withdraw') {
      const withdrawAmount = parseFloat(amount);
      const { data: u } = await supabase.from('users').select('*').eq('id', String(userId)).single();

      if (!u || u.balance < withdrawAmount) return res.status(400).json({ error: 'Saldo insuficiente' });
      if (withdrawAmount < 0.1) return res.status(400).json({ error: 'Mínimo 0.1 TON' });

      let txHash = null;
      try {
        const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
        const keyPair = await mnemonicToPrivateKey(ADMIN_MNEMONIC.trim().split(/\s+/));
        const wallet = client.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));

        const seqno = await wallet.getSeqno();
        
        // CORRECCIÓN: toString() evita la pérdida de precisión en JS
        await wallet.sendTransfer({
          seqno,
          secretKey: keyPair.secretKey,
          messages: [internal({
            to: address.trim(),
            value: toNano(withdrawAmount.toString()), 
            bounce: false,
            body: "IA Profit Payment ✅",
          })]
        });

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
        await supabase.rpc('decrement_balance', { user_id_input: String(userId), amount_input: withdrawAmount });
        await supabase.from('withdrawals').insert([{ 
          user_id: String(userId), amount: withdrawAmount, status: 'SUCCESS', tx_hash: txHash, address: address.trim() 
        }]);

        // --- MENSAJE PERSONALIZADO PARA EL CANAL ---
        const messageText = 
                `💎 <b>PAGO VERIFICADO EXITOSAMENTE</b>\n\n` +
                `👤 <b>Beneficiario:</b> <a href="tg://user?id=${userId}">${u.username || 'Usuario'}</a>\n` +
                `💸 <b>Monto Total:</b> ${withdrawAmount} TON\n` +
                `🛡️ <b>Red:</b> Toncoin (Ton)\n` +
                `⚡ <b>Estado:</b> Finalizado / 100%\n\n` +
                `🔹 <b>TXID:</b>\n` +
                `<a href="https://tonscan.org/tx/${txHash}"><b>${txHash}</b></a>\n\n` +
                `🔥 <i>¡Retiros procesados con total transparencia!</i>`;

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: PAYMENTS_CHANNEL,
            text: messageText,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [[{ text: "💰 ¡QUIERO GANAR TON AHORA!", url: `https://t.me/IAProfitTonBot` }]]
            }
        }).catch(e => console.log("Error Telegram Notification"));

        return res.status(200).json({ success: true, txHash });
      }
    }

    // --- ACCIÓN: VERIFICAR / INICIO (Ruta principal) ---
    if (!user?.id) return res.status(400).json({ error: 'No user id' });
    let { data: dbUser } = await supabase.from('users').select('*').eq('id', String(user.id)).single();

    if (!dbUser) {
      const newUserObj = { 
        id: String(user.id), 
        username: user.username || 'Gamer', 
        balance: 0,
        is_human: false // Inicializamos en falso por defecto
      };
      if (start_param && start_param !== String(user.id)) newUserObj.referred_by = String(start_param);
      const { data: newUser } = await supabase.from('users').insert([newUserObj]).select().single();
      dbUser = newUser;

      if (newUserObj.referred_by) {
        const { data: inviter } = await supabase.from('users').select('balance').eq('id', newUserObj.referred_by).single();
        if (inviter) await supabase.from('users').update({ balance: (inviter.balance || 0) + 0.003 }).eq('id', newUserObj.referred_by);
      }
    }

    const isMember1 = await checkMembership(user.id, "-1002228067712");
    const isMember2 = await checkMembership(user.id, "-1002049802477");

    const { data: lv1 } = await supabase.from('users').select('id, balance').eq('referred_by', String(user.id));
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