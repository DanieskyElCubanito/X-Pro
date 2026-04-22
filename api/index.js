import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN INTEGRADA ---
const CONFIG = {
  BOT_TOKEN: "8101312620:AAG3lo7rOipTAUUMQr8c89RJkEa2Rj2-j7s",
  ADMIN_MNEMONIC: "victory end nothing roast ice begin paddle orient dish three poem salute bright term mixed under nature bacon make amazing add round dynamic market",
  CLOUDFLARE_SECRET: "0x4AAAAAACqyiO0Gk6OnxaaGFcIZIYIxRnk",
  CHANNEL_ID: "-1002228067712",
  SUPABASE_SERVICE_KEY: "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx",
  SUPABASE_URL: "https://shfogfihzkwmusarhlxv.supabase.co",
  REWARDS: {
    DAILY: 0.005,
    AD: 0.0001,
    REF_L1: 0.003,
    REF_L2: 0.002,
    REF_L3: 0.001
  }
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

// --- FUNCIONES DE APOYO ---
async function isMemberOfChannel(userId) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/getChatMember?chat_id=${CONFIG.CHANNEL_ID}&user_id=${userId}`);
    const data = await res.json();
    return ['member', 'administrator', 'creator'].includes(data.result?.status);
  } catch (e) { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // 1. VERIFICACIÓN Y REGISTRO
    if (path === '/api/verify' && req.method === 'POST') {
      const { user, start_param } = req.body;
      if (!user?.id) return res.status(400).json({ error: 'NO_USER' });

      let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();

      if (!dbUser) {
        const referrerId = start_param ? parseInt(start_param) : null;
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ 
            id: user.id, 
            username: user.username || `User_${user.id}`, 
            balance: 0, 
            referred_by: isNaN(referrerId) ? null : referrerId,
            last_bonus: new Date(0).toISOString()
          }])
          .select().single();

        if (createError) throw createError;
        dbUser = newUser;
      }

      // Red de 3 niveles
      const { data: L1 } = await supabase.from('users').select('id, balance').eq('referred_by', user.id);
      const idsL1 = L1?.map(u => u.id) || [];
      const { data: L2 } = idsL1.length ? await supabase.from('users').select('id, balance').in('referred_by', idsL1) : { data: [] };
      const idsL2 = L2?.map(u => u.id) || [];
      const { data: L3 } = idsL2.length ? await supabase.from('users').select('id, balance').in('referred_by', idsL2) : { data: [] };

      return res.status(200).json({
        success: true,
        user: dbUser,
        stats: {
          n1: L1?.length || 0, n2: L2?.length || 0, n3: L3?.length || 0,
          c1: L1?.reduce((a, b) => a + (b.balance || 0), 0).toFixed(4),
          c2: L2?.reduce((a, b) => a + (b.balance || 0), 0).toFixed(4),
          c3: L3?.reduce((a, b) => a + (b.balance || 0), 0).toFixed(4)
        }
      });
    }

    // 2. BONO DIARIO + COMISIONES ASCENDENTES
    if (path === '/api/daily-bonus' && req.method === 'POST') {
      const { userId } = req.body;
      const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();

      const lastClaim = new Date(user.last_bonus);
      if ((new Date() - lastClaim) / (1000 * 60 * 60) < 24) return res.status(200).json({ success: false, error: 'ALREADY_CLAIMED' });

      await supabase.rpc('increment_balance', { user_id: userId, amount: CONFIG.REWARDS.DAILY });
      await supabase.from('users').update({ last_bonus: new Date().toISOString() }).eq('id', userId);

      // Pagar a referidores (L1, L2, L3)
      if (user.referred_by) {
        await supabase.rpc('increment_balance', { user_id: user.referred_by, amount: CONFIG.REWARDS.REF_L1 });
        const { data: r1 } = await supabase.from('users').select('referred_by').eq('id', user.referred_by).single();
        if (r1?.referred_by) {
          await supabase.rpc('increment_balance', { user_id: r1.referred_by, amount: CONFIG.REWARDS.REF_L2 });
          const { data: r2 } = await supabase.from('users').select('referred_by').eq('id', r1.referred_by).single();
          if (r2?.referred_by) await supabase.rpc('increment_balance', { user_id: r2.referred_by, amount: CONFIG.REWARDS.REF_L3 });
        }
      }
      return res.status(200).json({ success: true, reward: CONFIG.REWARDS.DAILY });
    }

    // 3. ANUNCIOS
    if (path === '/api/ad-reward' && req.method === 'POST') {
      const { userId } = req.body;
      await supabase.rpc('increment_balance', { user_id: userId, amount: CONFIG.REWARDS.AD });
      return res.status(200).json({ success: true });
    }

    // 4. HISTORIAL
    if (path === '/api/history' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      const { data } = await supabase.from('withdraws').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return res.status(200).json({ success: true, history: data || [] });
    }

    return res.status(404).json({ error: 'NOT_FOUND' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}