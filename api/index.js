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

const BOT_TOKEN = "8948808471:AAGRcUzysgMptMe5tY-X6SZQirUDLmI94q8";

// Cuentas administradoras: Inmunes a baneos, límites de IP y bloqueos de autoreferidos
const ADMIN_IDS = ['8968109534', '8892196101'];

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

async function publishToTelegramGroup(chatId, text, photoData, userLink, username, buttonConfig) {
  try {
    const formattedText = text; 
    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}`;

    let reply_markup = undefined;
    if (buttonConfig && buttonConfig.url && buttonConfig.text) {
      reply_markup = {
        inline_keyboard: [[{ 
          text: buttonConfig.text, 
          url: buttonConfig.url,
          style: buttonConfig.color, 
          color: buttonConfig.color  
        }]]
      };
    }

    if (photoData) {
      if (photoData.startsWith('data:image')) {
        const base64Data = photoData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('photo', blob, 'image.jpg');
        form.append('caption', formattedText);
        form.append('parse_mode', 'HTML');
        if (reply_markup) form.append('reply_markup', JSON.stringify(reply_markup));

        const response = await fetch(`${apiUrl}/sendPhoto`, { method: 'POST', body: form });
        const resData = await response.json();
        if (!resData.ok) throw new Error(resData.description);
      } else {
        await axios.post(`${apiUrl}/sendPhoto`, {
          chat_id: chatId, photo: photoData, caption: formattedText, parse_mode: 'HTML', reply_markup
        });
      }
    } else {
      await axios.post(`${apiUrl}/sendMessage`, {
        chat_id: chatId, text: formattedText, parse_mode: 'HTML', disable_web_page_preview: false, reply_markup
      });
    }
    return true;
  } catch (error) {
    console.error("Error al publicar:", error.response?.data || error.message);
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { user, action, userId, start_param, previousAccountDetected } = req.body; 
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || req.headers['x-real-ip'] || null);

    // --- ACCIÓN: OBTENER REFERIDOS EN TIEMPO REAL ---
    if (action === 'get-referrals') {
      const targetId = String(userId);
      const { data: lv1 } = await supabase.from('users').select('id, username, created_at, referral_reward_granted').eq('referred_by', targetId);
      const { data: dbUser } = await supabase.from('users').select('referral_earnings').eq('id', targetId).single();
      
      return res.status(200).json({ 
        success: true, 
        referrals: lv1 || [], 
        earnings: dbUser?.referral_earnings || 0 
      });
    }

    if (action === 'verify-human') {
      const targetId = String(userId || user?.id);
      if (!targetId) return res.status(400).json({ success: false, error: 'User ID missing' });

      const { error } = await supabase.from('users').update({ is_human: true }).eq('id', targetId);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.status(200).json({ success: true, is_human: true });
    }

    if (action === 'publish-post') {
      const { text, link, photoData, chatId, buttonConfig } = req.body;
      if (!text || !chatId) return res.status(400).json({ success: false, error: 'Faltan datos obligatorios.' });

      const allowedGroups = ["-1003685621367", "-1004377164928"];
      if (!allowedGroups.includes(String(chatId))) return res.status(400).json({ success: false, error: 'Grupo no válido.' });

      const { data: dbUser, error: userErr } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      if (userErr || !dbUser) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });

      const currentBalance = Number(dbUser.balance || 0);
      if (currentBalance < 1) return res.status(400).json({ success: false, error: 'Saldo insuficiente. Necesitas al menos 1 PT.' });

      const published = await publishToTelegramGroup(chatId, text, photoData, link, dbUser.username, buttonConfig);
      if (!published) return res.status(500).json({ success: false, error: 'El bot no pudo publicar en el grupo.' });

      const newBalance = Number((currentBalance - 1).toFixed(2));
      await supabase.from('users').update({ balance: newBalance }).eq('id', String(userId));

      return res.status(200).json({ success: true, balance: newBalance });
    }

    // --- ACCIÓN: CHECK CHANNELS (PAGO AL REFERIDOR) ---
    if (action === 'check-channels') {
      const targetId = String(userId);
      const isMember1 = await checkMembership(targetId, "-1003685621367"); 
      const isMember2 = await checkMembership(targetId, "-1004377164928"); 
      const allJoined = isMember1 && isMember2;

      if (allJoined) {
        const { data: currentUser } = await supabase.from('users').select('id, referred_by, is_human, referral_reward_granted').eq('id', targetId).single();
        if (currentUser && currentUser.is_human && currentUser.referred_by && !currentUser.referral_reward_granted) {
          const { data: referrer } = await supabase.from('users').select('id, balance, referral_earnings, total_earnings').eq('id', currentUser.referred_by).single();
          if (referrer) {
            const refBalance = Number((Number(referrer.balance || 0) + 1).toFixed(2));
            const refEarnings = Number((Number(referrer.referral_earnings || 0) + 1).toFixed(2));
            const refTotal = Number((Number(referrer.total_earnings || 0) + 1).toFixed(2));

            await supabase.from('users').update({ balance: refBalance, referral_earnings: refEarnings, total_earnings: refTotal }).eq('id', referrer.id);
            await supabase.from('users').update({ referral_reward_granted: true }).eq('id', targetId);
          }
        }
      }
      return res.status(200).json({ success: true, channel1: isMember1, channel2: isMember2, allJoined });
    }

    if (action === 'claim-bonus') {
      const { data: u, error: uErr } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      if (uErr || !u) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
      
      const currentBalance = Number(u.balance || 0);
      const currentTotal = Number(u.total_earnings || 0);
      const newBalance = Number((currentBalance + 0.1).toFixed(2));
      const newTotal = Number((currentTotal + 0.1).toFixed(2));

      await supabase.from('users').update({ balance: newBalance, total_earnings: newTotal }).eq('id', String(userId));
      return res.status(200).json({ success: true, balance: newBalance });
    }

    if (action === 'claim-daily-channel') {
      const { channelId } = req.body;
      const targetChannelKey = String(channelId);
      const allowedDailyChannels = { "-1004362492963": "last_claim_cryptotio", "-1004490423840": "last_claim_paymentoffers" };

      if (!allowedDailyChannels[targetChannelKey]) return res.status(400).json({ success: false, error: 'Canal no válido.' });

      const isMember = await checkMembership(userId, targetChannelKey);
      if (!isMember) return res.status(400).json({ success: false, error: 'Debes unirte al canal primero.' });

      const { data: u, error: uErr } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      if (uErr || !u) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });

      const today = new Date().toISOString().split('T')[0];
      const columnToUpdate = allowedDailyChannels[targetChannelKey];

      if (u[columnToUpdate] === today) return res.status(400).json({ success: false, error: 'Ya reclamaste la recompensa hoy.' });

      const currentBalance = Number(u.balance || 0);
      const currentTotal = Number(u.total_earnings || 0);
      const newBalance = Number((currentBalance + 0.1).toFixed(2));
      const newTotal = Number((currentTotal + 0.1).toFixed(2));

      await supabase.from('users').update({ balance: newBalance, total_earnings: newTotal, [columnToUpdate]: today }).eq('id', String(userId));
      return res.status(200).json({ success: true, balance: newBalance });
    }

    // --- REGISTRO / VERIFICACIÓN DE USUARIOS ---
    const targetUser = user || { id: userId };
    const targetId = String(targetUser?.id);
    if (!targetId || targetId === 'undefined') return res.status(400).json({ success: false, error: 'No user id' });

    const currentDeviceId = targetUser.deviceId || req.body.deviceId;
    const detectedPrev = previousAccountDetected || targetUser.previousAccountDetected;
    
    // Verificamos si el usuario o el referidor es un administrador (inmune)
    const isAdmin = ADMIN_IDS.includes(targetId) || ADMIN_IDS.includes(String(start_param));

    // Reglas restrictivas aplicadas SOLO si nadie en la transacción es admin
    if (!isAdmin) {
      if (detectedPrev && String(detectedPrev) !== targetId) {
        await supabase.from('users').upsert({ id: targetId, username: targetUser.username || 'Usuario', device_id: currentDeviceId || null, ip_address: clientIp || null, is_banned: true });
        return res.status(403).json({ success: false, error: 'Acceso denegado: Navegador vinculado a otra cuenta.' });
      }

      if (currentDeviceId) {
        const { data: firstOwner } = await supabase.from('users').select('id, is_banned').eq('device_id', currentDeviceId).order('created_at', { ascending: true }).limit(1).maybeSingle();
        if (firstOwner && String(firstOwner.id) !== targetId) {
          await supabase.from('users').upsert({ id: targetId, username: targetUser.username || 'Usuario', device_id: currentDeviceId, ip_address: clientIp || null, is_banned: true });
          return res.status(403).json({ success: false, error: 'Acceso denegado: Dispositivo vinculado a otra cuenta.' });
        }
      }

      if (clientIp) {
        const { count: accountsOnThisIp } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('ip_address', clientIp).neq('id', targetId);
        if (accountsOnThisIp && accountsOnThisIp >= 2) return res.status(403).json({ success: false, error: 'Límite IP alcanzado.' });
      }
    }

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();
    if (dbUser && dbUser.is_banned) return res.status(403).json({ success: false, error: 'Cuenta baneada.' });

    const updates = {};
    if (dbUser && currentDeviceId && !dbUser.device_id) updates.device_id = currentDeviceId;
    if (dbUser && clientIp && dbUser.ip_address !== clientIp) updates.ip_address = clientIp;
    
    // Si la cuenta es de prueba, ya existía, pero el sistema no la vinculó por fraude, la vinculamos ahora.
    if (dbUser && !dbUser.referred_by && start_param && String(start_param) !== targetId && isAdmin) {
      updates.referred_by = String(start_param);
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('users').update(updates).eq('id', targetId);
      dbUser = { ...dbUser, ...updates };
    }

    if (!dbUser) {
      const newUserObj = { 
        id: targetId, username: targetUser.username || 'Usuario', balance: 0, total_earnings: 0, referral_earnings: 0, device_id: currentDeviceId || null, ip_address: clientIp || null, is_human: false, referral_reward_granted: false 
      };
      if (start_param && String(start_param) !== targetId) {
        const { data: referrer } = await supabase.from('users').select('id, ip_address, device_id').eq('id', String(start_param)).single();
        
        // Bloqueo antifraude cancelado si eres administrador
        const isFraud = referrer && !isAdmin && ((referrer.device_id && currentDeviceId && referrer.device_id === currentDeviceId) || (referrer.ip_address && clientIp && referrer.ip_address === clientIp));
        
        if (referrer && !isFraud) newUserObj.referred_by = String(start_param);
      }
      const { data: newUser, error: insertErr } = await supabase.from('users').insert([newUserObj]).select().single();
      if (insertErr) return res.status(500).json({ success: false, error: insertErr.message });
      dbUser = newUser;
    }

    const { data: lv1 } = await supabase.from('users').select('id, username, created_at, referral_reward_granted').eq('referred_by', targetId);
    const n1 = lv1?.length || 0;
    const isMember1 = await checkMembership(targetId, "-1003685621367");
    const isMember2 = await checkMembership(targetId, "-1004377164928"); 

    return res.status(200).json({
      success: true, user: dbUser,
      stats: { n1, referralsList: lv1 || [], c1: String(dbUser?.referral_earnings || 0) }, 
      channels: { c1: isMember1, c2: isMember2 }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
