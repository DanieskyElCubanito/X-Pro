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

async function publishToTelegramGroup(chatId, text, photoUrl, userLink, username) {
  try {
    const formattedText = `${text}\n\n🔗 Enlace: ${userLink}\n👤 Publicado por: @${username || 'Usuario'}`;

    if (photoUrl) {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
      await axios.post(url, {
        chat_id: chatId,
        photo: photoUrl,
        caption: formattedText,
        parse_mode: 'HTML'
      });
    } else {
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
    const { user, action, userId, start_param, previousAccountDetected } = req.body; 

    // Obtener la IP real del cliente desde las cabeceras de red (Vercel)
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded 
      ? forwarded.split(',')[0].trim() 
      : (req.socket?.remoteAddress || req.headers['x-real-ip'] || null);

    // --- ACCIÓN: MARCAR COMO HUMANO TRAS PASAR CAPTCHA ---
    if (action === 'verify-human') {
      const targetId = String(userId || user?.id);
      if (!targetId) return res.status(400).json({ success: false, error: 'User ID missing' });

      const { error } = await supabase.from('users').update({ is_human: true }).eq('id', targetId);
      if (error) return res.status(500).json({ success: false, error: error.message });

      return res.status(200).json({ success: true, is_human: true });
    }

    // --- ACCIÓN: PUBLICAR EN GRUPO (COSTO 1 PT) ---
    if (action === 'publish-post') {
      const { text, link, photoUrl, chatId } = req.body;
      if (!text || !link || !chatId) {
        return res.status(400).json({ success: false, error: 'Faltan datos obligatorios.' });
      }

      const allowedGroups = ["-1002228067712", "-1004472305328"];
      if (!allowedGroups.includes(String(chatId))) {
        return res.status(400).json({ success: false, error: 'Grupo no válido.' });
      }

      const { data: dbUser, error: userErr } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      if (userErr || !dbUser) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });

      const currentBalance = Number(dbUser.balance || 0);
      if (currentBalance < 1) {
        return res.status(400).json({ success: false, error: 'Saldo insuficiente. Necesitas al menos 1 PT.' });
      }

      const published = await publishToTelegramGroup(chatId, text, photoUrl, link, dbUser.username);
      if (!published) {
        return res.status(500).json({ success: false, error: 'El bot no pudo publicar en el grupo.' });
      }

      const newBalance = Number((currentBalance - 1).toFixed(2));
      await supabase.from('users').update({ balance: newBalance }).eq('id', String(userId));

      return res.status(200).json({ success: true, balance: newBalance });
    }

    // --- ACCIÓN: VERIFICAR CANALES ---
    if (action === 'check-channels') {
      const isMember1 = await checkMembership(userId, "-1003685621367");
      const isMember2 = await checkMembership(userId, "-1004377164928");
      return res.status(200).json({ success: true, channel1: isMember1, channel2: isMember2, allJoined: isMember1 && isMember2 });
    }

    // --- ACCIÓN: RECOMPENSA POR VER ANUNCIO (0.1 PT) ---
    if (action === 'claim-bonus') {
      const { data: u, error: uErr } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      if (uErr || !u) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });

      const rewardPoints = 0.1; 
      const currentBalance = Number(u.balance || 0);
      const currentTotal = Number(u.total_earnings || 0);

      const newBalance = Number((currentBalance + rewardPoints).toFixed(2));
      const newTotal = Number((currentTotal + rewardPoints).toFixed(2));

      await supabase.from('users').update({ 
        balance: newBalance,
        total_earnings: newTotal
      }).eq('id', String(userId));

      return res.status(200).json({ success: true, balance: newBalance });
    }

    // --- ACCIÓN: RECOMPENSA DIARIA POR UNIRSE A CANALES (0.1 PT) ---
    if (action === 'claim-daily-channel') {
      const { channelId } = req.body;

      const allowedDailyChannels = {
        "-1003685621367": "last_claim_cryptotio",
        "-1004377164928": "last_claim_paymentoffers"
      };

      if (!allowedDailyChannels[channelId]) {
        return res.status(400).json({ success: false, error: 'Canal no válido.' });
      }

      const isMember = await checkMembership(userId, channelId);
      if (!isMember) {
        return res.status(400).json({ success: false, error: 'Debes unirte al canal primero para reclamar.' });
      }

      const { data: u, error: uErr } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      if (uErr || !u) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });

      const today = new Date().toISOString().split('T')[0];
      const columnToUpdate = allowedDailyChannels[channelId];

      if (u[columnToUpdate] === today) {
        return res.status(400).json({ success: false, error: 'Ya reclamaste la recompensa de este canal hoy. Vuelve mañana.' });
      }

      const currentBalance = Number(u.balance || 0);
      const currentTotal = Number(u.total_earnings || 0);

      const newBalance = Number((currentBalance + 0.1).toFixed(2));
      const newTotal = Number((currentTotal + 0.1).toFixed(2));

      await supabase.from('users').update({ 
        balance: newBalance,
        total_earnings: newTotal,
        [columnToUpdate]: today
      }).eq('id', String(userId));

      return res.status(200).json({ success: true, balance: newBalance });
    }

    // --- ACCIÓN: REGISTRO / LOGIN / VERIFY ---
    const targetUser = user || { id: userId };
    const targetId = String(targetUser?.id);
    if (!targetId || targetId === 'undefined') return res.status(400).json({ success: false, error: 'No user id' });

    const currentDeviceId = targetUser.deviceId || req.body.deviceId;

    // --- 1. DETECCIÓN POR NAVEGADOR (LocalStorage) ---
    const detectedPrev = previousAccountDetected || targetUser.previousAccountDetected;
    if (detectedPrev && String(detectedPrev) !== targetId) {
      // Bloquear únicamente a la cuenta secundaria/intrusa
      await supabase.from('users').upsert({
        id: targetId,
        username: targetUser.username || 'Usuario',
        device_id: currentDeviceId || null,
        ip_address: clientIp || null,
        is_banned: true
      });

      return res.status(403).json({ 
        success: false, 
        error: 'Acceso denegado: Este navegador ya tiene otra cuenta vinculada.' 
      });
    }

    // --- 2. DETECCIÓN POR DEVICE ID (1 cuenta por dispositivo) ---
    if (currentDeviceId) {
      // Buscar la primera cuenta creada en este dispositivo
      const { data: firstOwner } = await supabase
        .from('users')
        .select('id, is_banned')
        .eq('device_id', currentDeviceId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Si existe un dueño previo y NO es el usuario actual, este usuario es una multicuenta
      if (firstOwner && String(firstOwner.id) !== targetId) {
        await supabase.from('users').upsert({
          id: targetId,
          username: targetUser.username || 'Usuario',
          device_id: currentDeviceId,
          ip_address: clientIp || null,
          is_banned: true
        });

        return res.status(403).json({ 
          success: false, 
          error: 'Acceso denegado: Este dispositivo ya tiene una cuenta activa registrada.' 
        });
      }
    }

    // --- 3. DETECCIÓN DE GRANJAS POR IP (Máximo 2 cuentas por IP) ---
    if (clientIp) {
      const { count: accountsOnThisIp } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', clientIp)
        .neq('id', targetId);

      if (accountsOnThisIp && accountsOnThisIp >= 2) {
        return res.status(403).json({ 
          success: false, 
          error: 'Límite de cuentas alcanzado: Máximo 2 cuentas permitidas por conexión de red (IP).' 
        });
      }
    }

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();

    if (dbUser && dbUser.is_banned) {
      return res.status(403).json({ success: false, error: 'Esta cuenta ha sido baneada.' });
    }

    // Actualizar device_id o IP si están pendientes
    const updates = {};
    if (dbUser && currentDeviceId && !dbUser.device_id) updates.device_id = currentDeviceId;
    if (dbUser && clientIp && dbUser.ip_address !== clientIp) updates.ip_address = clientIp;

    if (Object.keys(updates).length > 0) {
      await supabase.from('users').update(updates).eq('id', targetId);
      dbUser = { ...dbUser, ...updates };
    }

    // --- 4. REGISTRO DE NUEVO USUARIO Y CONTROL DE REFERIDOS ---
    if (!dbUser) {
      const newUserObj = { 
        id: targetId, 
        username: targetUser.username || 'Usuario', 
        balance: 0, 
        total_earnings: 0,
        referral_earnings: 0,
        device_id: currentDeviceId || null,
        ip_address: clientIp || null,
        is_human: false
      };

      if (start_param && String(start_param) !== targetId) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id, balance, referral_earnings, total_earnings, ip_address, device_id')
          .eq('id', String(start_param))
          .single();

        // Comprobar que no sea autoreferido (mismo dispositivo o misma IP)
        const isSelfReferral = referrer && (
          (referrer.device_id && currentDeviceId && referrer.device_id === currentDeviceId) ||
          (referrer.ip_address && clientIp && referrer.ip_address === clientIp)
        );

        if (referrer && !isSelfReferral) {
          newUserObj.referred_by = String(start_param);

          const refBalance = Number((Number(referrer.balance || 0) + 1).toFixed(2));
          const refEarnings = Number((Number(referrer.referral_earnings || 0) + 1).toFixed(2));
          const refTotal = Number((Number(referrer.total_earnings || 0) + 1).toFixed(2));

          await supabase.from('users').update({ 
            balance: refBalance,
            referral_earnings: refEarnings,
            total_earnings: refTotal
          }).eq('id', String(start_param));
        }
      }

      const { data: newUser, error: insertErr } = await supabase.from('users').insert([newUserObj]).select().single();
      if (insertErr) {
        return res.status(500).json({ success: false, error: insertErr.message });
      }
      dbUser = newUser;
    }

    const { data: lv1 } = await supabase.from('users').select('id, username, created_at').eq('referred_by', targetId);
    const n1 = lv1?.length || 0;

    const isMember1 = await checkMembership(targetId, "-1003685621367");
    const isMember2 = await checkMembership(targetId, "-1004377164928");

    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { n1, referralsList: lv1 || [], c1: String(dbUser?.referral_earnings || 0) }, 
      channels: { c1: isMember1, c2: isMember2 }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
