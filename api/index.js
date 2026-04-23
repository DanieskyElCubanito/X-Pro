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
    const { user, action, userId, amount } = req.body;

    // --- ACCIÓN: COBRAR BONO DIARIO ---
if (action === 'claim-bonus') {
  const { data: u } = await supabase.from('users').select('*').eq('id', userId).single();
  
  const now = Date.now();
  // Si u.last_bonus no existe, ponemos 0 para que la resta siempre sea mayor a 24h
  const lastBonus = u.last_bonus ? new Date(u.last_bonus).getTime() : 0;
  const hours24 = 24 * 60 * 60 * 1000;

  if (now - lastBonus < hours24) {
    // Calculamos cuánto falta para avisar al usuario
    const faltan = Math.ceil((hours24 - (now - lastBonus)) / (1000 * 60 * 60));
    return res.status(400).json({ error: `Vuelve en ${faltan} horas` });
  }

  const reward = 0.005;
  const newB = (Number(u.balance) || 0) + reward;
  
  const { error: upError } = await supabase
    .from('users')
    .update({ 
      balance: newB, 
      last_bonus: new Date().toISOString() 
    })
    .eq('id', userId);

  if (upError) throw upError;
  return res.status(200).json({ success: true, newBalance: newB });
}

    // --- ACCIÓN: RETIRO ---
    if (action === 'withdraw') {
      const { data: u } = await supabase.from('users').select('balance').eq('id', userId).single();
      if (u.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' });
      await supabase.from('users').update({ balance: u.balance - amount }).eq('id', userId);
      return res.status(200).json({ success: true });
    }

    // --- ACCIÓN: VERIFICAR / INICIO ---
    if (!user?.id) return res.status(400).json({ error: 'No user id' });
    let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (!dbUser) {
      const { data: newUser } = await supabase.from('users').insert([{ 
        id: user.id, username: user.username, balance: 0 
      }]).select().single();
      dbUser = newUser;
    }

    const { data: refs } = await supabase.from('users').select('balance').eq('referred_by', user.id);
    
    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { n1: refs?.length || 0, c1: refs?.reduce((a, b) => a + (b.balance || 0), 0).toFixed(4) || "0.0000" }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}