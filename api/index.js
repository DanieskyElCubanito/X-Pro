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

// Inicialización de Supabase
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  // 1. Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // --- RUTA: VERIFICACIÓN / REGISTRO ---
    if (path === '/api/verify' && method === 'POST') {
      const { user, start_param } = req.body;
      if (!user?.id) return res.status(400).json({ error: "No user data" });

      // Buscar o crear usuario
      let { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!dbUser) {
        // Lógica de referidos (start_param suele ser el ID del que invita)
        const referrerId = start_param ? parseInt(start_param) : null;
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ 
            id: user.id, 
            username: user.username || 'Anon', 
            balance: 0, 
            referred_by: referrerId,
            last_bonus: new Date(0).toISOString()
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        dbUser = newUser;

        // Si hay referido, podrías añadir una lógica aquí para notificar al sistema
      }

      // Obtener estadísticas de red (Niveles 1, 2 y 3)
      // Nota: Esta es una consulta simplificada, requiere lógica recursiva o tablas de red
      const stats = { n1: 0, n2: 0, n3: 0, c1: "0.000", c2: "0.000", c3: "0.000" };

      return res.status(200).json({ 
        success: true, 
        user: dbUser,
        stats: stats 
      });
    }

    // --- RUTA: BONO DIARIO ---
    if (path === '/api/daily-bonus' && method === 'POST') {
      const { userId } = req.body;
      const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();

      if (!user) return res.status(404).json({ error: "User not found" });

      const lastClaim = new Date(user.last_bonus);
      const now = new Date();
      const diffHours = (now - lastClaim) / (1000 * 60 * 60);

      if (diffHours < 24) {
        return res.status(200).json({ success: false, error: 'ALREADY_CLAIMED' });
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          balance: user.balance + CONFIG.REWARDS.DAILY, 
          last_bonus: now.toISOString() 
        })
        .eq('id', userId);

      if (updateError) throw updateError;
      return res.status(200).json({ success: true, reward: CONFIG.REWARDS.DAILY });
    }

    // --- RUTA: RECOMPENSA POR ANUNCIO ---
    if (path === '/api/ad-reward' && method === 'POST') {
      const { userId } = req.body;
      const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();

      if (!user) return res.status(404).json({ error: "User not found" });

      const { error: adError } = await supabase
        .from('users')
        .update({ balance: user.balance + CONFIG.REWARDS.AD })
        .eq('id', userId);

      if (adError) throw adError;
      return res.status(200).json({ success: true, reward: CONFIG.REWARDS.AD });
    }

    // --- RUTA: HISTORIAL ---
    if (path === '/api/history' && method === 'GET') {
      const userId = url.searchParams.get('userId');
      const { data: history, error } = await supabase
        .from('withdraws')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return res.status(200).json({ success: true, history: history || [] });
    }

    // Si la ruta no coincide
    return res.status(404).json({ error: "Endpoint not found" });

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}