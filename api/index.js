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

app.post('/api/verify', async (req, res) => {
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
