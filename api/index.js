import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import WebSocket from 'ws';
// Importaciones para TON
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';

const supabase = createClient(
  "https://shfogfihzkwmusarhlxv.supabase.co",
  "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx",
  {
    auth: { persistSession: false },
    realtime: { transport: WebSocket },
    global: { WebSocket: WebSocket }
  }
);

const BOT_TOKEN = "8954086426:AAGNgUtmREvFLI2SAapaOroLuiy6_05nRlM";
const BOT_ID = BOT_TOKEN.split(':')[0];
const ADMIN_IDS = ['8968109534', '8892196101'];

// El ID del Admin al que le enviaremos los reportes
const MAIN_ADMIN_ID = '8968109534'; 
const MY_MASTER_WALLET = "UQDgJUo4Ycvd9Q_ICUI6I-trCRcZgzBXHmhe0z_8lRHWfU3I";

// Cliente TON conectado a Toncenter
const tonClient = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC'
});

function extractTelegramUsername(url) {
  let val = url.trim();
  if (val.startsWith('@')) return val;
  const match = val.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i);
  if (match && match[1]) return '@' + match[1];
  return null;
}

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
}

// Envía mensaje directo al Admin por Telegram
async function notifyAdmin(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: MAIN_ADMIN_ID,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (e) {
    console.error("No se pudo notificar al admin", e.message);
  }
}

async function checkMembership(userId, chatId) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`;
    const response = await fetchWithTimeout(url);
    const resData = await response.json();
    if (!resData.ok) return false;
    return ['member', 'administrator', 'creator'].includes(resData.result.status);
  } catch (error) {
    return false;
  }
}

async function checkAdminStatus(chatId) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${BOT_ID}`;
    const response = await fetchWithTimeout(url);
    const resData = await response.json();
    if (!resData.ok) return false;
    return ['administrator', 'creator'].includes(resData.result.status);
  } catch (error) {
    return false;
  }
}

async function tryGrantReferralReward(targetId) {
  try {
    const { data: currentUser } = await supabase.from('users').select('*').eq('id', String(targetId)).maybeSingle();
    if (!currentUser || !currentUser.referred_by || currentUser.referral_reward_granted || !currentUser.is_human) return false;

    const isMember1 = await checkMembership(targetId, "-1003685621367"); 
    const isMember2 = await checkMembership(targetId, "-1004377164928"); 
    const isTestAdmin = ADMIN_IDS.includes(String(targetId)) || ADMIN_IDS.includes(String(currentUser.referred_by));

    if ((!isMember1 || !isMember2) && !isTestAdmin) return false;

    const { data: referrer } = await supabase.from('users').select('*').eq('id', currentUser.referred_by).maybeSingle();
    if (referrer) {
      const refBalance = Number((Number(referrer.balance || 0) + 1).toFixed(2));
      const refEarnings = Number((Number(referrer.referral_earnings || 0) + 1).toFixed(2));
      const refTotal = Number((Number(referrer.total_earnings || 0) + 1).toFixed(2));

      await supabase.from('users').update({ balance: refBalance, referral_earnings: refEarnings, total_earnings: refTotal }).eq('id', referrer.id);
      await supabase.from('users').update({ referral_reward_granted: true }).eq('id', String(targetId));
      return true;
    }
  } catch (err) {
    console.error("Error grant referral:", err);
  }
  return false;
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

    // =======================================================
    // MÓDULO DE PUBLICACIÓN DE ANUNCIOS EN CANALES/GRUPOS
    // =======================================================
    if (action === 'publish-post') {
      const { userId: pubUserId, chatId, text, link, photoData, buttonConfig } = req.body;
      const targetId = String(pubUserId);
      const COST_PER_GROUP = 10;

      // Verificar y descontar saldo
      const { data: dbUser } = await supabase.from('users').select('balance').eq('id', targetId).single();
      if (!dbUser || Number(dbUser.balance || 0) < COST_PER_GROUP) {
        return res.status(400).json({ success: false, error: 'Saldo insuficiente para publicar.' });
      }

      // Construir el teclado en línea (Estilos Nativos Telegram)
      let inline_keyboard = [];
      
      if (buttonConfig && buttonConfig.url) {
        let btn = {
          text: buttonConfig.text || "Abrir Enlace",
          url: buttonConfig.url
        };
        if (buttonConfig.style && buttonConfig.style !== 'default') {
          btn.style = buttonConfig.style;
        }
        if (buttonConfig.icon_custom_emoji_id) {
          btn.icon_custom_emoji_id = buttonConfig.icon_custom_emoji_id;
        }
        inline_keyboard.push([btn]);
      } else if (link) {
        inline_keyboard.push([{ text: "Abrir App", url: link }]);
      }

      // Preparar payload a Telegram
      let payload = {
        chat_id: chatId,
        parse_mode: "HTML",
      };
      
      if (inline_keyboard.length > 0) {
        payload.reply_markup = { inline_keyboard };
      }

      let tgEndpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      if (photoData && photoData.startsWith('data:image')) {
         tgEndpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
         payload.photo = photoData;
         payload.caption = text;
      } else {
         payload.text = text;
      }

      // Enviar a Telegram
      const tgRes = await fetch(tgEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const tgData = await tgRes.json();
      
      if (!tgData.ok) {
        return res.status(400).json({ success: false, error: tgData.description }); // Muestra error real (ej. Chat not found)
      }

      // Descontar saldo y guardar éxito
      const newBalance = Number((dbUser.balance - COST_PER_GROUP).toFixed(2));
      await supabase.from('users').update({ balance: newBalance }).eq('id', targetId);

      return res.status(200).json({ success: true, balance: newBalance });
    }

    // =======================================================
    // MÓDULO: PAGOS (GRAM BILLETERAS + TELEGRAM STARS)
    // =======================================================

    // 1. GENERAR UNA WALLET DE PAGO ÚNICA (GRAM)
    if (action === 'generate-payment-wallet') {
      const { packageId, price, clicks } = req.body;
      const targetId = String(userId);

      const mnemonics = await mnemonicNew();
      const keyPair = await mnemonicToPrivateKey(mnemonics);
      const workchain = 0; 
      const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
      const publicAddress = wallet.address.toString({ urlSafe: true, bounceable: false });
      const secretWords = mnemonics.join(" ");

      const { data: newIntent, error } = await supabase.from('payment_intents').insert([{
        user_id: targetId,
        package_id: packageId,
        expected_amount: price,
        public_wallet: publicAddress,
        encrypted_private_key: secretWords,
        status: 'pending'
      }]).select().single();

      if (error) throw new Error("Error al guardar intención de pago.");

      const usernameDisplay = user?.username ? `@${user.username}` : `ID: ${targetId}`;
      const msg = `💰 <b>Nueva Orden GRAM</b>\n\n👤 Usuario: ${usernameDisplay}\n📦 Paquete: ${clicks} CLICK\n💎 Monto Esperado: ${price} GRAM\n\n📌 <b>Wallet Generada:</b>\n<code>${publicAddress}</code>`;
      await notifyAdmin(msg);

      return res.status(200).json({ success: true, wallet: publicAddress, intentId: newIntent.id });
    }

    // 2. VERIFICAR PAGO LLEGADO (GRAM)
    if (action === 'verify-crypto-payment') {
      const { intentId, clicks } = req.body;
      const targetId = String(userId);

      const { data: intent } = await supabase.from('payment_intents')
        .select('*').eq('id', intentId).eq('user_id', targetId).eq('status', 'pending').single();

      if (!intent) return res.status(400).json({ success: false, error: 'Orden de pago no encontrada o procesada.' });

      const balanceNano = await tonClient.getBalance(intent.public_wallet);
      const balanceGram = Number(balanceNano) / 1e9; 

      if (balanceGram < intent.expected_amount) {
        return res.status(400).json({ success: false, error: `Saldo actual: ${balanceGram.toFixed(4)} GRAM. Esperando: ${intent.expected_amount} GRAM.` });
      }

      const { data: dbUser } = await supabase.from('users').select('balance').eq('id', targetId).single();
      const newBalance = Number((Number(dbUser.balance || 0) + clicks).toFixed(2));
      await supabase.from('users').update({ balance: newBalance }).eq('id', targetId);
      await supabase.from('payment_intents').update({ status: 'completed' }).eq('id', intentId);

      try {
        const mnemonics = intent.encrypted_private_key.split(" ");
        const keyPair = await mnemonicToPrivateKey(mnemonics);
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const contract = tonClient.open(wallet);
        const seqno = await contract.getSeqno();

        await contract.sendTransfer({
          seqno: seqno || 0,
          secretKey: keyPair.secretKey,
          messages: [ internal({ to: MY_MASTER_WALLET, value: 0n, bounce: false, body: "Barrido Automático" }) ],
          sendMode: 128 
        });
        await notifyAdmin(`✅ <b>¡PAGO GRAM COMPLETADO!</b>\n\n👤 ID: ${targetId}\n💎 Monto: ${balanceGram} GRAM\n\n🚀 <i>Barrido iniciado a Master Wallet...</i>`);
      } catch (sweepError) {
        await notifyAdmin(`⚠️ <b>FALLÓ BARRIDO AUTOMÁTICO</b>\n\n👤 ID: ${targetId}\n💎 Monto en wallet: ${balanceGram} GRAM\n\nClave:\n<code>${intent.encrypted_private_key}</code>`);
      }

      return res.status(200).json({ success: true, balance: newBalance });
    }

    // 3. GENERAR FACTURA DE TELEGRAM STARS (⭐)
    if (action === 'generate-stars-invoice') {
      const { packageId, stars, clicks } = req.body;
      const targetId = String(userId);
      const uniquePayload = `STARS_${targetId}_PKG${packageId}_${Date.now()}`;

      // Registramos la intención de pago
      await supabase.from('payment_intents').insert([{
        user_id: targetId,
        package_id: packageId,
        expected_amount: stars,
        public_wallet: 'Telegram Stars', // Etiqueta
        encrypted_private_key: uniquePayload, // Lo usamos como identificador seguro
        status: 'pending'
      }]);

      // Formato oficial requerido por la API de Telegram para Stars
      const invoiceData = {
        title: `Recarga: ${clicks} CLICKs`,
        description: `Impulsa tus canales y bots con tráfico real en el ecosistema.`,
        payload: uniquePayload,
        provider_token: "", // OBLIGATORIO DEJAR VACÍO PARA TELEGRAM STARS
        currency: "XTR", // Moneda Oficial de Telegram Stars
        prices: [{ label: `Paquete ${clicks} CLICKs`, amount: parseInt(stars) }]
      };

      try {
        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, invoiceData);
        if (response.data.ok) {
          return res.status(200).json({ success: true, invoiceUrl: response.data.result, intentId: uniquePayload });
        } else {
          throw new Error(response.data.description);
        }
      } catch (err) {
        return res.status(400).json({ success: false, error: "Error conectando a Telegram." });
      }
    }

    // 4. CONFIRMAR PAGO EXITOSO CON STARS (CLIENT-SIDE)
    if (action === 'confirm-stars-payment') {
      const { intentId, clicks } = req.body;
      const targetId = String(userId);

      const { data: intent } = await supabase.from('payment_intents')
        .select('*').eq('encrypted_private_key', intentId).eq('user_id', targetId).eq('status', 'pending').single();

      if (!intent) return res.status(400).json({ success: false, error: 'Pago no encontrado o ya procesado.' });

      // Dar la recompensa
      const { data: dbUser } = await supabase.from('users').select('balance').eq('id', targetId).single();
      const newBalance = Number((Number(dbUser.balance || 0) + clicks).toFixed(2));
      await supabase.from('users').update({ balance: newBalance }).eq('id', targetId);
      await supabase.from('payment_intents').update({ status: 'completed' }).eq('id', intent.id);

      await notifyAdmin(`⭐ <b>¡PAGO CON STARS RECIBIDO!</b>\n\n👤 Usuario ID: ${targetId}\n🌟 Monto: ${intent.expected_amount} Stars\n⚡ Entregados: ${clicks} CLICKs`);

      return res.status(200).json({ success: true, balance: newBalance });
    }

    // =======================================================
    // RESTO DEL CÓDIGO (Tareas, Historial, Verificación)
    // =======================================================

    if (action === 'verify-admin') {
      const chatId = extractTelegramUsername(req.body.url);
      if (!chatId) return res.status(400).json({ success: false, error: 'Enlace público inválido.' });
      const isAdmin = await checkAdminStatus(chatId);
      if (!isAdmin) return res.status(400).json({ success: false, error: 'El bot no es administrador del chat.' });
      return res.status(200).json({ success: true });
    }

    if (action === 'create-task') {
      const { creator_id, type, title, url, bot_token, completions_total, reward } = req.body;
      const targetId = String(creator_id || userId);
      const count = Number(completions_total || 100);
      const rew = Number(reward || 1); 
      const totalCost = Number((count * rew).toFixed(2));

      const { data: dbUser } = await supabase.from('users').select('balance').eq('id', targetId).single();
      if (!dbUser || Number(dbUser.balance || 0) < totalCost) return res.status(400).json({ success: false, error: 'Saldo insuficiente.' });

      const newBalance = Number((dbUser.balance - totalCost).toFixed(2));
      await supabase.from('users').update({ balance: newBalance }).eq('id', targetId);

      const { data: newTask, error } = await supabase.from('tasks').insert([{
        creator_id: targetId, type, title, url, bot_token: bot_token || null,
        completions_total: count, completions_done: 0, reward: rew, total_cost: totalCost, status: 'active'
      }]).select().single();

      if (error) throw error;
      return res.status(200).json({ success: true, task: newTask, balance: newBalance });
    }

    if (action === 'get-tasks') {
      const targetId = String(userId);
      const { data: allTasks } = await supabase.from('tasks').select('*').eq('status', 'active').order('created_at', { ascending: false });
      const { data: completedRows } = await supabase.from('user_completed_tasks').select('task_id').eq('user_id', targetId);
      const completedIds = new Set((completedRows || []).map(r => String(r.task_id)));

      const availableTasks = (allTasks || []).filter(t => !completedIds.has(String(t.id)) && Number(t.completions_done || 0) < Number(t.completions_total));
      return res.status(200).json({ success: true, tasks: availableTasks });
    }

    if (action === 'complete-task') {
      const { taskId } = req.body;
      const targetId = String(userId);

      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      if (!task || task.status !== 'active') return res.status(400).json({ success: false, error: 'Tarea no disponible.' });

      const { data: alreadyDone } = await supabase.from('user_completed_tasks').select('id').eq('task_id', taskId).eq('user_id', targetId).maybeSingle();
      if (alreadyDone) return res.status(400).json({ success: false, error: 'Ya completaste esta tarea.' });

      if (task.type === 'group' || task.type === 'channel') {
        const chatId = extractTelegramUsername(task.url);
        if (chatId) {
          const isJoined = await checkMembership(targetId, chatId);
          if (!isJoined) return res.status(400).json({ success: false, error: 'No te has unido al canal o grupo.' });
        }
      } else if (task.type === 'bot' && task.bot_token) {
        try {
          await axios.post(`https://api.telegram.org/bot${task.bot_token}/sendChatAction`, { chat_id: targetId, action: 'typing' });
        } catch (e) {
          return res.status(400).json({ success: false, error: 'Aún no has iniciado el bot.' });
        }
      }

      await supabase.from('user_completed_tasks').insert([{ task_id: taskId, user_id: targetId }]);

      const rewardAmount = Number(task.reward || 1);
      const { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).single();
      const newBalance = Number((Number(dbUser.balance || 0) + rewardAmount).toFixed(2));
      const newTotal = Number((Number(dbUser.total_earnings || 0) + rewardAmount).toFixed(2));

      await supabase.from('users').update({ balance: newBalance, total_earnings: newTotal }).eq('id', targetId);

      if (dbUser.referred_by) {
        const commissionAmount = Number((rewardAmount * 0.20).toFixed(2));
        const { data: referrer } = await supabase.from('users').select('id, balance, referral_earnings, total_earnings').eq('id', dbUser.referred_by).maybeSingle();

        if (referrer) {
          const refNewBalance = Number((Number(referrer.balance || 0) + commissionAmount).toFixed(2));
          const refNewRefEarn = Number((Number(referrer.referral_earnings || 0) + commissionAmount).toFixed(2));
          const refNewTotal = Number((Number(referrer.total_earnings || 0) + commissionAmount).toFixed(2));
          await supabase.from('users').update({ balance: refNewBalance, referral_earnings: refNewRefEarn, total_earnings: refNewTotal }).eq('id', referrer.id);
        }
      }

      const newDoneCount = Number(task.completions_done || 0) + 1;
      await supabase.from('tasks').update({ 
        completions_done: newDoneCount, 
        status: newDoneCount >= Number(task.completions_total) ? 'completed' : 'active' 
      }).eq('id', taskId);

      return res.status(200).json({ success: true, reward: rewardAmount, balance: newBalance });
    }

    if (action === 'verify-human') {
      const targetId = String(userId || user?.id);
      if (!targetId) return res.status(400).json({ success: false, error: 'ID missing' });
      await supabase.from('users').update({ is_human: true }).eq('id', targetId);
      await tryGrantReferralReward(targetId);
      return res.status(200).json({ success: true, is_human: true });
    }

    if (action === 'check-channels') {
      const targetId = String(userId);
      const isMember1 = await checkMembership(targetId, "-1003685621367"); 
      const isMember2 = await checkMembership(targetId, "-1004377164928"); 
      const allJoined = isMember1 && isMember2;
      if (allJoined) await tryGrantReferralReward(targetId);
      return res.status(200).json({ success: true, channel1: isMember1, channel2: isMember2, allJoined });
    }

    if (action === 'claim-bonus') {
      const { data: u } = await supabase.from('users').select('balance, total_earnings').eq('id', String(userId)).single();
      const newBalance = Number((Number(u.balance || 0) + 0.5).toFixed(2));
      const newTotal = Number((Number(u.total_earnings || 0) + 0.5).toFixed(2));
      await supabase.from('users').update({ balance: newBalance, total_earnings: newTotal }).eq('id', String(userId));
      return res.status(200).json({ success: true, balance: newBalance });
    }

    if (action === 'get-referrals') {
      const targetId = String(userId);
      let { data: lv1 } = await supabase.from('users').select('*').eq('referred_by', targetId);
      if (lv1 && lv1.length > 0) {
        for (const refUser of lv1) {
          if (!refUser.referral_reward_granted) await tryGrantReferralReward(refUser.id);
        }
        const refreshed = await supabase.from('users').select('*').eq('referred_by', targetId);
        lv1 = refreshed.data || lv1;
      }
      const { data: dbUser } = await supabase.from('users').select('referral_earnings').eq('id', targetId).maybeSingle();
      return res.status(200).json({ success: true, referrals: lv1 || [], earnings: dbUser?.referral_earnings || 0 });
    }

    if (action === 'get-history') {
      const targetId = String(userId);
      const { data: myTasks } = await supabase.from('tasks').select('id, title, total_cost, created_at').eq('creator_id', targetId).order('created_at', { ascending: false }).limit(15);
      const { data: completedRows } = await supabase.from('user_completed_tasks').select('task_id, created_at').eq('user_id', targetId).order('created_at', { ascending: false }).limit(15);

      let history = [];

      if (myTasks) {
        myTasks.forEach(t => history.push({
          id: `out_${t.id}`, type: 'spend', title: `Campaña: ${t.title}`, 
          amount: `-${Number(t.total_cost || 0).toFixed(2)}`, date: t.created_at
        }));
      }

      if (completedRows && completedRows.length > 0) {
        const taskIds = completedRows.map(r => r.task_id);
        const { data: tasksInfo } = await supabase.from('tasks').select('id, title, reward').in('id', taskIds);

        completedRows.forEach(r => {
          const tInfo = tasksInfo?.find(ti => String(ti.id) === String(r.task_id));
          history.push({
            id: `in_${r.task_id}_${r.created_at}`, type: 'earn', 
            title: tInfo ? `Tú completaste: ${tInfo.title}` : 'Tarea Completada', 
            amount: `+${Number(tInfo?.reward || 1).toFixed(2)}`, date: r.created_at
          });
        });
      }

      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json({ success: true, history: history.slice(0, 20) });
    }

    const targetUser = user || { id: userId };
    const targetId = String(targetUser?.id);
    if (!targetId || targetId === 'undefined') return res.status(400).json({ success: false, error: 'No user id' });

    const currentDeviceId = targetUser.deviceId || req.body.deviceId;
    const detectedPrev = previousAccountDetected || targetUser.previousAccountDetected;
    const isAdmin = ADMIN_IDS.includes(targetId) || ADMIN_IDS.includes(String(start_param));

    if (!isAdmin) {
      if (detectedPrev && String(detectedPrev) !== targetId) {
        await supabase.from('users').upsert({ id: targetId, username: targetUser.username || 'Usuario', device_id: currentDeviceId, ip_address: clientIp, is_banned: true });
        return res.status(403).json({ success: false, error: 'Multicuenta detectada por navegador.' });
      }
      if (currentDeviceId) {
        const { data: firstOwner } = await supabase.from('users').select('id').eq('device_id', currentDeviceId).order('created_at', { ascending: true }).limit(1).maybeSingle();
        if (firstOwner && String(firstOwner.id) !== targetId) {
          await supabase.from('users').upsert({ id: targetId, username: targetUser.username || 'Usuario', device_id: currentDeviceId, ip_address: clientIp, is_banned: true });
          return res.status(403).json({ success: false, error: 'Multicuenta detectada por dispositivo.' });
        }
      }
    }

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();
    if (dbUser && dbUser.is_banned) return res.status(403).json({ success: false, error: 'Cuenta suspendida.' });

    const updates = {};
    if (dbUser && currentDeviceId && !dbUser.device_id) updates.device_id = currentDeviceId;
    if (dbUser && clientIp && dbUser.ip_address !== clientIp) updates.ip_address = clientIp;
    if (dbUser && !dbUser.referred_by && start_param && String(start_param) !== targetId && isAdmin) updates.referred_by = String(start_param);

    if (Object.keys(updates).length > 0) {
      await supabase.from('users').update(updates).eq('id', targetId);
      dbUser = { ...dbUser, ...updates };
    }

    if (!dbUser) {
      const newUserObj = { 
        id: targetId, username: targetUser.username || 'Usuario', balance: 0, total_earnings: 0, referral_earnings: 0, device_id: currentDeviceId || null, ip_address: clientIp || null, is_human: false, referral_reward_granted: false 
      };
      if (start_param && String(start_param) !== targetId) {
        const { data: referrer } = await supabase.from('users').select('*').eq('id', String(start_param)).single();
        const isFraud = referrer && !isAdmin && ((referrer.device_id && currentDeviceId && referrer.device_id === currentDeviceId) || (referrer.ip_address && clientIp && referrer.ip_address === clientIp));
        if (referrer && !isFraud) newUserObj.referred_by = String(start_param);
      }
      const { data: newUser } = await supabase.from('users').insert([newUserObj]).select().single();
      dbUser = newUser;
    }

    await tryGrantReferralReward(targetId);
    const { count: refCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('referred_by', targetId);
    const isMember1 = await checkMembership(targetId, "-1003685621367");
    const isMember2 = await checkMembership(targetId, "-1004377164928"); 

    const { data: totalTasks } = await supabase.from('tasks').select('completions_done');
    const globalClicks = totalTasks ? totalTasks.reduce((acc, t) => acc + (t.completions_done || 0), 0) : 0;

    const { data: myTasks } = await supabase.from('tasks').select('completions_done').eq('creator_id', targetId);
    const myReceivedClicks = myTasks ? myTasks.reduce((acc, t) => acc + (t.completions_done || 0), 0) : 0;

    const formattedGlobal = globalClicks >= 1000 ? (globalClicks / 1000).toFixed(1) + 'K' : globalClicks;

    dbUser.global_clicks = formattedGlobal;
    dbUser.clicks_received = myReceivedClicks;

    return res.status(200).json({
      success: true, 
      user: dbUser,
      stats: { n1: refCount || 0, c1: String(dbUser?.referral_earnings || 0) }, 
      channels: { c1: isMember1, c2: isMember2 }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
