import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración de comisiones (Debe coincidir con tu lógica de negocio)
const REWARDS = { level1: 0.000, level2: 0.000, level3: 0.000 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  // Corregido: Extraemos start_param para procesar referidos
  const { user, start_param } = req.body; 

  if (!user || !user.id) {
    return res.status(400).json({ success: false, error: 'Datos de usuario no proporcionados' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Intentar obtener el usuario de la base de datos
    let { data: dbUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 2. Registro automático con lógica de Referidos
    if (!dbUser) {
      // Evitar que el usuario se refiera a sí mismo
      const referrerId = (start_param && parseInt(start_param) !== user.id) ? parseInt(start_param) : null;

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ 
          id: user.id, 
          username: user.username || 'Anon', 
          referred_by: referrerId, // Guardamos quién lo invitó
          balance: 0, 
          ads_watched: 0,
          last_ad_date: today 
        }])
        .select()
        .single();

      if (createError) throw createError;
      dbUser = newUser;
    }

    // 3. Sincronización diaria del contador de anuncios
    if (dbUser.last_ad_date !== today) {
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ ads_watched: 0, last_ad_date: today })
        .eq('id', user.id)
        .select()
        .single();

      if (updatedUser) dbUser = updatedUser;
    }

    // 4. Cálculo de Estadísticas de Red (Nivel 1, 2 y 3)
    // Nivel 1: Invitados directos
    const { data: l1 } = await supabase.from('users').select('id').eq('referred_by', user.id);
    const idsL1 = l1 ? l1.map(u => u.id) : [];
    
    let n2 = 0, n3 = 0;

    if (idsL1.length > 0) {
      // Nivel 2: Invitados de los directos
      const { data: l2 } = await supabase.from('users').select('id').in('referred_by', idsL1);
      const idsL2 = l2 ? l2.map(u => u.id) : [];
      n2 = idsL2.length;

      if (idsL2.length > 0) {
        // Nivel 3: Invitados de los nivel 2
        const { data: l3 } = await supabase.from('users').select('id').in('referred_by', idsL2);
        n3 = l3 ? l3.length : 0;
      }
    }

    // 5. Responder con datos reales y estadísticas calculadas
    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { 
        n1: idsL1.length, 
        n2: n2, 
        n3: n3, 
        c1: (idsL1.length * REWARDS.level1).toFixed(3), 
        c2: (n2 * REWARDS.level2).toFixed(3), 
        c3: (n3 * REWARDS.level3).toFixed(3) 
      }
    });

  } catch (error) {
    console.error('Error en verify:', error);
    return res.status(500).json({ success: false, error: 'Error de servidor' });
  }
}
