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

// Reglas Financieras Actualizadas
const REWARDS = { level1: 0.003, level2: 0.002, level3: 0.001 };
const MIN_WITHDRAW = 0.01; 
const MAX_DAILY_WITHDRAW = 0.2;

// Definición de misiones (debe coincidir con el frontend)
const MISSIONS_DATA = [
  { id: 'm1', target: 1, reward: 0.0005 },
  { id: 'm2', target: 5, reward: 0.0025 },
  { id: 'm3', target: 10, reward: 0.0050 }
];

/* --- [ FUNCIONES AUXILIARES ] --- */
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

/* --- [ LÓGICA DE VERIFICACIÓN / REGISTRO ] --- */
app.post('/api/verify', async (req, res) => {
  try {
    const { user, start_param } = req.body;
    if (!user || !user.id) return res.status(400).json({ success: false });

    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers['user-agent'] || "unknown";
    const deviceHash = crypto.createHash('md5').update(userIp + userAgent).digest('hex');

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    
    if (dbUser?.is_banned) {
      return res.json({ success: false, error: 'USER_BANNED', message: "Acceso denegado." });
    }

    // Verificación de canal de Telegram
    let isMember = false;
    try {
        const tgRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`);
        isMember = ['member', 'administrator', 'creator'].includes(tgRes.data.result?.status);
    } catch (e) { isMember = false; }

    if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });

    if (!dbUser) {
      const referrerId = (start_param && parseInt(start_param) !== user.id) ? parseInt(start_param) : null;
      const { data: newUser, error: insErr } = await supabase.from('users').insert([{
        id: user.id,
        username: user.username || 'user',
        referred_by: referrerId,
        balance: 0,
        device_hash: deviceHash,
        is_verified: true
      }]).select().single();

      if (insErr) throw insErr;
      dbUser = newUser;

      if (referrerId) {
          await supabase.rpc('increment_balance', { user_id: referrerId, amount: REWARDS.level1 });
      }
    }

    // Estadísticas simplificadas para el ejemplo
    return res.json({ success: true, user: dbUser, stats: { n1: 0, n2: 0, n3: 0, c1: 0, c2: 0, c3: 0 } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

/* --- [ NUEVA LÓGICA DE MISIONES Y ANUNCIOS ] --- */

// 1. Registro de visualización (NO DA DINERO, SOLO ACTIVA COOLDOWN)
app.post('/api/ad-reward', async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Verificar cooldown de 1 hora para evitar spam de peticiones
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recentAds } = await supabase.from('ad_logs').select('id').eq('user_id', userId).gte('created_at', oneHourAgo);

        if (recentAds && recentAds.length > 0) {
            return res.json({ success: false, error: "COOLDOWN" });
        }

        // Solo insertamos el log. El balance NO se toca aquí.
        await supabase.from('ad_logs').insert([{ user_id: userId, amount: 0 }]);

        return res.json({ success: true, message: "Progreso guardado" });
    } catch (e) {
        return res.status(500).json({ success: false });
    }
});

// 2. Reclamar Misión (AQUÍ SÍ SE SUMA AL BALANCE)
app.post('/api/claim-mission', async (req, res) => {
    try {
        const { userId, missionId } = req.body;
        const mission = MISSIONS_DATA.find(m => m.id === missionId);

        if (!mission) return res.json({ success: false, error: "Misión inválida" });

        // Verificar si ya la reclamó hoy (suponiendo tabla 'mission_claims')
        const startOfDay = new Date();
        startOfDay.setUTCHours(0,0,0,0);
        
        const { data: alreadyClaimed } = await supabase.from('mission_claims')
            .select('id').eq('user_id', userId).eq('mission_id', missionId)
            .gte('created_at', startOfDay.toISOString()).maybeSingle();

        if (alreadyClaimed) return res.json({ success: false, error: "Ya reclamada hoy" });

        // Verificar si tiene los anuncios suficientes hoy
        const { data: adsToday } = await supabase.from('ad_logs')
            .select('id').eq('user_id', userId).gte('created_at', startOfDay.toISOString());

        if (adsToday.length < mission.target) {
            return res.json({ success: false, error: "No has visto suficientes anuncios" });
        }

        // Pagar la misión
        await supabase.rpc('increment_balance', { user_id: userId, amount: mission.reward });
        await supabase.from('mission_claims').insert([{ user_id: userId, mission_id: missionId }]);

        return res.json({ success: true, reward: mission.reward });
    } catch (e) {
        return res.status(500).json({ success: false });
    }
});

/* --- [ RETIROS Y OTROS ] --- */
// (Mantener tu lógica de /api/withdraw igual, ya que esa funciona correctamente)

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