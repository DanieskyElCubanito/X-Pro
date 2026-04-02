const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const app = express();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@CryptosBitcoins"; // O ID numérico

app.use(express.json());

// Verificación de Membresía y Registro/Anti-multi
app.post('/api/verify', async (req, res) => {
  const { user, start_param } = req.body; // start_param es el ID del referido

  try {
    // 1. Verificar Membresía en Canal
    const tgRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`);
    const status = tgRes.data.result.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);

    if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });

    // 2. Sistema Anti-Multicuenta y Registro
    const { data: existingUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (!existingUser) {
      await supabase.from('users').insert([{
        id: user.id,
        username: user.username,
        referred_by: start_param ? parseInt(start_param) : null,
        is_verified: true
      }]);
    }

    res.json({ success: true, user: existingUser || user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
