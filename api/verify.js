import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Definimos los valores solo para mostrar las estadísticas en la UI
const REWARDS = { level1: 0.005, level2: 0.003, level3: 0.002 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { user, start_param } = req.body; 
  if (!user || !user.id) return res.status(400).json({ error: 'No user data' });

  try {
    // 1. Obtener usuario o crear registro básico si es nuevo
    let { data: dbUser } = await supabase.from('users').select('*').eq('id', String(user.id)).maybeSingle();

    if (!dbUser) {
      const referrerId = (start_param && String(start_param) !== String(user.id)) ? String(start_param) : null;
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ 
          id: String(user.id), 
          username: user.username || 'Anon', 
          referred_by: referrerId,
          balance: 0
        }])
        .select()
        .single();

      if (createError) throw createError;
      dbUser = newUser;
    }

    // 2. Cálculo de Estadísticas de Red (Visualización para el usuario)
    const { data: l1 } = await supabase.from('users').select('id').eq('referred_by', String(user.id));
    const idsL1 = l1 ? l1.map(u => u.id) : [];
    
    let n2 = 0, n3 = 0;
    if (idsL1.length > 0) {
      const { data: l2 } = await supabase.from('users').select('id').in('referred_by', idsL1);
      const idsL2 = l2 ? l2.map(u => u.id) : [];
      n2 = idsL2.length;
      if (idsL2.length > 0) {
        const { data: l3 } = await supabase.from('users').select('id').in('referred_by', idsL2);
        n3 = l3 ? l3.length : 0;
      }
    }

    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { 
        n1: idsL1.length, n2, n3, 
        c1: (idsL1.length * REWARDS.level1).toFixed(4), 
        c2: (n2 * REWARDS.level2).toFixed(4), 
        c3: (n3 * REWARDS.level3).toFixed(4) 
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}