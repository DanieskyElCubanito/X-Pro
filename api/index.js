import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://shfogfihzkwmusarhlxv.supabase.co",
  "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx"
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { user, start_param, action, userId, address, amount } = req.body;

    // --- ACCIÓN: RETIRO ---
    if (action === 'withdraw') {
      const { data: u } = await supabase.from('users').select('balance').eq('id', userId).single();
      if (u.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' });
      
      await supabase.from('users').update({ balance: u.balance - amount }).eq('id', userId);
      return res.status(200).json({ success: true });
    }

    // --- ACCIÓN: VERIFICAR / REGISTRAR ---
    if (!user?.id) return res.status(400).json({ error: 'Faltan datos de usuario' });

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (!dbUser) {
      const refId = (start_param && !isNaN(start_param)) ? parseInt(start_param) : null;
      const { data: newUser, error: insError } = await supabase.from('users').insert([{ 
        id: user.id, 
        username: user.username || `User_${user.id}`,
        referred_by: refId,
        balance: 0
      }]).select().single();
      
      if (insError) throw insError;
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
    return res.status(500).json({ error: error.message });
  }
}