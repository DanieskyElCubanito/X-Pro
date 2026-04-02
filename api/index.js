const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors'); // Agregamos esto
const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

app.post('/api/verify', async (req, res) => {
  const { user, start_param } = req.body;

  try {
    // Verificar si está en el canal
    const tgRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`);
    const isMember = ['member', 'administrator', 'creator'].includes(tgRes.data.result.status);

    if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });

    // Registro y Anti-multi (Usa tu tabla 'users')
    const { data: existingUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (!existingUser) {
      await supabase.from('users').insert([{
        id: user.id,
        username: user.username || 'unknown',
        referred_by: start_param ? parseInt(start_param) : null,
        is_verified: true
      }]);
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = app;
