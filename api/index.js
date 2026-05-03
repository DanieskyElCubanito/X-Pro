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

// --- CLAVES DE CLOUDFLARE TURNSTILE ---
const CF_SECRET_KEY = "0x4AAAAAACqyiO0Gk6OnxaaGFcIZIYIxRnk";

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

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

  try {
    const { user, action, userId, amount, address, start_param, captchaToken } = req.body; 

    // --- ACCIÓN: OBTENER HISTORIAL ---
    if (action === 'get-history') {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', String(userId))
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, history: data });
    }

    // --- ACCIÓN: VERIFICAR HUMANO (CON CLOUDFLARE TURNSTILE) ---
    if (action === 'verify-human') {
      if (!captchaToken) return res.status(400).json({ error: 'Falta el token de captcha' });

      const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      const cfResponse = await axios.post(verifyUrl, `secret=${CF_SECRET_KEY}&response=${captchaToken}&remoteip=${clientIp}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (!cfResponse.data.success) {
        return res.status(403).json({ error: 'Validación de captcha fallida' });
      }

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
        const newBalance = Number(u.balance) - withdrawAmount;
        await supabase.from('users').update({ balance: newBalance }).eq('id', String(userId));
        await supabase.from('withdrawals').insert([{ 
          user_id: String(userId), amount: withdrawAmount, status: 'SUCCESS', tx_hash: txHash, address: address.trim() 
        }]);

        const messageText = `💎 <b>PAGO VERIFICADO</b>\n\n👤 <b>Usuario:</b> ${userId}\n💸 <b>Monto:</b> ${withdrawAmount} TON\n🔹 <b>TX:</b> <a href="https://tonscan.org/tx/${txHash}">Ver Transacción</a>`;
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: PAYMENTS_CHANNEL,
            text: messageText,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        }).catch(e => console.log("Error Telegram"));

        return res.status(200).json({ success: true, txHash });
      }
    }

    // --- ACCIÓN: REGISTRO / LOGIN (VERIFY) ---
    const targetUser = user || { id: userId };
    if (!targetUser?.id) return res.status(400).json({ error: 'No user id' });
    
    let { data: dbUser } = await supabase.from('users').select('*').eq('id', String(targetUser.id)).single();

    if (!dbUser) {
      if (clientIp !== 'unknown') {
        const ipCheck = await axios.get(`http://ip-api.com/json/${clientIp}?fields=proxy,hosting`);
        if (ipCheck.data.proxy || ipCheck.data.hosting) return res.status(403).json({ error: 'VPN detectada' });

        const { data: existingIp } = await supabase.from('users').select('id').eq('ip_address', clientIp).limit(1);
        if (existingIp && existingIp.length > 0) return res.status(403).json({ error: 'IP ya registrada' });
      }

      const newUserObj = { 
        id: String(targetUser.id), 
        username: targetUser.username || 'Usuario', 
        balance: 0,
        is_human: false,
        ip_address: clientIp 
      };

      if (start_param && start_param !== String(targetUser.id)) newUserObj.referred_by = String(start_param);
      const { data: newUser } = await supabase.from('users').insert([newUserObj]).select().single();
      dbUser = newUser;

      if (newUserObj.referred_by) {
        const { data: l1 } = await supabase.from('users').select('id, balance, referred_by').eq('id', newUserObj.referred_by).single();
        if (l1) {
          await supabase.from('users').update({ balance: (l1.balance || 0) + 0.003 }).eq('id', l1.id);
          if (l1.referred_by) {
            const { data: l2 } = await supabase.from('users').select('id, balance, referred_by').eq('id', l1.referred_by).single();
            if (l2) {
              await supabase.from('users').update({ balance: (l2.balance || 0) + 0.002 }).eq('id', l2.id);
              if (l2.referred_by) {
                const { data: l3 } = await supabase.from('users').select('id, balance').eq('id', l2.referred_by).single();
                if (l3) await supabase.from('users').update({ balance: (l3.balance || 0) + 0.001 }).eq('id', l3.id);
              }
            }
          }
        }
      }
    }

    const { data: lv1 } = await supabase.from('users').select('id').eq('referred_by', String(targetUser.id));
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
      stats: { n1, c1: (n1 * 0.003).toFixed(4), n2, c2: (n2 * 0.002).toFixed(4), n3, c3: (n3 * 0.001).toFixed(4) }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}