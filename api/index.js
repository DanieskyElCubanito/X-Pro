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
    // Recibimos la 'action' para saber qué operación ejecutar
    const { action, user, start_param, userId, address, amount } = req.body;

    // --- ACCIÓN 1: COBRAR ANUNCIO ---
    if (action === 'ad-reward') {
      const { data: u, error: uErr } = await supabase.from('users').select('*').eq('id', userId).single();
      if (uErr) throw new Error('Usuario no encontrado');

      const newBalance = (u.balance || 0) + 0.0001; // Premio del anuncio
      const newAdsCount = (u.ads_watched || 0) + 1;

      await supabase.from('users').update({ balance: newBalance, ads_watched: newAdsCount }).eq('id', userId);
      return res.status(200).json({ success: true, newBalance, newAdsCount });
    }

    // --- ACCIÓN 2: RETIRAR ---
    if (action === 'withdraw') {
      const { data: u, error: uErr } = await supabase.from('users').select('balance').eq('id', userId).single();
      if (uErr) throw new Error('Usuario no encontrado');
      if ((u.balance || 0) < amount) return res.status(400).json({ error: 'Saldo insuficiente' });

      await supabase.from('users').update({ balance: u.balance - amount }).eq('id', userId);
      return res.status(200).json({ success: true });
    }

    // --- ACCIÓN 3: VERIFICAR O CREAR USUARIO (Por defecto) ---
    if (!user || !user.id) {
      return res.status(400).json({ error: 'Datos de usuario incompletos' });
    }

    let { data: dbUser, error: dbError } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (dbError && dbError.code !== 'PGRST116') { 
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

      if (insError) return res.status(500).json({ error: 'Error al crear usuario', detalle: insError.message });
      dbUser = newUser;
    }

    const { data: refs } = await supabase.from('users').select('balance').eq('referred_by', user.id);

    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: {
        n1: refs?.length || 0,
        c1: refs?.reduce((a, b) => a + (b.balance || 0), 0).toFixed(4) || "0.0000"
      }
    });

  } catch (error) {
    return res.status(500).json({ error: 'Crash total del servidor', mensaje: error.message });
  }
}