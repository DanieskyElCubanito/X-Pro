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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { user, action, userId, start_param, method } = req.body; 

    // --- ACCIÓN: OBTENER HISTORIAL ---
    if (action === 'get-history') {
      const { data, error } = await supabase.from('withdrawals').select('*').eq('user_id', String(userId)).order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, history: data });
    }

    // --- ACCIÓN: VERIFICAR HUMANO ---
    if (action === 'verify-human') {
      if (!method || method !== 'app-verified-3step') return res.status(403).json({ error: 'Validación fallida' });
      const { error } = await supabase.from('users').update({ is_human: true }).eq('id', String(userId));
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    // --- ACCIÓN: VERIFICAR CANALES ---
    if (action === 'check-channels') {
      const isMember1 = await checkMembership(userId, "-1003970608283");
      const isMember2 = await checkMembership(userId, "-1004472305328");
      return res.status(200).json({ success: true, channel1: isMember1, channel2: isMember2, allJoined: isMember1 && isMember2 });
    }

    // --- ACCIÓN: RECLAMAR MISIÓN ---
    if (action === 'claim-mission') {
      const { missionId } = req.body;
      if (!missionId) return res.status(400).json({ error: 'Falta ID de la misión' });

      const { data: existingMission } = await supabase.from('user_missions').select('id').eq('user_id', String(userId)).eq('mission_id', missionId).single();
      if (existingMission) return res.status(400).json({ error: 'Ya completaste esta misión.' });

      // Solo guarda la misión como completada en la base de datos
      await supabase.from('user_missions').insert([{ user_id: String(userId), mission_id: missionId }]);
      return res.status(200).json({ success: true });
    }

    // --- ACCIÓN: COBRAR BONO DIARIO ---
    if (action === 'claim-bonus') {
      const { data: u } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      const now = Date.now();
      const lastBonus = u.last_bonus ? new Date(u.last_bonus).getTime() : 0;
      if (now - lastBonus < 24 * 60 * 60 * 1000) return res.status(400).json({ error: `Espera 24h` });

      const rewardPoints = 50; 
      const newPts = (Number(u.points) || 0) + rewardPoints;
      await supabase.from('users').update({ points: newPts, last_bonus: new Date().toISOString() }).eq('id', String(userId));
      return res.status(200).json({ success: true, points: newPts });
    }

    // --- ACCIÓN: REGISTRO / LOGIN ---
    const targetUser = user || { id: userId };
    const targetId = String(targetUser.id);
    if (!targetId || targetId === 'undefined') return res.status(400).json({ error: 'No user id' });

    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'IP_DESCONOCIDA';
    const cleanIp = rawIp.split(',')[0].trim();
    const deviceId = user?.deviceId || req.body.deviceId || targetUser.deviceId || null;
    const previousAccountDetected = user?.previousAccountDetected || req.body.previousAccountDetected || targetUser.previousAccountDetected || null;

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();

    if (dbUser && dbUser.is_banned) return res.status(403).json({ error: 'Esta cuenta ha sido baneada.' });

    if (!dbUser) {
      if (previousAccountDetected) return res.status(403).json({ error: 'Múltiples cuentas detectadas.' });
      if (deviceId) {
        const { data: devM } = await supabase.from('users').select('id').eq('device_id', deviceId).limit(1);
        if (devM && devM.length > 0) return res.status(403).json({ error: 'Dispositivo ya registrado.' });
      }
      
      // Restricción de 1 cuenta por IP (puedes borrar este bloque si necesitas múltiples cuentas por IP/VPN)
      if (cleanIp !== 'IP_DESCONOCIDA') {
        const { data: ipM } = await supabase.from('users').select('id').eq('ip_address', cleanIp).limit(1);
        if (ipM && ipM.length > 0) return res.status(403).json({ error: 'Límite: 1 cuenta por IP.' });
      }
    }

    if (!dbUser) {
      const newUserObj = { 
        id: targetId, 
        username: targetUser.username || 'Usuario', 
        balance: 0, 
        points: 0, 
        is_human: false,
        device_id: deviceId || null,               
        ip_address: cleanIp !== 'IP_DESCONOCIDA' ? cleanIp : null 
      };

      if (start_param && String(start_param) !== targetId) {
        newUserObj.referred_by = String(start_param);
      }

      const { data: newUser } = await supabase.from('users').insert([newUserObj]).select().single();
      dbUser = newUser || await supabase.from('users').select('*').eq('id', targetId).single().then(res => res.data);
    }

    // Calcular estadísticas de red
    const { data: lv1 } = await supabase.from('users').select('id').eq('referred_by', targetId);
    const n1 = lv1?.length || 0;
    const ids1 = lv1?.map(u => u.id) || [];
    let n2 = 0, ids2 = [];
    if (ids1.length > 0) {
      const { data: lv2 } = await supabase.from('users').select('id').in('referred_by', ids1);
      n2 = lv2?.length || 0;
      ids2 = lv2?.map(u => u.id) || [];
    }
    let n3 = 0;
    if (ids2.length > 0) {
      const { data: lv3 } = await supabase.from('users').select('id').in('referred_by', ids2);
      n3 = lv3?.length || 0;
    }

    const isMember1 = await checkMembership(targetId, "-1003970608283");
    const isMember2 = await checkMembership(targetId, "-1004472305328");

    const { data: completedMissions } = await supabase.from('user_missions').select('mission_id').eq('user_id', targetId);
    dbUser.missions_completed = completedMissions?.map(m => m.mission_id) || [];

    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { n1, n2, n3 }, 
      channels: { c1: isMember1, c2: isMember2 }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
