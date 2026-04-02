const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

app.post('/api/withdraw', async (req, res) => {
  try {
    const { user, start_param } = req.body;

    if (!user || !user.id) {
      return res.status(400).json({ success: false, error: 'No user data' });
    }

    // 1. Verificar Membresía
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`;
    const tgRes = await axios.get(url);
    const status = tgRes.data.result.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);

    if (!isMember) {
      return res.json({ success: false, error: 'NOT_MEMBER' });
    }

    // 2. Registro en Supabase (Anti-multi)
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      await supabase.from('users').insert([{
        id: user.id,
        username: user.username || 'user_' + user.id,
        referred_by: start_param ? parseInt(start_param) : null,
        is_verified: true
      }]);
    }

    return res.json({ success: true });

  } catch (error) {
    console.error("Error en el servidor:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = app;
// ... (Tus imports anteriores: express, supabase, axios)

// CONFIGURACIÓN DE RECOMPENSAS
const REWARDS = {
  level1: 0.003,
  level2: 0.002,
  level3: 0.001
};

app.post('/api/verify', async (req, res) => {
  try {
    const { user, start_param } = req.body;
    
    // 1. Verificar si el usuario ya existe
    const { data: existingUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (!existingUser) {
      // REGISTRO DE NUEVO USUARIO
      const referrerId = start_param ? parseInt(start_param) : null;
      
      await supabase.from('users').insert([{
        id: user.id,
        username: user.username || 'user',
        referred_by: referrerId,
        is_verified: true,
        balance: 0
      }]);

      // --- SISTEMA MULTINIVEL ---
      if (referrerId) {
        // NIVEL 1: El que lo invitó directamente
        const { data: p1 } = await supabase.rpc('increment_balance', { user_id: referrerId, amount: REWARDS.level1 });
        
        // NIVEL 2: El que invitó al que lo invitó
        const { data: userP1 } = await supabase.from('users').select('referred_by').eq('id', referrerId).single();
        if (userP1?.referred_by) {
          await supabase.rpc('increment_balance', { user_id: userP1.referred_by, amount: REWARDS.level2 });
          
          // NIVEL 3: El que invitó al del nivel 2
          const { data: userP2 } = await supabase.from('users').select('referred_by').eq('id', userP1.referred_by).single();
          if (userP2?.referred_by) {
            await supabase.rpc('increment_balance', { user_id: userP2.referred_by, amount: REWARDS.level3 });
          }
        }
      }
    }
    
    // Obtener datos actualizados del usuario para el frontend
    const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
    res.json({ success: true, user: userData });
    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- RUTA DE RETIROS ---
app.post('/api/withdraw', async (req, res) => {
  const { userId, address } = req.body;
  const AMOUNT = 0.1; // Retiro fijo

  try {
    // 1. Verificar balance y última hora de retiro
    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
    if (user.balance < AMOUNT) return res.json({ success: false, error: 'Balance insuficiente (0.1 TON min)' });

    const { data: lastWithdraw } = await supabase
      .from('withdrawals')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastWithdraw) {
      const diff = (new Date() - new Date(lastWithdraw.created_at)) / 1000 / 60;
      if (diff < 60) return res.json({ success: false, error: 'Solo 1 retiro por hora' });
    }

    // 2. Aquí integrarías tu API de pagos automática
    // const payout = await axios.post('TU_API_URL', { address, amount: AMOUNT });
    
    // 3. Si el pago es exitoso, descontar balance y registrar
    await supabase.rpc('decrement_balance', { user_id: userId, amount: AMOUNT });
    await supabase.from('withdrawals').insert([{ user_id: userId, amount: AMOUNT }]);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
