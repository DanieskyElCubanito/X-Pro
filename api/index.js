/**
 * IA PROFIT TON - CORE BACKEND ENGINE (V7.1)
 * Unificado: Pagos Históricos + Seguridad Avanzada + Turnstile
 */

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

const REWARDS = { level1: 0.003, level2: 0.002, level3: 0.001 };
const LIMITS = { minWithdraw: 0.01, maxDaily: 0.20 };

/* --- [ FUNCIONES AUXILIARES ] --- */

async function notifyAdmin(msg) {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: ADMIN_ID, text: `🛡️ <b>SYSTEM:</b>\n${msg}`, parse_mode: 'HTML'
        });
    } catch (e) { console.error("Admin Notify Error"); }
}

async function verifyTurnstile(token) {
    try {
        if (!token || !CLOUDFLARE_SECRET) return false;
        const res = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', 
            `secret=${CLOUDFLARE_SECRET}&response=${token}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        return res.data.success;
    } catch (e) { return false; }
}

function isValidTonAddress(address) {
    return typeof address === 'string' && (address.startsWith('U') || address.startsWith('E')) && address.length === 48;
}

/* --- [ ENDPOINT: VERIFY & REGISTRO UNIFICADO ] --- */

app.post('/api/verify', async (req, res) => {
    try {
        const { user, start_param } = req.body;
        if (!user || !user.id) return res.status(400).json({ success: false });

        const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
        const deviceHash = crypto.createHash('md5').update(userIp + (req.headers['user-agent'] || "")).digest('hex');

        // 1. Obtener usuario y chequear baneo
        let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
        if (dbUser?.is_banned) return res.json({ success: false, error: 'BANNED', message: "Cuenta suspendida." });

        // 2. Anti-VPN (Bypass para Admin)
        if (user.id.toString() !== ADMIN_ID) {
            try {
                const pCheck = await axios.get(`https://proxycheck.io/v2/${userIp}?vpn=1`);
                if (pCheck.data[userIp]?.proxy === "yes") return res.json({ success: false, error: 'VPN_DETECTED' });
            } catch (e) {}
        }

        // 3. Suscripción Telegram
        try {
            const tgRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`);
            const status = tgRes.data.result?.status;
            if (!['member', 'administrator', 'creator'].includes(status)) return res.json({ success: false, error: 'NOT_MEMBER' });
        } catch (e) { return res.json({ success: false, error: 'TG_ERROR' }); }

        // 4. Lógica de Registro / Multicuenta
        if (!dbUser) {
            const { data: multicuenta } = await supabase.from('users').select('id').eq('device_hash', deviceHash).maybeSingle();
            if (multicuenta) {
                await supabase.from('users').insert([{ id: user.id, is_banned: true, device_hash: deviceHash }]);
                await notifyAdmin(`🚫 <b>Multicuenta:</b> ${user.id} ligada a ${multicuenta.id}`);
                return res.json({ success: false, error: 'BANNED' });
            }

            const refId = (start_param && parseInt(start_param) !== user.id) ? parseInt(start_param) : null;

            const { data: newUser, error: insErr } = await supabase.from('users').insert([{
                id: user.id, username: user.username || 'user', referred_by: refId, balance: 0, device_hash: deviceHash
            }]).select().single();
            if (insErr) throw insErr;
            dbUser = newUser;

            // PAGOS AUTOMÁTICOS A LA RED (3 Niveles con Logs)
            if (refId) {
                // Nivel 1
                await supabase.rpc('increment_balance', { user_id_param: refId, amount_param: REWARDS.level1 });
                await supabase.from('referral_history').insert([{ mentor_id: refId, student_id: user.id, level: 1, amount: REWARDS.level1 }]);
                
                // Nivel 2
                const { data: m1 } = await supabase.from('users').select('referred_by').eq('id', refId).maybeSingle();
                if (m1?.referred_by) {
                    await supabase.rpc('increment_balance', { user_id_param: m1.referred_by, amount_param: REWARDS.level2 });
                    await supabase.from('referral_history').insert([{ mentor_id: m1.referred_by, student_id: user.id, level: 2, amount: REWARDS.level2 }]);
                    
                    // Nivel 3
                    const { data: m2 } = await supabase.from('users').select('referred_by').eq('id', m1.referred_by).maybeSingle();
                    if (m2?.referred_by) {
                        await supabase.rpc('increment_balance', { user_id_param: m2.referred_by, amount_param: REWARDS.level3 });
                        await supabase.from('referral_history').insert([{ mentor_id: m2.referred_by, student_id: user.id, level: 3, amount: REWARDS.level3 }]);
                    }
                }
            }
        }

        // 5. Estadísticas reales basadas en historial
        const { data: history } = await supabase.from('referral_history').select('level, amount').eq('mentor_id', user.id);
        const stats = {
            n1: history ? history.filter(h => h.level === 1).length : 0,
            n2: history ? history.filter(h => h.level === 2).length : 0,
            n3: history ? history.filter(h => h.level === 3).length : 0,
            c1: history ? history.filter(h => h.level === 1).reduce((s, c) => s + c.amount, 0).toFixed(4) : 0,
            c2: history ? history.filter(h => h.level === 2).reduce((s, c) => s + c.amount, 0).toFixed(4) : 0,
            c3: history ? history.filter(h => h.level === 3).reduce((s, c) => s + c.amount, 0).toFixed(4) : 0
        };

        return res.json({ success: true, user: dbUser, stats, limits: LIMITS });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
});

/* --- [ RETIROS CON VERIFICACIÓN TURNSTILE Y BLOCKCHAIN ] --- */

app.post('/api/withdraw', async (req, res) => {
    try {
        const { userId, address, amount, captchaToken } = req.body;
        const MNEMONIC = process.env.ADMIN_MNEMONIC;
        const cleanAmount = parseFloat(amount);

        // Validaciones base
        if (!isValidTonAddress(address)) return res.json({ success: false, error: "Dirección inválida" });
        if (cleanAmount < LIMITS.minWithdraw) return res.json({ success: false, error: "Monto menor al mínimo" });
        if (!(await verifyTurnstile(captchaToken))) return res.json({ success: false, error: "Captcha fallido" });

        const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (!user || user.balance < cleanAmount || user.is_banned) return res.json({ success: false, error: "Saldo insuficiente" });

        // Límite diario
        const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
        const { data: dailyW } = await supabase.from('withdrawals').select('amount').eq('user_id', userId).gte('created_at', startOfDay.toISOString());
        const spentToday = dailyW ? dailyW.reduce((s, w) => s + w.amount, 0) : 0;
        if (spentToday + cleanAmount > LIMITS.maxDaily) return res.json({ success: false, error: "Límite diario excedido" });

        // Ejecución TON
        const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
        const keyPair = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
        const wallet = client.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));

        const adminBalance = await wallet.getBalance();
        if (adminBalance < toNano(cleanAmount + 0.05)) return res.json({ success: false, error: "Bóveda sin liquidez" });

        const initialSeqno = await wallet.getSeqno();
        const transfer = wallet.createTransfer({
            seqno: initialSeqno,
            secretKey: keyPair.secretKey,
            sendMode: 3,
            messages: [internal({ to: address, value: toNano(cleanAmount.toString()), bounce: false, body: "IA Profit Payment" })]
        });
        await wallet.send(transfer);

        // Esperar confirmación
        let attempts = 0;
        while (attempts < 15) {
            await new Promise(r => setTimeout(r, 2000));
            if (await wallet.getSeqno() > initialSeqno) break;
            attempts++;
        }

        const transactions = await client.getTransactions(wallet.address, { limit: 1 });
        const txHash = transactions[0]?.hash().toString('hex');

        if (txHash) {
            await supabase.rpc('decrement_balance', { user_id_param: userId, amount_param: cleanAmount });
            await supabase.from('withdrawals').insert([{ user_id: userId, amount: cleanAmount, tx_hash: txHash, address, status: 'SUCCESS' }]);

            // Notificación al Canal
            const msg = `💎 <b>PAGO VERIFICADO</b>\n\n👤 <b>User:</b> <code>${user.username}</code>\n💸 <b>Monto:</b> ${cleanAmount} TON\n⚡ <b>Estado:</b> Finalizado\n🔹 <b>TXID:</b> <a href="https://tonscan.org/tx/${txHash}">Ver Transacción</a>`;
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: PAYMENTS_CHANNEL, text: msg, parse_mode: 'HTML', disable_web_page_preview: true
            });

            return res.json({ success: true, txHash });
        }
        throw new Error("TX_NOT_FOUND");
    } catch (e) {
        return res.json({ success: false, error: "Error: " + e.message });
    }
});

module.exports = app;