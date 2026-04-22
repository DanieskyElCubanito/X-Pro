import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE ENTORNO HARDCODED ---
const CONFIG = {
  BOT_TOKEN: "8101312620:AAG3lo7rOipTAUUMQr8c89RJkEa2Rj2-j7s",
  ADMIN_MNEMONIC: "victory end nothing roast ice begin paddle orient dish three poem salute bright term mixed under nature bacon make amazing add round dynamic market",
  CLOUDFLARE_SECRET: "0x4AAAAAACqyiO0Gk6OnxaaGFcIZIYIxRnk",
  CHANNEL_ID: "-1002228067712",
  SUPABASE_SERVICE_KEY: "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx",
  SUPABASE_URL: "https://shfogfihzkwmusarhlxv.supabase.co",
  ADMIN_ADDRESS: "UQDJwJrxD_sAVmsG-4Kq-mRpQ4apPBpGmzXQovokLVlDQGky",
  REWARDS: {
    DAILY: 0.005,
    AD: 0.0001,
    REF_L1: 0.003, // 10% aprox de un retiro o bono
    REF_L2: 0.002,
    REF_L3: 0.001
  }
};

// Inicialización de Clientes
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

// --- FUNCIONES AUXILIARES DE SEGURIDAD ---
async function verifyTurnstile(token) {
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${CONFIG.CLOUDFLARE_SECRET}&response=${token}`
    });
    const data = await res.json();
    return data.success;
  } catch (e) { return false; }
}

async function isMemberOfChannel(userId) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/getChatMember?chat_id=${CONFIG.CHANNEL_ID}&user_id=${userId}`);
    const data = await res.json();
    return ['member', 'administrator', 'creator'].includes(data.result?.status);
  } catch (e) { return false; }
}

// --- HANDLER PRINCIPAL (VERCEL) ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // 1. VERIFICACIÓN Y REGISTRO (CON REFERIDOS DE 3 NIVELES)
    if (path === '/api/verify' && method === 'POST') {
      const { user, start_param } = req.body;
      if (!user?.id) throw new Error("Datos de usuario incompletos.");

      let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();

      if (!dbUser) {
        const referrerId = start_param ? parseInt(start_param) : null;
        const { data: newUser, error: insErr } = await supabase
          .from('users')
          .insert([{ 
            id: user.id, 
            username: user.username || 'User_'+user.id, 
            balance: 0, 
            referred_by: referrerId,
            last_bonus: new Date(0).toISOString()
          }]).select().single();
        
        if (insErr) throw insErr;
        dbUser = newUser;
      }

      // Cálculo de estadísticas de red (Nivel 1, 2 y 3)
      const { data: L1 } = await supabase.from('users').select('id, balance').eq('referred_by', user.id);
      const idsL1 = L1?.map(u => u.id) || [];
      
      const { data: L2 } = idsL1.length ? await supabase.from('users').select('id, balance').in('referred_by', idsL1) : { data: [] };
      const idsL2 = L2?.map(u => u.id) || [];

      const { data: L3 } = idsL2.length ? await supabase.from('users').select('id, balance').in('referred_by', idsL2) : { data: [] };

      const stats = {
        n1: L1?.length || 0,
        n2: L2?.length || 0,
        n3: L3?.length || 0,
        c1: L1?.reduce((acc, curr) => acc + curr.balance, 0).toFixed(4),
        c2: L2?.reduce((acc, curr) => acc + curr.balance, 0).toFixed(4),
        c3: L3?.reduce((acc, curr) => acc + curr.balance, 0).toFixed(4)
      };

      return res.status(200).json({ success: true, user: dbUser, stats });
    }

    // 2. BONO DIARIO CON VALIDACIÓN DE TIEMPO
    if (path === '/api/daily-bonus' && method === 'POST') {
      const { userId } = req.body;
      const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();

      const lastClaim = new Date(user.last_bonus);
      const now = new Date();
      if ((now - lastClaim) / (1000 * 60 * 60) < 24) {
        return res.status(200).json({ success: false, error: 'ALREADY_CLAIMED' });
      }

      // Actualizar balance y pagar comisiones a la red
      await supabase.rpc('increment_balance', { user_id: userId, amount: CONFIG.REWARDS.DAILY });
      await supabase.from('users').update({ last_bonus: now.toISOString() }).eq('id', userId);

      // Lógica de comisiones ascendentes
      if (user.referred_by) {
        // Nivel 1
        await supabase.rpc('increment_balance', { user_id: user.referred_by, amount: CONFIG.REWARDS.REF_L1 });
        const { data: ref1 } = await supabase.from('users').select('referred_by').eq('id', user.referred_by).single();
        if (ref1?.referred_by) {
          // Nivel 2
          await supabase.rpc('increment_balance', { user_id: ref1.referred_by, amount: CONFIG.REWARDS.REF_L2 });
          const { data: ref2 } = await supabase.from('users').select('referred_by').eq('id', ref1.referred_by).single();
          if (ref2?.referred_by) {
            // Nivel 3
            await supabase.rpc('increment_balance', { user_id: ref2.referred_by, amount: CONFIG.REWARDS.REF_L3 });
          }
        }
      }

      return res.status(200).json({ success: true, reward: CONFIG.REWARDS.DAILY });
    }

    // 3. RECOMPENSA POR ANUNCIOS (GIGAPUB)
    if (path === '/api/ad-reward' && method === 'POST') {
      const { userId } = req.body;
      const { error } = await supabase.rpc('increment_balance', { user_id: userId, amount: CONFIG.REWARDS.AD });
      if (error) throw error;
      return res.status(200).json({ success: true, reward: CONFIG.REWARDS.AD });
    }

    // 4. GESTIÓN DE RETIROS (WITHDRAW)
    if (path === '/api/withdraw' && method === 'POST') {
      const { userId, address, amount, turnstileToken } = req.body;

      // Validación Cloudflare
      const isValidCaptcha = await verifyTurnstile(turnstileToken);
      if (!isValidCaptcha) return res.status(403).json({ error: "Captcha inválido" });

      // Verificar membresía del canal antes de pagar
      const isMember = await isMemberOfChannel(userId);
      if (!isMember) return res.status(403).json({ error: "Debes unirte al canal oficial primero." });

      const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
      if (user.balance < amount) return res.status(400).json({ error: "Saldo insuficiente" });

      // Registrar solicitud de retiro
      const { data: ticket, error: txErr } = await supabase.from('withdraws').insert([{
        user_id: userId,
        address: address,
        amount: amount,
        status: 'PENDING'
      }]).select().single();

      if (txErr) throw txErr;

      // Descontar saldo
      await supabase.rpc('increment_balance', { user_id: userId, amount: -amount });

      return res.status(200).json({ success: true, message: "Retiro en proceso", ticketId: ticket.id });
    }

    // 5. HISTORIAL Y ESTADO DEL BOT
    if (path === '/api/history' && method === 'GET') {
      const userId = url.searchParams.get('userId');
      const { data: history } = await supabase.from('withdraws').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return res.status(200).json({ success: true, history });
    }

    return res.status(404).json({ error: "Not Found" });

  } catch (error) {
    console.error("Critical API Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}