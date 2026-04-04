const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const { TonClient, WalletContractV5R1, toNano, internal } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");

const app = express();
app.use(cors());
app.use(express.json());

/* --- [ CONFIGURACIÓN Y CONSTANTES ] --- */
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; 
const ADMIN_ID = "7517815832"; 
const PAYMENTS_CHANNEL = "-1002352835078"; 
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = "f8c2008d8ba557465e49df5bdd98eb987ef639a5ffabca82203c6d6f6b802fb5";
const CLOUDFLARE_SECRET = process.env.CLOUDFLARE_SECRET;

// Nuevas reglas financieras
const REWARDS = { level1: 0.003, level2: 0.002, level3: 0.001 };
const MIN_WITHDRAW = 0.01; 
const MAX_DAILY_WITHDRAW = 0.2;

/* --- [ FUNCIONES AUXILIARES DE SEGURIDAD ] --- */

async function notifyAdmin(adminMsg) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: ADMIN_ID,
      text: adminMsg,
      parse_mode: 'HTML'
    });
  } catch (e) { console.error("Error notifyAdmin"); }
}

async function verifyTurnstile(token) {
  try {
    if (!token || !CLOUDFLARE_SECRET) return false;
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      `secret=${CLOUDFLARE_SECRET}&response=${token}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.success;
  } catch (e) { return false; }
}

function isValidTonAddress(address) {
  // Validación básica de formato TON (Bounceable o Non-bounceable)
  return typeof address === 'string' && (address.startsWith('U') || address.startsWith('E')) && address.length === 48;
}

/* --- [ LÓGICA DE REGISTRO E IDENTIFICACIÓN ] --- */

app.post('/api/verify', async (req, res) => {
  try {
    const { user, start_param } = req.body;
    if (!user || !user.id) return res.status(400).json({ success: false });

    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers['user-agent'] || "unknown";
    const deviceHash = crypto.createHash('md5').update(userIp + userAgent).digest('hex');

    let { data: dbUser, error: fetchError } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    
    if (dbUser?.is_banned) {
      return res.json({ success: false, error: 'USER_BANNED', message: "Acceso denegado permanentemente." });
    }

    try {
        const pCheck = await axios.get(`https://proxycheck.io/v2/${userIp}?vpn=1`);
        if (pCheck.data[userIp]?.proxy === "yes") {
            await notifyAdmin(`🛡️ <b>VPN DETECTADA</b>\nUser: <code>${user.id}</code>\nIP: <code>${userIp}</code>`);
            return res.json({ success: false, error: 'PROXY_DETECTED', message: "Desactiva tu VPN para entrar." });
        }
    } catch (e) { console.log("ProxyCheck Skip"); }

    let isMember = false;
    try {
        const tgRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`);
        const status = tgRes.data.result?.status;
        isMember = ['member', 'administrator', 'creator'].includes(status);
    } catch (e) { isMember = false; }

    if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });

    if (!dbUser) {
      const { data: hashExists } = await supabase.from('users').select('id').eq('device_hash', deviceHash).maybeSingle();
      
      if (hashExists) {
        await supabase.from('users').insert([{ id: user.id, username: user.username, is_banned: true, device_hash: deviceHash }]);
        await notifyAdmin(`🚫 <b>MULTICUENTA DETECTADA</b>\nID: <code>${user.id}</code> intentó usar dispositivo de <code>${hashExists.id}</code>`);
        return res.json({ success: false, error: 'USER_BANNED' });
      }

      const referrerId = start_param ? parseInt(start_param) : null;
      const { data: newUser, error: insErr } = await supabase.from('users').insert([{
        id: user.id,
        username: user.username || 'user',
        referred_by: (referrerId && referrerId !== user.id) ? referrerId : null,
        balance: 0,
        device_hash: deviceHash,
        is_verified: true,
        is_banned: false
      }]).select().single();

      if (insErr) throw insErr;
      dbUser = newUser;

      const validRef = (referrerId && referrerId !== user.id) ? referrerId : null;
      if (validRef) {
          await supabase.rpc('increment_balance', { user_id: validRef, amount: REWARDS.level1 });
          const { data: p1 } = await supabase.from('users').select('referred_by').eq('id', validRef).maybeSingle();
          if (p1?.referred_by) {
              await supabase.rpc('increment_balance', { user_id: p1.referred_by, amount: REWARDS.level2 });
              const { data: p2 } = await supabase.from('users').select('referred_by').eq('id', p1.referred_by).maybeSingle();
              if (p2?.referred_by) {
                  await supabase.rpc('increment_balance', { user_id: p2.referred_by, amount: REWARDS.level3 });
              }
          }
      }
    } else {
        if (!dbUser.device_hash) {
            await supabase.from('users').update({ device_hash: deviceHash }).eq('id', user.id);
            dbUser.device_hash = deviceHash;
        }
    }

    const { data: l1 } = await supabase.from('users').select('id').eq('referred_by', user.id);
    const idsL1 = l1 ? l1.map(u => u.id) : [];
    let n2 = 0, n3 = 0;

    if (idsL1.length > 0) {
        const { data: l2 } = await supabase.from('users').select('id').in('referred_by', idsL1);
        const idsL2 = l2 ? l2.map(u => u.id) : [];
        n2 = idsL2.length;
        if (idsL2.length > 0) {
            const { data: l3 } = await supabase.from('users').select('id').in('referred_by', idsL2);
            n3 = l3 ? l3.length : 0;
        }
    }

    return res.json({ 
      success: true, 
      user: dbUser,
      stats: {
        n1: idsL1.length, n2, n3,
        c1: (idsL1.length * REWARDS.level1).toFixed(3),
        c2: (n2 * REWARDS.level2).toFixed(3),
        c3: (n3 * REWARDS.level3).toFixed(3)
      }
    });

  } catch (err) {
    console.error("Critical Error:", err.message);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

/* --- [ LÓGICA DE PAGOS Y RETIROS ] --- */

app.post('/api/withdraw', async (req, res) => {
    try {
        const { userId, address, captchaToken, amount } = req.body;
        const MNEMONIC = process.env.ADMIN_MNEMONIC;
        const cleanAddress = address?.trim();
        const withdrawAmount = parseFloat(amount);

        // 1. Validaciones estructurales
        if (!userId || !cleanAddress || isNaN(withdrawAmount)) return res.json({ success: false, error: "Datos incompletos o inválidos." });
        if (!isValidTonAddress(cleanAddress)) return res.json({ success: false, error: "La dirección de la billetera TON no es válida." });
        if (withdrawAmount < MIN_WITHDRAW) return res.json({ success: false, error: `El retiro mínimo es ${MIN_WITHDRAW} TON.` });
        if (!(await verifyTurnstile(captchaToken))) return res.json({ success: false, error: "Captcha inválido." });

        // 2. Verificar usuario y saldo base
        const { data: user, error: userErr } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (userErr || !user) return res.json({ success: false, error: "Usuario no encontrado" });
        if (user.is_banned) return res.json({ success: false, error: "Usuario no autorizado." });
        if (user.balance < withdrawAmount) return res.json({ success: false, error: "Saldo insuficiente." });

        // 3. Verificación de Límite Diario (Seguridad P2P)
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        const { data: todayWithdrawals } = await supabase
            .from('withdrawals')
            .select('amount')
            .eq('user_id', userId)
            .gte('created_at', startOfDay.toISOString());

        const dailyTotal = todayWithdrawals ? todayWithdrawals.reduce((sum, tx) => sum + tx.amount, 0) : 0;
        
        if ((dailyTotal + withdrawAmount) > MAX_DAILY_WITHDRAW) {
            const availableToday = Math.max(0, MAX_DAILY_WITHDRAW - dailyTotal).toFixed(3);
            return res.json({ success: false, error: `Límite de ${MAX_DAILY_WITHDRAW} TON diario excedido. Disponible hoy: ${availableToday} TON.` });
        }

        // 4. Ejecución en Blockchain
        // 4. Ejecución en Blockchain
        let txHash;
        try {
            const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
            const keyPair = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
            const wallet = client.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));
            
            // --- NUEVO: VERIFICAR FONDOS DE LA WALLET DEL BOT ---
            const balanceAdmin = await wallet.getBalance(); 
            const withdrawInNano = toNano(withdrawAmount.toString());
            const gasFeeReserve = toNano("0.01"); // Margen de seguridad para el gas de la red

            if (balanceAdmin < (withdrawInNano + gasFeeReserve)) {
                return res.json({ 
                    success: false, 
                    error: "El sistema de pagos está en mantenimiento o sin liquidez temporal. Intenta más tarde." 
                });
            }
            // -----------------------------------------------------

            const seqno = await wallet.getSeqno().catch(() => 0);
            
            const transfer = wallet.createTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                sendMode: 3,
                messages: [internal({ to: cleanAddress, value: withdrawInNano, bounce: false, body: "IA Profit" })]
            });

            await wallet.send(transfer);
            txHash = transfer.hash().toString('hex');
        } catch (tonError) {
            console.error("Error en red TON:", tonError.message);
            return res.json({ success: false, error: "Error en la red TON: Intenta más tarde." });
                             }

        // 5. Asentamiento en Base de Datos
        if (txHash) {
            try {
                await supabase.rpc('decrement_balance', { user_id: userId, amount: withdrawAmount });
                await supabase.from('withdrawals').insert([{ 
                    user_id: Number(userId), 
                    amount: withdrawAmount, 
                    status: 'SUCCESS', 
                    tx_hash: txHash, 
                    address: cleanAddress 
                }]);
            } catch (dbErr) {
                console.error("Pago enviado pero error en DB:", dbErr.message);
            }

            // 6. Notificación al Canal
            const messageText = 
                `💎 <b>PAGO VERIFICADO EXITOSAMENTE</b>\n\n` +
                `👤 <b>Beneficiario:</b> <a href="tg://user?id=${userId}">${user.username || 'Usuario'}</a>\n` +
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
            }).catch(e => console.log("Error Telegram"));

            return res.json({ success: true, txHash });
        }

    } catch (e) {
        console.error("CATCH FINAL:", e.message);
        return res.json({ success: false, error: "Error interno: " + e.message });
    }
});

/* --- [ ENDPOINT DE HISTORIAL ] --- */

app.get('/api/history', async (req, res) => {
  try {
    const { userId } = req.query;
    const { data: history } = await supabase.from('withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    res.json({ success: true, history: history || [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = app;
