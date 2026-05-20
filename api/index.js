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
const PAYMENTS_CHANNEL = "-1002352835078";
const ADMIN_MNEMONIC = "gap chest saddle logic gesture better vapor chicken major math way clinic quick hero host rule bulb image there gallery sniff ecology will film";

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

    // --- ACCIÓN: VERIFICAR HUMANO ---
    if (action === 'verify-human') {
      if (!captchaToken) return res.status(400).json({ error: 'Falta el token de seguridad' });

      // Verificamos nuestra clave de seguridad interna nativa
      if (captchaToken !== 'app-verified-fast') {
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

      if (!u || u.balance < withdrawAmount) return res.status(400).json({ error: 'Saldo insuficiente en tu cuenta' });
      if (withdrawAmount < 0.25) return res.status(400).json({ error: 'Mínimo 0.25 TON' });

      let txHash = null;
      try {
        const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
        const keyPair = await mnemonicToPrivateKey(ADMIN_MNEMONIC.trim().split(/\s+/));
        const wallet = client.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));

        const walletContract = client.open(wallet);
        const walletBalance = await walletContract.getBalance();
        const amountInNano = toNano(withdrawAmount.toString());
        const feeReserve = toNano('0.05');

        if (walletBalance < (amountInNano + feeReserve)) {
          return res.status(500).json({ 
            error: "El sistema está en mantenimiento de liquidez. Intenta más tarde." 
          });
        }

        const seqno = await wallet.getSeqno();

        await wallet.sendTransfer({
          seqno,
          secretKey: keyPair.secretKey,
          messages: [internal({
            to: address.trim(),
            value: amountInNano, 
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

        const displayName = u.username ? `@${u.username}` : userId;
        const messageText = `<b>💎 PAGO VERIFICADO EXITOSAMENTE</b>\n\n` +
                            `👤 <b>Beneficiario:</b> ${displayName}\n` +
                            `💸 <b>Monto Total:</b> ${withdrawAmount} TON\n` +
                            `🛡️ <b>Red:</b> Toncoin (Ton)\n` +
                            `⚡ <b>Estado:</b> Finalizado / 100%\n\n` +
                            `🔹 <b>TXID:</b>\n<a href="https://tonscan.org/tx/${txHash}">${txHash}</a>\n\n` +
                            `🔥 <i>¡Retiros procesados con total transparencia!</i>`;

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: PAYMENTS_CHANNEL,
            text: messageText,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [[
                { text: "💰 ¡QUIERO GANAR TON AHORA!", url: "https://t.me/IAProfitTonBot/app" }
              ]]
            }
        }).catch(e => console.log("Error enviando a canal de pagos"));

        return res.status(200).json({ success: true, txHash });
      }
    }

    // --- ACCIÓN: REGISTRO / LOGIN ---
    const targetUser = user || { id: userId };
    const targetId = String(targetUser.id);
    if (!targetId || targetId === 'undefined') return res.status(400).json({ error: 'No user id' });

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();

    if (!dbUser) {
      const newUserObj = { 
        id: targetId, 
        username: targetUser.username || 'Usuario', 
        balance: 0,
        is_human: false
      };

      if (start_param && String(start_param) !== targetId) {
        newUserObj.referred_by = String(start_param);
      }

      const { data: newUser, error: insertError } = await supabase.from('users').insert([newUserObj]).select().single();

      if (!insertError && newUser) {
        dbUser = newUser;

        // 3. Distribución de comisiones con PROTECCIÓN ANTI-BUCLE
        if (dbUser.referred_by) {
          const { data: l1 } = await supabase.from('users').select('id, balance, referred_by').eq('id', dbUser.referred_by).single();
          if (l1) {
            // PAGO NIVEL 1: 0.003
            await supabase.from('users').update({ balance: Number(l1.balance || 0) + 0.003 }).eq('id', l1.id);

            // Verifica que Nivel 2 exista y NO sea la misma persona que el Nivel 1 ni el usuario actual
            if (l1.referred_by && String(l1.referred_by) !== String(l1.id) && String(l1.referred_by) !== targetId) {
              const { data: l2 } = await supabase.from('users').select('id, balance, referred_by').eq('id', l1.referred_by).single();
              if (l2) {
                // PAGO NIVEL 2: 0.002
                await supabase.from('users').update({ balance: Number(l2.balance || 0) + 0.002 }).eq('id', l2.id);

                // Verifica que Nivel 3 exista y no rompa la cadena
                if (l2.referred_by && String(l2.referred_by) !== String(l2.id) && String(l2.referred_by) !== String(l1.id) && String(l2.referred_by) !== targetId) {
                  const { data: l3 } = await supabase.from('users').select('id, balance').eq('id', l2.referred_by).single();
                  if (l3) {
                    // PAGO NIVEL 3: 0.001
                    await supabase.from('users').update({ balance: Number(l3.balance || 0) + 0.001 }).eq('id', l3.id);
                  }
                }
              }
            }
          }
        }
      } else {
        const { data: retryUser } = await supabase.from('users').select('*').eq('id', targetId).single();
        dbUser = retryUser;
      }
    }

   // 4. Estadísticas de referidos
    const { data: lv1 } = await supabase.from('users').select('id').eq('referred_by', targetId);
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

    // Verificación de membresía en los canales
    const isMember1 = await checkMembership(targetId, "-1002228067712");
    const isMember2 = await checkMembership(targetId, "-1002049802477");

    // Respuesta única al frontend
    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { n1, c1: (n1 * 0.003).toFixed(4), n2, c2: (n2 * 0.002).toFixed(4), n3, c3: (n3 * 0.001).toFixed(4) },
      channels: {
        c1: isMember1,
        c2: isMember2
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}