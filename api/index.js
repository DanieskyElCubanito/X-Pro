import { createClient } from '@supabase/supabase-js';

const CONFIG = {
  BOT_TOKEN: "8101312620:AAG3lo7rOipTAUUMQr8c89RJkEa2Rj2-j7s",
  SUPABASE_SERVICE_KEY: "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx",
  SUPABASE_URL: "https://shfogfihzkwmusarhlxv.supabase.co"
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'POST') {
      const { user, start_param } = req.body;

      if (!user?.id) return res.status(400).json({ error: 'ID de usuario requerido' });

      // 1. Buscar usuario
      let { data: dbUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // 2. Si no existe, crear
      if (!dbUser) {
        const referrerId = (start_param && !isNaN(start_param)) ? parseInt(start_param) : null;
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ 
            id: user.id, 
            username: user.username || `User_${user.id}`, 
            balance: 0, 
            referred_by: referrerId,
            last_bonus: new Date(0).toISOString()
          }])
          .select().single();

        if (createError) throw createError;
        dbUser = newUser;
      }

      // 3. Stats simplificadas (Para que el Build no falle)
      const { data: L1 } = await supabase.from('users').select('balance').eq('referred_by', user.id);
      
      const stats = {
        n1: L1?.length || 0,
        n2: 0,
        n3: 0,
        c1: L1?.reduce((a, b) => a + (b.balance || 0), 0).toFixed(4) || "0.0000",
        c2: "0.0000",
        c3: "0.0000"
      };

      return res.status(200).json({ success: true, user: dbUser, stats });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}