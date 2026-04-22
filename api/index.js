import { createClient } from '@supabase/supabase-js';

const CONFIG = {
  SUPABASE_SERVICE_KEY: "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx",
  SUPABASE_URL: "https://shfogfihzkwmusarhlxv.supabase.co",
  REWARD_AD: 0.0001
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Extraemos la ruta de forma segura
  const url = req.url || '';
  
  try {
    // --- RUTA: VERIFICAR USUARIO ---
    if (url.includes('/api/verify') && req.method === 'POST') {
      const { user, start_param } = req.body;
      if (!user?.id) throw new Error("Falta el ID de usuario en la petición");

      let { data: dbUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!dbUser) {
        const refId = (start_param && !isNaN(start_param)) ? parseInt(start_param) : null;
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ 
            id: user.id, 
            username: user.username || `User_${user.id}`, 
            balance: 0, 
            referred_by: refId,
            ads_watched: 0 
          }])
          .select().single();

        if (createError) throw new Error(`Error creando usuario: ${createError.message}`);
        dbUser = newUser;
      }

      const { data: L1 } = await supabase.from('users').select('balance').eq('referred_by', user.id);
      
      return res.status(200).json({ 
        success: true, 
        user: dbUser, 
        stats: { 
          n1: L1?.length || 0, 
          c1: L1?.reduce((a, b) => a + (b.balance || 0), 0).toFixed(4) || "0.000" 
        } 
      });
    }

    // --- RUTA: RECOMPENSA ANUNCIO ---
    if (url.includes('/api/ad-reward') && req.method === 'POST') {
      const { userId } = req.body;
      const { data: user, error: userErr } = await supabase.from('users').select('*').eq('id', userId).single();
      
      if (userErr) throw new Error("Usuario no encontrado en DB");

      const { error: upErr } = await supabase.from('users')
        .update({ 
          balance: (user.balance || 0) + CONFIG.REWARD_AD, 
          ads_watched: (user.ads_watched || 0) + 1 
        })
        .eq('id', userId);

      if (upErr) throw new Error(`Error al actualizar saldo: ${upErr.message}`);
      
      return res.status(200).json({ success: true, newBalance: (user.balance || 0) + CONFIG.REWARD_AD, newAdsCount: (user.ads_watched || 0) + 1 });
    }

    return res.status(404).json({ error: "Ruta no encontrada" });

  } catch (error) {
    console.error("DEBUG SERVER ERROR:", error);
    // Enviamos el mensaje de error como STRING para que no salga [object Object]
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Error desconocido en el servidor" 
    });
  }
}