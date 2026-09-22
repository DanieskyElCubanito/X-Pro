import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import WebSocket from 'ws';

const supabase = createClient(
  "https://shfogfihzkwmusarhlxv.supabase.co",
  "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx",
  {
    auth: { persistSession: false },
    realtime: { transport: WebSocket },
    global: { WebSocket: WebSocket }
  }
);

const BOT_TOKEN = "8846443547:AAHHOVlPUuyATcmukcU4HYGas0ZutZ8yNfI";

async function checkMembership(userId, chatId) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`;
    const response = await fetch(url);
    const resData = await response.json();
    if (!resData.ok) return false;
    const status = resData.result.status;
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (error) {
    return false;
  }
}

// Función para enviar mensajes o fotos a los grupos de Telegram
async function publishToTelegramGroup(chatId, text, photoUrl, userLink, username) {
  try {
    const formattedText = `${text}\n\n🔗 Enlace: ${userLink}\n👤 Publicado por: @${username || 'Usuario'}`;

    if (photoUrl) {
      // Enviar con foto (sendPhoto)
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
      await axios.post(url, {
        chat_id: chatId,
        photo: photoUrl,
        caption: formattedText,
        parse_mode: 'HTML'
      });
    } else {
      // Enviar solo texto (sendMessage)
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text: formattedText,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });
    }
    return true;
  } catch (error) {
    console.error("Error al publicar en Telegram:", error.response?.data || error.message);
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { user, action, userId, start_param, method } = req.body; 

    // --- ACCIÓN: PUBLICAR EN GRUPO (COSTO 1 PT) ---
    if (action === 'publish-post') {
      const { text, link, photoUrl, chatId } = req.body;
      if (!text || !link || !chatId) {
        return res.status(400).json({ success: false, error: 'Faltan datos obligatorios (texto, enlace o grupo).' });
      }

      // Validar grupos permitidos
      const allowedGroups = ["-1003970608283", "-1004472305328"];
      if (!allowedGroups.includes(String(chatId))) {
        return res.status(400).json({ success: false, error: 'Grupo no válido.' });
      }

      // Obtener usuario y verificar balance
      const { data: dbUser, error: userErr } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      if (userErr || !dbUser) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });

      const currentBalance = Number(dbUser.balance || 0);
      if (currentBalance < 1) {
        return res.status(400).json({ success: false, error: 'Saldo insuficiente. Necesitas al menos 1 PT.' });
      }

      // Intentar publicar en Telegram
      const published = await publishToTelegramGroup(chatId, text, photoUrl, link, dbUser.username);
      if (!published) {
        return res.status(500).json({ success: false, error: 'El bot no pudo publicar en el grupo. Asegúrate de que sea administrador.' });
      }

      // Descontar 1 PT del balance
      const newBalance = Number((currentBalance - 1).toFixed(2));
      await supabase.from('users').update({ balance: newBalance }).eq('id', String(userId));

      return res.status(200).json({ success: true, balance: newBalance });
    }

    // --- ACCIÓN: VERIFICAR CANALES ---
    if (action === 'check-channels') {
      const isMember1 = await checkMembership(userId, "-1003970608283");
      const isMember2 = await checkMembership(userId, "-1004472305328");
      return res.status(200).json({ success: true, channel1: isMember1, channel2: isMember2, allJoined: isMember1 && isMember2 });
    }

    // --- ACCIÓN: RECOMPENSA POR VER ANUNCIO (0.1 PT SIN LÍMITE) ---
    if (action === 'claim-bonus') {
      const { data: u, error: uErr } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      if (uErr || !u) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });

      // Se suma 0.1 PT. Usamos toFixed(2) y Number para evitar decimales infinitos de JS (ej. 0.300000004)
      const rewardPoints = 0.1; 
      const currentBalance = Number(u.balance || 0);
      const newBalance = Number((currentBalance + rewardPoints).toFixed(2));
      
      await supabase.from('users').update({ balance: newBalance }).eq('id', String(userId));
      
      return res.status(200).json({ success: true, balance: newBalance });
    }

    // --- ACCIÓN: REGISTRO / LOGIN (REFERIDOS 1 SOLO NIVEL = 1 PT) ---
    const targetUser = user || { id: userId };
    const targetId = String(targetUser.id);
    if (!targetId || targetId === 'undefined') return res.status(400).json({ error: 'No user id' });

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();

    if (dbUser && dbUser.is_banned) return res.status(403).json({ error: 'Esta cuenta ha sido baneada.' });

    if (!dbUser) {
      const newUserObj = { 
        id: targetId, 
        username: targetUser.username || 'Usuario', 
        balance: 0, 
        is_human: false
      };

      if (start_param && String(start_param) !== targetId) {
        newUserObj.referred_by = String(start_param);

        // Acreditar 1 PT al referido de nivel 1
        const { data: referrer } = await supabase.from('users').select('balance').eq('id', String(start_param)).single();
        if (referrer) {
          const refNewBalance = Number((Number(referrer.balance || 0) + 1).toFixed(2));
          await supabase.from('users').update({ balance: refNewBalance }).eq('id', String(start_param));
        }
      }

      const { data: newUser } = await supabase.from('users').insert([newUserObj]).select().single();
      dbUser = newUser || await supabase.from('users').select('*').eq('id', targetId).single().then(res => res.data);
    }

    // Estadísticas de referidos (Solo 1 Nivel)
    const { data: lv1 } = await supabase.from('users').select('id, username, created_at').eq('referred_by', targetId);
    const n1 = lv1?.length || 0;

    const isMember1 = await checkMembership(targetId, "-1003970608283");
    const isMember2 = await checkMembership(targetId, "-1004472305328");

    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { n1, referralsList: lv1 || [] }, 
      channels: { c1: isMember1, c2: isMember2 }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
