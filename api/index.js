const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
const { TonClient, WalletContractV5R1, toNano, internal } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");

const app = express();
app.use(cors());
app.use(express.json());

/* --- [ CONFIGURACIÓN ] --- */
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; 
const ADMIN_ID = "7517815832"; 
const PAYMENTS_CHANNEL = "-1002352835078"; 
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = process.env.TON_API_KEY || "f8c2008d8ba557465e49df5bdd98eb987ef639a5ffabca82203c6d6f6b802fb5";
const CLOUDFLARE_SECRET = process.env.CLOUDFLARE_SECRET;

const REWARDS = { level1: 0.003, level2: 0.002, level3: 0.001 };
const AD_REWARD = 0.0001; 
const AD_LIMIT = 50; 
const MIN_WITHDRAW = 0.1; // Ajustado a 0.1
const MAX_DAILY_WITHDRAW = 1.0; // Ajustado a 1.0

/* --- [ UTILIDADES ] --- */
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
    return typeof address === 'string' && (address.startsWith('U') || address.startsWith('E')) && address.length >= 48;
}

/* --- [ API VERIFY ] --- */
app.post('/api/verify', async (req, res) => {
    try {
        const { user, start_param } = req.body;
        if (!user || !user.id) return res.status(400).json({ success: false, error: 'MISSING_DATA' });

        const userIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;

        let { data: dbUser, error: dbError } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
        if (dbError) throw dbError;

        if (dbUser?.is_banned) return res.json({ success: false, error: 'USER_BANNED', message: "Tu cuenta está suspendida." });

        const isAdmin = user.id.toString() === ADMIN_ID;

        if (!isAdmin) {
            try {
                const pCheck = await axios.get(`https://proxycheck.io/v2/${userIp}?vpn=1`);
                if (pCheck.data[userIp]?.proxy === "yes") return res.json({ success: false, error: 'PROXY_DETECTED', message: "Desactiva tu VPN." });
            } catch (e) {}
            try {
                const tgRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`);
                const isMember = ['member', 'administrator', 'creator'].includes(tgRes.data.result?.status);
                if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });
            } catch (e) {}
        }

        if (!dbUser) {
            const referrerId = (start_param && parseInt(start_param) !== user.id) ? parseInt(start_param) : null;
            const { data: newUser } = await supabase.from('users').insert([{
                id: user.id, username: user.username || 'user', referred_by: referrerId, balance: 0, is_banned: false
            }]).select().single();
            dbUser = newUser;

            if (referrerId) {
                await supabase.rpc('increment_balance', { user_id_param: referrerId, amount_param: REWARDS.level1 });
                const { data: p1 } = await supabase.from('users').select('referred_by').eq('id', referrerId).maybeSingle();
                if (p1?.referred_by) {
                    await supabase.rpc('increment_balance', { user_id_param: p1.referred_by, amount_param: REWARDS.level2 });
                    const { data: p2 } = await supabase.from('users').select('referred_by').eq('id', p1.referred_by).maybeSingle();
                    if (p2?.referred_by) await supabase.rpc('increment_balance', { user_id_param: p2.referred_by, amount_param: REWARDS.level3 });
                }
            }
        }

        const startOfDay = new Date(); startOfDay.setUTCHours(0,0,0,0);
        const { count: adsToday } = await supabase.from('ad_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfDay.toISOString());
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
            dailyStats: { adsWatched: adsToday || 0 },
            stats: { 
                n1: idsL1.length, n2, n3, 
                c1: (idsL1.length * REWARDS.level1).toFixed(4), 
                c2: (n2 * REWARDS.level2).toFixed(4), 
                c3: (n3 * REWARDS.level3).toFixed(4) 
            }
        });
    } catch (err) { return res.status(500).json({ success: false, error: 'SERVER_ERROR' }); }
});

/* --- [ ADS MULTINIVEL ] --- */
app.post('/api/ad-reward', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false });

        const startOfDay = new Date(); startOfDay.setUTCHours(0,0,0,0);
        const { count } = await supabase.from('ad_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startOfDay.toISOString());

        if (count >= AD_LIMIT) return res.json({ success: false, error: 'LIMIT_REACHED' });

        await supabase.from('ad_logs').insert([{ user_id: userId }]);
        await supabase.rpc('increment_balance', { user_id_param: userId, amount_param: AD_REWARD });

        const { data: user } = await supabase.from('users').select('referred_by').eq('id', userId).maybeSingle();
        if (user?.referred_by) {
            await supabase.rpc('increment_balance', { user_id_param: user.referred_by, amount_param: AD_REWARD });
            const { data: p1 } = await supabase.from('users').select('referred_by').eq('id', user.referred_by).maybeSingle();
            if (p1?.referred_by) {
                await supabase.rpc('increment_balance', { user_id_param: p1.referred_by, amount_param: AD_REWARD });
                const { data: p2 } = await supabase.from('users').select('referred_by').eq('id', p1.referred_by).maybeSingle();
                if (p2?.referred_by) await supabase.rpc('increment_balance', { user_id_param: p2.referred_by, amount_param: AD_REWARD });
            }
        }
        res.json({ success: true, reward: AD_REWARD });
    } catch (e) { res.status(500).json({ success: false }); }
});

/* --- [ RETIROS ] --- */
app.post('/api/withdraw', async (req, res) => {
    try {
        const { userId, address, captchaToken, amount } = req.body;
        const MNEMONIC = process.env.ADMIN_MNEMONIC;
        const cleanAddress = address?.trim();
        const withdrawAmount = parseFloat(amount);

        if (!userId || !cleanAddress || isNaN(withdrawAmount)) return res.json({ success: false, error: "Datos incompletos." });
        if (!isValidTonAddress(cleanAddress)) return res.json({ success: false, error: "Dirección TON inválida." });
        if (withdrawAmount < MIN_WITHDRAW) return res.json({ success: false, error: `Mínimo: ${MIN_WITHDRAW} TON.` });
        
        const isCaptchaValid = await verifyTurnstile(captchaToken);
        if (!isCaptchaValid) return res.json({ success: false, error: "Captcha inválido." });

        const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (!user || user.is_banned || user.balance < withdrawAmount) return res.json({ success: false, error: "Saldo insuficiente." });

        const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
        const { data: todayWithdrawals } = await supabase.from('withdrawals').select('amount').eq('user_id', userId).gte('created_at', startOfDay.toISOString());
        const dailyTotal = todayWithdrawals ? todayWithdrawals.reduce((sum, tx) => sum + tx.amount, 0) : 0;

        if ((dailyTotal + withdrawAmount) > MAX_DAILY_WITHDRAW) return res.json({ success: false, error: `Límite diario: ${MAX_DAILY_WITHDRAW} TON.` });

        // Bloqueo de saldo
        await supabase.rpc('decrement_balance', { user_id_param: userId, amount_param: withdrawAmount });

        let txHash = null;
        try {
            const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
            const keyPair = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
            const wallet = client.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));
            const initialSeqno = await wallet.getSeqno();

            await wallet.sendTransfer({
                seqno: initialSeqno,
                secretKey: keyPair.secretKey,
                sendMode: 3, 
                messages: [internal({ to: cleanAddress, value: toNano(withdrawAmount.toFixed(9)), bounce: false, body: "IA Profit Payment" })]
            });

            let attempts = 0;
            while (attempts < 15) { 
                await new Promise(r => setTimeout(r, 4000)); 
                if (await wallet.getSeqno() > initialSeqno) break;
                attempts++;
            }
            const transactions = await client.getTransactions(wallet.address, { limit: 1 });
            txHash = transactions[0]?.hash().toString('hex');
        } catch (tonError) {
            await supabase.rpc('increment_balance', { user_id_param: userId, amount_param: withdrawAmount });
            return res.json({ success: false, error: "Blockchain Error." });
        }

        if (txHash) {
            await supabase.from('withdrawals').insert([{ user_id: userId, amount: withdrawAmount, status: 'SUCCESS', tx_hash: txHash, address: cleanAddress }]);
            axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: PAYMENTS_CHANNEL,
                text: `💎 <b>PAGO EXITOSO</b>\n👤 ${user.username}\n💸 ${withdrawAmount} TON\n<a href="https://tonscan.org/tx/${txHash}">Ver Transacción</a>`,
                parse_mode: 'HTML'
            }).catch(() => {});
            return res.json({ success: true, txHash });
        } else {
            await supabase.rpc('increment_balance', { user_id_param: userId, amount_param: withdrawAmount });
            return res.json({ success: false, error: "No se confirmó la TX." });
        }
    } catch (e) { return res.json({ success: false }); }
});

app.get('/api/history', async (req, res) => {
    try {
        const { data } = await supabase.from('withdrawals').select('*').eq('user_id', req.query.userId).order('created_at', { ascending: false });
        res.json({ success: true, history: data || [] });
    } catch (e) { res.status(500).json({ success: false }); }
});

module.exports = app;
