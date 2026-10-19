import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import WebSocket from 'ws';
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';

const supabase = createClient(
  "https://shfogfihzkwmusarhlxv.supabase.co",
  "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx",
  { auth: { persistSession: false }, realtime: { transport: WebSocket }, global: { WebSocket: WebSocket } }
);

const BOT_TOKEN = "8954086426:AAGNgUtmREvFLI2SAapaOroLuiy6_05nRlM";
const BOT_ID = BOT_TOKEN.split(':')[0];
const ADMIN_IDS = ['8968109534', '8892196101'];
const MAIN_ADMIN_ID = '8968109534'; 
const MY_MASTER_WALLET = "UQDgJUo4Ycvd9Q_ICUI6I-trCRcZgzBXHmhe0z_8lRHWfU3I";

const tonClient = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });

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

async function notifyAdmin(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { chat_id: MAIN_ADMIN_ID, text: message, parse_mode: 'HTML' });
  } catch (e) { console.error(e.message); }
}

async function checkMembership(userId, chatId) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`;
    const response = await fetchWithTimeout(url);
    const resData = await response.json();
    if (!resData.ok) return false;
    return ['member', 'administrator', 'creator'].includes(resData.result.status);
  } catch (error) { return false; }
}

async function checkAdminStatus(chatId) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${BOT_ID}`;
    const response = await fetchWithTimeout(url);
    const resData = await response.json();
    if (!resData.ok) return false;
    return ['administrator', 'creator'].includes(resData.result.status);
  } catch (error) { return false; }
}

async function tryGrantReferralReward(targetId) {
  try {
    const { data: currentUser } = await supabase.from('users').select('*').eq('id', String(targetId)).maybeSingle();
    if (!currentUser || !currentUser.referred_by || currentUser.referral_reward_granted || !currentUser.is_human) return false;

    const { data: referrer } = await supabase.from('users').select('*').eq('id', currentUser.referred_by).maybeSingle();
    if (referrer) {
      const refBalance = Number((Number(referrer.balance || 0) + 1).toFixed(2));
      const refEarnings = Number((Number(referrer.referral_earnings || 0) + 1).toFixed(2));
      const refTotal = Number((Number(referrer.total_earnings || 0) + 1).toFixed(2));
      await supabase.from('users').update({ balance: refBalance, referral_earnings: refEarnings, total_earnings: refTotal }).eq('id', referrer.id);
      await supabase.from('users').update({ referral_reward_granted: true }).eq('id', String(targetId));
      return true;
    }
  } catch (err) {}
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

    if (action === 'publish-post') {
      const { userId: pubUserId, chatId, text, link, photoData, buttonConfig } = req.body;
      const targetId = String(pubUserId);
      const COST_PER_GROUP = 10;
      const { data: dbUser } = await supabase.from('users').select('balance').eq('id', targetId).single();
      if (!dbUser || Number(dbUser.balance || 0) < COST_PER_GROUP) return res.status(400).json({ success: false, error: 'Saldo insuficiente.' });

      let inline_keyboard = [];
      if (buttonConfig && buttonConfig.url) inline_keyboard.push([{ text: buttonConfig.text || "Abrir Enlace", url: buttonConfig.url }]);
      else if (link) inline_keyboard.push([{ text: "Abrir App", url: link }]);

      let payload = { chat_id: chatId, parse_mode: "HTML" };
      if (inline_keyboard.length > 0) payload.reply_markup = { inline_keyboard };

      let tgEndpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      if (photoData && photoData.startsWith('data:image')) {
         tgEndpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`; payload.photo = photoData; payload.caption = text;
      } else { payload.text = text; }

      const tgRes = await fetch(tgEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const tgData = await tgRes.json();
      if (!tgData.ok) return res.status(400).json({ success: false, error: tgData.description });

      const newBalance = Number((dbUser.balance - COST_PER_GROUP).toFixed(2));
      await supabase.from('users').update({ balance: newBalance }).eq('id', targetId);
      await supabase.from('history_logs').insert([{ user_id: targetId, title: '📢 Publicación de Campaña', description: `Has pagado por enviar una publicación directa.`, amount: -COST_PER_GROUP }]);
      await supabase.from('tasks').insert([{ creator_id: targetId, type: 'group', title: 'Campaña en Grupo', url: buttonConfig?.url || link || 'https://t.me/ClickNetworkbot', completions_total: 1, completions_done: 1, reward: 0, total_cost: COST_PER_GROUP, status: 'completed' }]);
      return res.status(200).json({ success: true, balance: newBalance });
    }

    if (action === 'get-group-stats') {
      const { groupIds } = req.body;
      const stats = {};
      for (const chatId of groupIds) {
        try {
          const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMemberCount?chat_id=${chatId}`;
          const response = await fetchWithTimeout(url);
          const resData = await response.json();
          if (resData.ok) stats[chatId] = resData.result;
        } catch (error) {}
      }
      return res.status(200).json({ success: true, stats });
    }

    if (action === 'edit-task') {
      const { taskId, requestingUserId, newTitle, newUrl, isAdminAction } = req.body;
      const targetId = String(requestingUserId);
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      if (!task) return res.status(400).json({ success: false, error: 'Campaña no encontrada.' });
      const isOwner = String(task.creator_id) === targetId;
      if (!isOwner && (!isAdminAction || !ADMIN_IDS.includes(targetId))) return res.status(403).json({ success: false, error: 'Sin permisos.' });
      
      const updates = {}; if (newTitle !== undefined) updates.title = newTitle; if (newUrl !== undefined) updates.url = newUrl;
      await supabase.from('tasks').update(updates).eq('id', taskId);
      return res.status(200).json({ success: true });
    }

    if (action === 'delete-task') {
      const { taskId, requestingUserId, isAdminAction } = req.body;
      const targetId = String(requestingUserId);
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      if (!task) return res.status(400).json({ success: false, error: 'No encontrada.' });
      const isOwner = String(task.creator_id) === targetId;
      if (!isOwner && (!isAdminAction || !ADMIN_IDS.includes(targetId))) return res.status(403).json({ success: false, error: 'Sin permisos.' });

      let refundClicks = 0;
      if (task.status === 'active') {
        const remaining = Math.max(0, Number(task.completions_total) - Number(task.completions_done));
        refundClicks = (task.type === 'promo' || (task.type === 'group' && task.reward === 0)) ? (remaining > 0 ? Number(task.total_cost || 10) : 0) : Number((remaining * Number(task.reward || 1)).toFixed(2));
        if (refundClicks > 0) {
          const { data: cu } = await supabase.from('users').select('balance').eq('id', task.creator_id).single();
          if (cu) await supabase.from('users').update({ balance: Number((Number(cu.balance || 0) + refundClicks).toFixed(2)) }).eq('id', task.creator_id);
        }
      }

      await supabase.from('history_logs').insert([{ user_id: task.creator_id, title: '🗑️ Campaña cancelada', description: `Reembolso por campaña eliminada.`, amount: refundClicks }]);
      await supabase.from('tasks').delete().eq('id', taskId);
      return res.status(200).json({ success: true });
    }

    if (action === 'generate-payment-wallet') {
      const { packageId, price, clicks } = req.body;
      const targetId = String(userId);
      const mnemonics = await mnemonicNew(); const keyPair = await mnemonicToPrivateKey(mnemonics);
      const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
      const publicAddress = wallet.address.toString({ urlSafe: true, bounceable: false });
      const secretWords = mnemonics.join(" ");
      const { data: newIntent } = await supabase.from('payment_intents').insert([{ user_id: targetId, package_id: packageId, expected_amount: price, public_wallet: publicAddress, encrypted_private_key: secretWords, status: 'pending' }]).select().single();
      await notifyAdmin(`💰 <b>Nueva Orden Creada</b>\n\n👤 ID: ${targetId}\n💎 Esperado: ${price} GRAM\n📌 <b>Wallet:</b>\n<code>${publicAddress}</code>\n🔑 <b>Key:</b>\n<code>${secretWords}</code>`);
      return res.status(200).json({ success: true, wallet: publicAddress, intentId: newIntent.id });
    }

    if (action === 'verify-crypto-payment') {
      const { intentId, clicks } = req.body; const targetId = String(userId);
      const { data: intent } = await supabase.from('payment_intents').select('*').eq('id', intentId).eq('user_id', targetId).eq('status', 'pending').single();
      if (!intent) return res.status(400).json({ success: false, error: 'No procesado.' });
      const balanceNano = await tonClient.getBalance(intent.public_wallet);
      const balanceGram = Number(balanceNano) / 1e9; 
      if (balanceGram < intent.expected_amount) return res.status(400).json({ success: false, error: `Saldo actual: ${balanceGram.toFixed(4)} GRAM.` });

      const { data: dbUser } = await supabase.from('users').select('balance').eq('id', targetId).single();
      const newBalance = Number((Number(dbUser.balance || 0) + clicks).toFixed(2));
      await supabase.from('users').update({ balance: newBalance }).eq('id', targetId);
      await supabase.from('payment_intents').update({ status: 'completed' }).eq('id', intentId);
      await supabase.from('history_logs').insert([{ user_id: targetId, title: '💎 Recarga con GRAM', description: `Has recargado ${intent.expected_amount} GRAM.`, amount: clicks }]);

      try {
        const mnemonics = intent.encrypted_private_key.split(" "); const keyPair = await mnemonicToPrivateKey(mnemonics);
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const contract = tonClient.open(wallet); const seqno = await contract.getSeqno();
        await contract.sendTransfer({ seqno: seqno || 0, secretKey: keyPair.secretKey, messages: [ internal({ to: MY_MASTER_WALLET, value: 0n, bounce: false, body: "Barrido Automático" }) ], sendMode: 128 });
      } catch (sweepError) {}
      return res.status(200).json({ success: true, balance: newBalance });
    }

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
      const count = Number(completions_total || 100); const rew = Number(reward || 1); const totalCost = Number((count * rew).toFixed(2));
      const { data: dbUser } = await supabase.from('users').select('balance').eq('id', targetId).single();
      if (!dbUser || Number(dbUser.balance || 0) < totalCost) return res.status(400).json({ success: false, error: 'Saldo insuficiente.' });

      const newBalance = Number((dbUser.balance - totalCost).toFixed(2));
      await supabase.from('users').update({ balance: newBalance }).eq('id', targetId);
      const { data: newTask } = await supabase.from('tasks').insert([{ creator_id: targetId, type, title, url, bot_token: bot_token || null, completions_total: count, completions_done: 0, reward: rew, total_cost: totalCost, status: 'active' }]).select().single();
      await supabase.from('history_logs').insert([{ user_id: targetId, title: '🚀 Nueva Campaña Creada', description: `Campaña para ${count} referidos.`, amount: -totalCost }]);
      return res.status(200).json({ success: true, task: newTask, balance: newBalance });
    }

    if (action === 'get-tasks') {
      const targetId = String(userId);
      const { data: allTasks } = await supabase.from('tasks').select('*').eq('status', 'active').order('created_at', { ascending: false });
      const { data: completedRows } = await supabase.from('user_completed_tasks').select('task_id').eq('user_id', targetId);
      const completedIds = new Set((completedRows || []).map(r => String(r.task_id)));
      const mappedTasks = (allTasks || []).map(t => ({ ...t, is_completed: completedIds.has(String(t.id)) }));

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: historyLogs } = await supabase.from('history_logs').select('title, description, created_at').eq('user_id', targetId);
      const fixed_completed = [];
      if (historyLogs) {
        historyLogs.forEach(log => {
          if (log.description && log.description.includes('@AirdropsCriptoES')) fixed_completed.push('channel1');
          if (log.description && log.description.includes('@TONAirdropsES')) fixed_completed.push('channel2');
          if (log.title === '🎁 Check-in Diario' && log.created_at >= yesterday) fixed_completed.push('daily');
        });
      }
      return res.status(200).json({ success: true, tasks: mappedTasks, fixed_completed });
    }

    if (action === 'complete-task') {
      const { taskId } = req.body; const targetId = String(userId);
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      if (!task || task.status !== 'active') return res.status(400).json({ success: false, error: 'Tarea no disponible.' });
      const { data: alreadyDone } = await supabase.from('user_completed_tasks').select('id').eq('task_id', taskId).eq('user_id', targetId).maybeSingle();
      if (alreadyDone) return res.status(400).json({ success: false, error: 'Ya completaste esta tarea.' });

      if (task.type === 'group' || task.type === 'channel') {
        const chatId = extractTelegramUsername(task.url);
        if (chatId) {
          const isJoined = await checkMembership(targetId, chatId);
          if (!isJoined) return res.status(400).json({ success: false, error: 'No te has unido al canal.' });
        }
      } else if (task.type === 'bot' && task.bot_token) {
        try { await axios.post(`https://api.telegram.org/bot${task.bot_token}/sendChatAction`, { chat_id: targetId, action: 'typing' }); } catch (e) { return res.status(400).json({ success: false, error: 'Inicia el bot.' }); }
      }

      await supabase.from('user_completed_tasks').insert([{ task_id: taskId, user_id: targetId }]);
      const rewardAmount = Number(task.reward || 1);
      const { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).single();
      const newBalance = Number((Number(dbUser.balance || 0) + rewardAmount).toFixed(2));
      const newTotal = Number((Number(dbUser.total_earnings || 0) + rewardAmount).toFixed(2));
      await supabase.from('users').update({ balance: newBalance, total_earnings: newTotal }).eq('id', targetId);
      await supabase.from('history_logs').insert([{ user_id: targetId, title: `✅ Tarea Completada`, description: `Recompensa por "${task.title}".`, amount: rewardAmount }]);

      if (dbUser.referred_by) {
        const commissionAmount = Number((rewardAmount * 0.20).toFixed(2));
        const { data: referrer } = await supabase.from('users').select('*').eq('id', dbUser.referred_by).maybeSingle();
        if (referrer) {
          await supabase.from('users').update({ balance: Number((Number(referrer.balance || 0) + commissionAmount).toFixed(2)), referral_earnings: Number((Number(referrer.referral_earnings || 0) + commissionAmount).toFixed(2)), total_earnings: Number((Number(referrer.total_earnings || 0) + commissionAmount).toFixed(2)) }).eq('id', referrer.id);
        }
      }
      await supabase.from('tasks').update({ completions_done: Number(task.completions_done || 0) + 1, status: (Number(task.completions_done || 0) + 1) >= Number(task.completions_total) ? 'completed' : 'active' }).eq('id', taskId);
      return res.status(200).json({ success: true, reward: rewardAmount, balance: newBalance });
    }

    if (action === 'claim-fixed-task') {
      const { taskId } = req.body;
      const targetId = String(userId);
      let chatId = ''; let title = ''; let reward = 1; let isDaily = false;

      if (taskId === 'channel1') { chatId = '-1003685621367'; title = '@AirdropsCriptoES'; }
      else if (taskId === 'channel2') { chatId = '-1004377164928'; title = '@TONAirdropsES'; }
      else if (taskId === 'daily') { chatId = '-1004362492963'; title = 'Crypto Web3'; isDaily = true; }
      else return res.status(400).json({success: false, error: 'Tarea inválida'});

      const isJoined = await checkMembership(targetId, chatId);
      if (!isJoined) return res.status(400).json({success: false, error: 'Aún no te has unido al canal.'});

      if (isDaily) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentLog } = await supabase.from('history_logs').select('id').eq('user_id', targetId).eq('title', '🎁 Check-in Diario').gte('created_at', yesterday).maybeSingle();
        if (recentLog) return res.status(400).json({success: false, error: 'Ya reclamaste tu Check-in hoy.'});
      } else {
        const { data: alreadyDone } = await supabase.from('history_logs').select('id').eq('user_id', targetId).eq('description', `Recompensa por unirte a ${title}.`).maybeSingle();
        if (alreadyDone) return res.status(200).json({ success: true, message: 'Unión restaurada', is_rejoin: true });
      }

      const { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).single();
      const newBalance = Number((Number(dbUser.balance || 0) + reward).toFixed(2));
      const newTotal = Number((Number(dbUser.total_earnings || 0) + reward).toFixed(2));
      
      await supabase.from('users').update({ balance: newBalance, total_earnings: newTotal }).eq('id', targetId);
      await supabase.from('history_logs').insert([{ user_id: targetId, title: isDaily ? '🎁 Check-in Diario' : `✅ Tarea Fija`, description: isDaily ? 'Recompensa por check-in diario.' : `Recompensa por unirte a ${title}.`, amount: reward }]);

      if (dbUser.referred_by) {
        const commissionAmount = Number((reward * 0.20).toFixed(2));
        const { data: referrer } = await supabase.from('users').select('*').eq('id', dbUser.referred_by).maybeSingle();
        if (referrer) {
          await supabase.from('users').update({ balance: Number((Number(referrer.balance || 0) + commissionAmount).toFixed(2)), referral_earnings: Number((Number(referrer.referral_earnings || 0) + commissionAmount).toFixed(2)), total_earnings: Number((Number(referrer.total_earnings || 0) + commissionAmount).toFixed(2)) }).eq('id', referrer.id);
        }
      }

      return res.status(200).json({ success: true, balance: newBalance });
    }

    if (action === 'check-channels') {
      const targetId = String(userId);
      const isMember1 = await checkMembership(targetId, "-1003685621367"); 
      const isMember2 = await checkMembership(targetId, "-1004377164928"); 
      return res.status(200).json({ success: true, channel1: isMember1, channel2: isMember2 });
    }

    if (action === 'claim-bonus') {
      const targetId = String(userId);
      const { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).single();
      const reward = 0.50;
      const newBalance = Number((Number(dbUser.balance || 0) + reward).toFixed(2));
      const newTotal = Number((Number(dbUser.total_earnings || 0) + reward).toFixed(2));

      await supabase.from('users').update({ balance: newBalance, total_earnings: newTotal }).eq('id', targetId);
      await supabase.from('history_logs').insert([{ user_id: targetId, title: '📺 Bono por anuncio', description: 'Visualización de anuncio.', amount: reward }]);

      if (dbUser.referred_by) {
        const commissionAmount = Number((reward * 0.20).toFixed(2));
        const { data: referrer } = await supabase.from('users').select('*').eq('id', dbUser.referred_by).maybeSingle();
        if (referrer) {
          await supabase.from('users').update({ balance: Number((Number(referrer.balance || 0) + commissionAmount).toFixed(2)), referral_earnings: Number((Number(referrer.referral_earnings || 0) + commissionAmount).toFixed(2)), total_earnings: Number((Number(referrer.total_earnings || 0) + commissionAmount).toFixed(2)) }).eq('id', referrer.id);
        }
      }

      return res.status(200).json({ success: true, balance: newBalance });
    }

    if (action === 'get-history') {
      const targetId = String(userId);
      const { data: history } = await supabase.from('history_logs').select('*').eq('user_id', targetId).order('created_at', { ascending: false }); 
      return res.status(200).json({ success: true, history: history || [] });
    }

    // BLOQUE RESTAURADO: Obtener referidos
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

    if (action === 'verify-human') {
      const targetId = String(userId || user?.id);
      await supabase.from('users').update({ is_human: true }).eq('id', targetId);
      await tryGrantReferralReward(targetId);
      return res.status(200).json({ success: true, is_human: true });
    }

    const targetUser = user || { id: userId };
    const targetId = String(targetUser?.id);
    if (!targetId || targetId === 'undefined') return res.status(400).json({ success: false, error: 'No user id' });

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();
    if (dbUser && dbUser.is_banned) return res.status(403).json({ success: false, error: 'Cuenta suspendida.' });

    if (!dbUser) {
      const newUserObj = { id: targetId, username: targetUser.username || 'Usuario', balance: 0, total_earnings: 0, referral_earnings: 0, is_human: false, referral_reward_granted: false };
      if (start_param && String(start_param) !== targetId) newUserObj.referred_by = String(start_param);
      const { data: newUser } = await supabase.from('users').insert([newUserObj]).select().single();
      dbUser = newUser;
    }

    await tryGrantReferralReward(targetId);
    const { count: refCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('referred_by', targetId);
    const { data: totalTasks } = await supabase.from('tasks').select('completions_done');
    const globalclicks = totalTasks ? totalTasks.reduce((acc, t) => acc + (t.completions_done || 0), 0) : 0;
    const formattedGlobal = globalclicks >= 1000 ? (globalclicks / 1000).toFixed(1) + 'K' : globalclicks;

    dbUser.global_clicks = formattedGlobal;

    return res.status(200).json({
      success: true, 
      user: dbUser,
      stats: { n1: refCount || 0, c1: String(dbUser?.referral_earnings || 0) }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
