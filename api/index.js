import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://shfogfihzkwmusarhlxv.supabase.co",
  "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx"
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { user, start_param } = req.body;

    if (!user || !user.id) {
      return res.status(400).json({ error: 'Datos de usuario incompletos' });
    }

    // 1. Intentar buscar o crear el usuario
    let { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 es "no encontrado"
      return res.status(500).json({ error: 'Error de Supabase al buscar', detalle: dbError.message });
    }

    if (!dbUser) {
      const refId = (start_param && !isNaN(start_param)) ? parseInt(start_param) : null;
      const { data: newUser, error: insError } = await supabase
        .from('users')
        .insert([{ 
          id: user.id, 
          username: user.username || `User_${user.id}`,
          referred_by: refId,
          balance: 0,
          ads_watched: 0
        }])
        .select().single();

      if (insError) {
        return res.status(500).json({ error: 'Error al crear usuario', detalle: insError.message });
      }
      dbUser = newUser;
    }

    // 2. Obtener estadísticas simples
    const { data: refs } = await supabase
      .from('users')
      .select('balance')
      .eq('referred_by', user.id);

    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: {
        n1: refs?.length || 0,
        c1: refs?.reduce((a, b) => a + (b.balance || 0), 0).toFixed(4) || "0.0000"
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Crash total del servidor', 
      mensaje: error.message 
    });
  }
}