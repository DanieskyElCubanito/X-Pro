import { createClient } from '@supabase/supabase-js';

const CONFIG = {
  BOT_TOKEN: "8101312620:AAG3lo7rOipTAUUMQr8c89RJkEa2Rj2-j7s",
  SUPABASE_SERVICE_KEY: "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx",
  SUPABASE_URL: "https://shfogfihzkwmusarhlxv.supabase.co",
  REWARDS: {
    AD: 0.0001, // Lo que gana por cada anuncio
  }
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  // Configuración de CORS para permitir peticiones desde el frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Detectar la ruta exacta de la petición
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // --- 1. RUTA: VERIFICAR / REGISTRAR USUARIO ---
    if (path === '/api/verify' && req.method === 'POST') {
      const { user, start_param } = req.body;
      if (!user?.id) return res.status(400).json({ error: 'ID de usuario requerido' });

      let { data: dbUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!dbUser) {
        const referrerId = (start_param && !isNaN(start_param)) ? parseInt(start_param) : null;
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ 
            id: user.id, 
            username: user.username || `User_${user.id}`, 
            balance: 0, 
            referred_by: referrerId,
            last_bonus: new Date(0).toISOString(),
            ads_watched: 0
          }])
          .select().single();

        if (createError) throw createError;
        dbUser = newUser;
      }

      // Obtener estadísticas de referidos nivel 1
      const { data: L1 } = await supabase.from('users').select('balance').eq('referred_by', user.id);

      return res.status(200).json({ 
        success: true, 
        user: dbUser, 
        stats: {
          n1: L1?.length || 0,
          n2: 0,
          n3: 0,
          c1: L1?.reduce((a, b) => a + (b.balance || 0), 0).toFixed(4) || "0.0000",
          c2: "0.0000",
          c3: "0.0000"
        } 
      });
    }

    // --- 2. RUTA: RECOMPENSA POR VER ANUNCIO ---
    if (path === '/api/ad-reward' && req.method === 'POST') {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'ID de usuario requerido' });

      // Obtener datos actuales
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance, ads_watched')
        .eq('id', userId)
        .single();

      if (userError || !user) throw new Error("Usuario no encontrado");

      const newBalance = (user.balance || 0) + CONFIG.REWARDS.AD;
      const newAdsCount = (user.ads_watched || 0) + 1;

      // Actualizar en base de datos
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          balance: newBalance, 
          ads_watched: newAdsCount 
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      return res.status(200).json({ 
        success: true, 
        newBalance: newBalance, 
        newAdsCount: newAdsCount 
      });
    }

    // --- 3. RUTA: PROCESAR RETIRO ---
    if (path === '/api/withdraw' && req.method === 'POST') {
      const { userId, address, amount } = req.body;
      
      if (!userId || !address || !amount) {
        return res.status(400).json({ error: 'Faltan datos para el retiro' });
      }

      // Verificar saldo suficiente
      const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
      
      if (!user || user.balance < amount) {
        return res.status(400).json({ error: 'Saldo insuficiente' });
      }

      // 1. Descontar saldo del usuario
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: user.balance - amount })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 2. (Opcional) Registrar el retiro en una tabla de auditoría si la tienes
      // await supabase.from('withdrawals').insert([{ user_id: userId, address, amount, status: 'pending' }]);

      return res.status(200).json({ success: true, message: 'Retiro procesado' });
    }

    // Si no entra en ninguna ruta
    return res.status(404).json({ error: 'Ruta no encontrada en el API' });

  } catch (error) {
    console.error("Error en el servidor:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}