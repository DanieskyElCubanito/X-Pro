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
      const lastBonus = u.last_bonus ? new Date(u.last_bonus).getTime() : 0;
      const hours24 = 24 * 60 * 60 * 1000;

      if (now - lastBonus < hours24) {
        const faltan = Math.ceil((hours24 - (now - lastBonus)) / (1000 * 60 * 60));
        return res.status(400).json({ error: `Vuelve en ${faltan} horas` });
      }

      const reward = 0.005;
      const newB = (Number(u.balance) || 0) + reward;
      await supabase.from('users').update({ balance: newB, last_bonus: new Date().toISOString() }).eq('id', userId);
      return res.status(200).json({ success: true, newBalance: newB });
    }

    // --- ACCIÓN: RETIRO ---
    if (action === 'withdraw') {
      const { data: u } = await supabase.from('users').select('balance').eq('id', userId).single();
      if (u.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' });
      await supabase.from('users').update({ balance: u.balance - amount }).eq('id', userId);
      return res.status(200).json({ success: true });
    }

    // --- ACCIÓN: VERIFICAR / INICIO (Lógica de Referidos Pro) ---
    if (!user?.id) return res.status(400).json({ error: 'No user id' });
    let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (!dbUser) {
      const { data: newUser } = await supabase.from('users').insert([{ 
        id: user.id, username: user.username, balance: 0 
      }]).select().single();
      dbUser = newUser;
    }

    // NIVEL 1 (Directos)
    const { data: lv1 } = await supabase.from('users').select('id, balance').eq('referred_by', user.id);
    const n1 = lv1?.length || 0;
    const c1 = lv1?.reduce((a, b) => a + (Number(b.balance) || 0), 0) || 0;
    const ids1 = lv1?.map(u => u.id) || [];

    // NIVEL 2 (Invitados de tus directos)
    let n2 = 0, c2 = 0, ids2 = [];
    if (ids1.length > 0) {
      const { data: lv2 } = await supabase.from('users').select('id, balance').in('referred_by', ids1);
      n2 = lv2?.length || 0;
      c2 = lv2?.reduce((a, b) => a + (Number(b.balance) || 0), 0) || 0;
      ids2 = lv2?.map(u => u.id) || [];
    }

    // NIVEL 3 (Invitados de los de Nivel 2)
    let n3 = 0, c3 = 0;
    if (ids2.length > 0) {
      const { data: lv3 } = await supabase.from('users').select('id, balance').in('referred_by', ids2);
      n3 = lv3?.length || 0;
      c3 = lv3?.reduce((a, b) => a + (Number(b.balance) || 0), 0) || 0;
    }

    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { 
        n1, c1: c1.toFixed(4), 
        n2, c2: c2.toFixed(4), 
        n3, c3: c3.toFixed(4) 
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}