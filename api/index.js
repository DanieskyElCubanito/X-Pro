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

// Reglas Financieras
const REWARDS = { level1: 0.003, level2: 0.002, level3: 0.001 };
const MIN_WITHDRAW = 0.01; 
const MAX_DAILY_WITHDRAW = 0.2;

// Definición de Misiones (Debe coincidir con el Frontend)
const MISSIONS_DATA = [
  { id: 'm1', target: 1, reward: 0.0005 },
  { id: 'm2', target: 5, reward: 0.0025 },
  { id: 'm3', target: 10, reward: 0.0050 }
];

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

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    
    if (dbUser?.is_banned) {
      return res.json({ success: false, error: 'USER_BANNED', message: "Acceso denegado permanentemente." });
    }

    // Verificación de Proxy/VPN
    try {
        const pCheck = await axios.get(`https://proxycheck.io/v2/${userIp}?vpn=1`);
        if (pCheck.data[userIp]?.proxy === "yes") {
            await notifyAdmin(`🛡️ <b>VPN DETECTADA</b>\nUser: <code>${user.id}</code>\nIP: <code>${userIp}</code>`);
            return res.json({ success: false, error: 'PROXY_DETECTED', message: "Desactiva tu VPN para entrar." });
        }
    } catch (e) { console.log("ProxyCheck Skip"); }

    // Verificación de canal de Telegram
    let isMember = false;
    try {
        const tgRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`);
        isMember = ['member', 'administrator', 'creator'].includes(tgRes.data.result?.status);
    } catch (e) { isMember = false; }

    if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });

    // Lógica de Nuevo Usuario y Referidos (Nivel 1, 2 y 3)
    if (!dbUser) {
      const { data: hashExists } = await supabase.from('users').select('id').eq('device_hash', deviceHash).maybeSingle();
      
      if (hashExists) {
        await supabase.from('users').insert([{ id: user.id, username: user.username, is_banned: true, device_hash: deviceHash }]);
        await notifyAdmin(`🚫 <b>MULTICUENTA DETECTADA</b>\nID: <code>${user.id}</code> usó dispositivo de <code>${hashExists.id}</code>`);
        return res.json({ success: false, error: 'USER_BANNED' });
      }

      const referrerId = (start_param && parseInt(start_param) !== user.id) ? parseInt(start_param) : null;
      
      const { data: newUser, error: insErr } = await supabase.from('users').insert([{
        id: user.id,
        username: user.username || 'user',
        referred_by: referrerId,
        balance: 0,
        device_hash: deviceHash,
        is_verified: true,
        is_banned: false
      }]).select().single();

      if (insErr) throw insErr;
      dbUser = newUser;

      // PAGO DE REFERIDOS EN CADENA
      if (referrerId) {
          await supabase.rpc('increment_balance', { user_id: referrerId, amount: REWARDS.level1 });
          const { data: p1 } = await supabase.from('users').select('referred_by').eq('id', referrerId).maybeSingle();
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

    // CÁLCULO DE ESTADÍSTICAS PARA EL FRONTEND
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

/* --- [ LÓGICA DE MISIONES Y ANUNCIOS ] --- */

// Endpoint para registrar que vio un anuncio (SIN RECOMPENSA DIRECTA)
app.post('/api/ad-reward', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false });

        const { data: user } = await supabase.from('users').select('is_banned').eq('id', userId).maybeSingle();
        if (!user || user.is_banned) return res.json({ success: false, error: "BANNED" });

        // Solo insertamos el log con amount 0. El cooldown de 1 hora es opcional aquí.
        await supabase.from('ad_logs').insert([{ user_id: userId, amount: 0 }]);

        return res.json({ success: true, message: "Progreso actualizado" });
    } catch (e) {
        return res.status(500).json({ success: false });
    }
});

// Endpoint para RECLAMAR el premio de la misión
app.post('/api/claim-mission', async (req, res) => {
    try {
        const { userId, missionId } = req.body;
        const mission = MISSIONS_DATA.find(m => m.id === missionId);
        if (!mission) return res.json({ success: false, error: "MISSION_INVALID" });

        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        // 1. Verificar si ya la reclamó hoy
        const { data: claimed } = await supabase.from('mission_claims')
            .select('id').eq('user_id', userId).eq('mission_id', missionId)
            .gte('created_at', startOfDay.toISOString()).maybeSingle();

        if (claimed) return res.json({ success: false, error: "ALREADY_CLAIMED" });

        // 2. Verificar si tiene suficientes anuncios hoy
        const { data: adsToday } = await supabase.from('ad_logs')
            .select('id').eq('user_id', userId).gte('created_at', startOfDay.toISOString());

        if (!adsToday || adsToday.length < mission.target) {
            return res.json({ success: false, error: "NOT_ENOUGH_ADS" });
        }

        // 3. Pagar y registrar
        await supabase.rpc('increment_balance', { user_id: userId, amount: mission.reward });
        await supabase.from('mission_claims').insert([{ user_id: userId, mission_id: missionId }]);

        return res.json({ success: true, reward: mission.reward });
    } catch (e) {
        return res.status(500).json({ success: false });
    }
});

/* --- [ LÓGICA DE RETIROS ] --- */

app.post('/api/withdraw', async (req, res) => {
    try {
        const { userId, address, captchaToken, amount } = req.body;
        const MNEMONIC = process.env.ADMIN_MNEMONIC;
        const cleanAddress = address?.trim();
        const withdrawAmount = parseFloat(amount);

        if (!userId || !cleanAddress || isNaN(withdrawAmount)) return res.json({ success: false, error: "Datos incompletos." });
        if (!isValidTonAddress(cleanAddress)) return res.json({ success: false, error: "Dirección TON inválida." });
        if (withdrawAmount < MIN_WITHDRAW) return res.json({ success: false, error: `Mínimo: ${MIN_WITHDRAW} TON.` });
        if (!(await verifyTurnstile(captchaToken))) return res.json({ success: false, error: "Captcha inválido." });

        const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (!user || user.is_banned || user.balance < withdrawAmount) {
            return res.json({ success: false, error: "Saldo insuficiente o usuario baneado." });
        }

        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const { data: todayWithdrawals } = await supabase.from('withdrawals').select('amount')
            .eq('user_id', userId).gte('created_at', startOfDay.toISOString());
        const dailyTotal = todayWithdrawals ? todayWithdrawals.reduce((sum, tx) => sum + tx.amount, 0) : 0;
        
        if ((dailyTotal + withdrawAmount) > MAX_DAILY_WITHDRAW) {
            return res.json({ success: false, error: `Límite diario: ${MAX_DAILY_WITHDRAW} TON.` });
        }

        let txHash = null;
        try {
            const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
            const keyPair = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
            const wallet = client.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));
            
            const balanceAdmin = await wallet.getBalance(); 
            const withdrawInNano = toNano(withdrawAmount.toString());
            if (balanceAdmin < (withdrawInNano + toNano("0.02"))) {
                return res.json({ success: false, error: "Bóveda sin liquidez. Intente más tarde." });
            }

            const initialSeqno = await wallet.getSeqno();
            const transfer = wallet.createTransfer({
                seqno: initialSeqno,
                secretKey: keyPair.secretKey,
                sendMode: 3,
                messages: [internal({ to: cleanAddress, value: withdrawInNano, bounce: false, body: "IA Profit Payment" })]
            });
            await wallet.send(transfer);

            let currentSeqno = initialSeqno;
            let attempts = 0;
            while (currentSeqno === initialSeqno && attempts < 15) { 
                await new Promise(r => setTimeout(r, 2000)); 
                currentSeqno = await wallet.getSeqno();
                attempts++;
            }

            if (currentSeqno === initialSeqno) throw new Error("La red TON no confirmó la salida.");

            const transactions = await client.getTransactions(wallet.address, { limit: 1 });
            txHash = transactions[0]?.hash().toString('hex');
        } catch (tonError) {
            return res.json({ success: false, error: "Error Blockchain: " + tonError.message });
        }

        if (txHash) {
            await supabase.rpc('decrement_balance', { user_id: userId, amount: withdrawAmount });
            await supabase.from('withdrawals').insert([{ 
                user_id: Number(userId), amount: withdrawAmount, status: 'SUCCESS', tx_hash: txHash, address: cleanAddress 
            }]);

            const messageText = `💎 <b>PAGO VERIFICADO</b>\n\n👤 <b>Beneficiario:</b> ${user.username}\n💸 <b>Monto:</b> ${withdrawAmount} TON\n🔹 <a href="https://tonscan.org/tx/${txHash}">Ver Transacción</a>`;
          
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: PAYMENTS_CHANNEL,
                text: messageText,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }).catch(e => console.log("Error Notify"));

            return res.json({ success: true, txHash });
        }
    } catch (e) {
        return res.json({ success: false, error: "Error crítico: " + e.message });
    }
});

/* --- [ HISTORIAL ] --- */
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