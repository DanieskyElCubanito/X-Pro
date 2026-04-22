import { createClient } from '@supabase/supabase-js';

const CONFIG = {
  BOT_TOKEN: "8101312620:AAG3lo7rOipTAUUMQr8c89RJkEa2Rj2-j7s",
  SUPABASE_SERVICE_KEY: "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx",
  SUPABASE_URL: "https://shfogfihzkwmusarhlxv.supabase.co",
  REWARDS: { DAILY: 0.005, AD: 0.0001, REF_L1: 0.003, REF_L2: 0.002, REF_L3: 0.001 }
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  // CORS obligatorio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  try {
    if (path === '/api/verify' && req.method === 'POST') {
      const { user, start_param } = req.body;

      if (!user || !user.id) {
        return res.status(400).json({ success: false, error: 'Faltan datos del usuario (ID)' });
      }

      // 1. Intentar obtener el usuario (con manejo de error específico)
      const { data: dbUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 es "no encontrado", eso no es un error
        return res.status(500).json({ success: false, error: 'Error al consultar Supabase', details: fetchError.message });
      }

      // 2. Si el usuario NO existe, intentar crearlo
      if (!dbUser) {
        // Limpiamos el start_param para que sea solo número o null
        let referrerId = null;
        if (start_param && !isNaN(start_param)) {
          referrerId = parseInt(start_param);
        }

        const newUserPayload = {
          id: user.id,
          username: user.username || `User_${user.id}`,
          balance: 0,
          referred_by: referrerId,
          last_bonus: new Date(0).toISOString()
        };

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([newUserPayload])
          .select()
          .single();

        if (createError) {
          return res.status(400).json({ 
            success: false, 
            error: 'Error al crear usuario', 
            details: createError.message,
            enviado: newUserPayload 
          });
        }
        
        // Si se creó con éxito, devolvemos el nuevo usuario
        return res.status(200).json({ success: true, user: newUser, stats: { n1:0, n2:0, n3:0, c1:0, c2:0, c3:0 } });
      }

      // 3. Si el usuario YA existe, calcular estadísticas
      // Usamos Promise.all para que sea más rápido
      const [l1Res, l2Res, l3Res] = await Promise.all([
        supabase.from('users').select('id, balance').eq('referred_by', user.id),
        supabase.rpc('get_referrals_count', { user_id: user.id }) // Opcional, pero mantengamos la lógica manual si no tienes el RPC
      ]);

      // Lógica simplificada de stats para evitar que el JSON sea demasiado pesado
      const stats = {
        n1: l1Res.data?.length || 0,
        n2: 0, // Simplificado para pruebas
        n3: 0,
        c1: l1Res.data?.reduce((a, b) => a + (b.balance || 0), 0).toFixed(4) || "0.0000",
        c2: "0.0000",
        c3: "0.0000"
      };

      return res.status(200).json({ success: true, user: dbUser, stats });
    }

    return res.status(404).json({ error: 'Ruta no encontrada' });

  } catch (error) {
    console.error("Error crítico en el backend:", error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor', 
      message: error.message 
    });
  }
}