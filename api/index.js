import { createClient } from '@supabase/supabase-js';
import { TonClient, WalletContractV5R1, internal, toNano } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
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
// Nota: La lógica de TON se mantiene intacta por ahora para no romper tus retiros, 
// luego la cambiaremos a USDT (TRC20 o BEP20) cuando lleguemos a los retiros.
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = "f8c2008d8ba557465e49df5bdd98eb987ef639a5ffabca82203c6d6f6b802fb5"; 
const PAYMENTS_CHANNEL = "-1003928890953";
const ADMIN_MNEMONIC = "gap chest saddle logic gesture better vapor chicken major math way clinic quick hero host rule bulb image there gallery sniff ecology will film";

// 🔥 NUEVO: DICCIONARIO DE MISIONES Y PREMIOS
// Aquí controlas exactamente cuánto paga cada misión y en qué moneda
const MISSIONS_CONFIG = {
  "Nex Legends": { currency: "USDT", userReward: 0.10 },
  "gmail":       { currency: "USDT", userReward: 0.15 },
  "candy":       { currency: "PT", userReward: 50 },
  "earn_stars":  { currency: "PT", userReward: 100 },
  "gemflux":     { currency: "PT", userReward: 25 }
};

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
    const { user, action, userId, amount, address, start_param, method } = req.body; 

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

    // --- 🔥 NUEVO: ACCIÓN: RECLAMAR MISIÓN CON ECONOMÍA CIRCULAR ---
    if (action === 'claim-mission') {
      const { missionId } = req.body;
      if (!missionId) return res.status(400).json({ error: 'Falta ID de la misión' });

      const missionDef = MISSIONS_CONFIG[missionId];
      if (!missionDef) return res.status(400).json({ error: 'Misión no reconocida por el servidor' });

      const { data: existingMission } = await supabase.from('user_missions').select('id').eq('user_id', String(userId)).eq('mission_id', missionId).single();
      if (existingMission) return res.status(400).json({ error: 'Ya completaste esta misión.' });

      // Traemos al usuario con su balance de USDT y sus Puntos
      const { data: currentUser } = await supabase.from('users').select('id, balance, points, referred_by').eq('id', String(userId)).single();

      if (missionDef.currency === "PT") {
        // Misiones Sociales (Gratis) -> Pagan en Puntos, sin comisión a referidos
        const newPoints = (Number(currentUser?.points) || 0) + missionDef.userReward;
        await supabase.from('users').update({ points: newPoints }).eq('id', String(userId));
      } 
      else if (missionDef.currency === "USDT") {
        // Misiones de Anunciantes -> Pagan en USDT y reparten a la red
        const userGain = missionDef.userReward;
        const newBalance = (Number(currentUser?.balance) || 0) + userGain;
        await supabase.from('users').update({ balance: newBalance }).eq('id', String(userId));

        // 🔥 LA MAGIA DE LOS REFERIDOS: Se reparte 10%, 6% y 4% de la ganancia del usuario
        if (currentUser.referred_by) {
          const l1Gain = userGain * 0.10; // 10% para el Nivel 1
          const { data: l1 } = await supabase.from('users').select('id, balance, referred_by').eq('id', currentUser.referred_by).single();
          if (l1) {
            await supabase.from('users').update({ balance: (Number(l1.balance) || 0) + l1Gain }).eq('id', l1.id);
            
            if (l1.referred_by && l1.referred_by !== l1.id && l1.referred_by !== String(userId)) {
              const l2Gain = userGain * 0.06; // 6% para el Nivel 2
              const { data: l2 } = await supabase.from('users').select('id, balance, referred_by').eq('id', l1.referred_by).single();
              if (l2) {
                await supabase.from('users').update({ balance: (Number(l2.balance) || 0) + l2Gain }).eq('id', l2.id);

                if (l2.referred_by && l2.referred_by !== l2.id && l2.referred_by !== l1.id && l2.referred_by !== String(userId)) {
                  const l3Gain = userGain * 0.04; // 4% para el Nivel 3
                  const { data: l3 } = await supabase.from('users').select('id, balance').eq('id', l2.referred_by).single();
                  if (l3) {
                    await supabase.from('users').update({ balance: (Number(l3.balance) || 0) + l3Gain }).eq('id', l3.id);
                  }
                }
              }
            }
          }
        }
      }

      await supabase.from('user_missions').insert([{ user_id: String(userId), mission_id: missionId }]);
      return res.status(200).json({ success: true });
    }

    // --- ACCIÓN: COBRAR BONO DIARIO (Ahora paga en PUNTOS) ---
    if (action === 'claim-bonus') {
      const { data: u } = await supabase.from('users').select('*').eq('id', String(userId)).single();
      const now = Date.now();
      const lastBonus = u.last_bonus ? new Date(u.last_bonus).getTime() : 0;
      if (now - lastBonus < 24 * 60 * 60 * 1000) return res.status(400).json({ error: `Espera 24h` });

      const rewardPoints = 50; // Bono diario de 50 PT
      const newPts = (Number(u.points) || 0) + rewardPoints;
      await supabase.from('users').update({ points: newPts, last_bonus: new Date().toISOString() }).eq('id', String(userId));
      return res.status(200).json({ success: true, points: newPts });
    }

    // --- ACCIÓN: RETIRO REAL BLOCKCHAIN (Temporalmente en TON hasta el próximo paso) ---
    if (action === 'withdraw') {
      const withdrawAmount = parseFloat(amount);
      const { data: u } = await supabase.from('users').select('*').eq('id', String(userId)).single();

      if (!u || u.balance < withdrawAmount) return res.status(400).json({ error: 'Saldo insuficiente' });
      if (withdrawAmount < 0.25) return res.status(400).json({ error: 'Mínimo 0.25' });

      let txHash = null;
      try {
        const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
        const keyPair = await mnemonicToPrivateKey(ADMIN_MNEMONIC.trim().split(/\s+/));
        const wallet = client.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));
        const walletContract = client.open(wallet);
        const walletBalance = await walletContract.getBalance();
        const amountInNano = toNano(withdrawAmount.toString());
        const feeReserve = toNano('0.05');

        if (walletBalance < (amountInNano + feeReserve)) return res.status(500).json({ error: "Mantenimiento de liquidez." });

        const seqno = await wallet.getSeqno();
        await wallet.sendTransfer({
          seqno,
          secretKey: keyPair.secretKey,
          messages: [internal({ to: address.trim(), value: amountInNano, bounce: false, body: "X Pro 💰" })]
        });

        let success = false;
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 3000));
          if ((await wallet.getSeqno()) > seqno) { success = true; break; }
        }
        if (!success) throw new Error("La red tarda demasiado.");

        const transactions = await client.getTransactions(wallet.address, { limit: 1 });
        txHash = transactions[0]?.hash().toString('hex');
      } catch (e) {
        return res.status(500).json({ error: "Error Blockchain: " + e.message });
      }

      if (txHash) {
        const newBalance = Number(u.balance) - withdrawAmount;
        await supabase.from('users').update({ balance: newBalance }).eq('id', String(userId));
        await supabase.from('withdrawals').insert([{ user_id: String(userId), amount: withdrawAmount, status: 'SUCCESS', tx_hash: txHash, address: address.trim() }]);

        const displayName = u.username ? `@${u.username}` : userId;
        const messageText = `<b>💎 PAGO VERIFICADO</b>\n👤 ${displayName}\n💸 ${withdrawAmount} USDT\n🔹 <a href="https://tonscan.org/tx/${txHash}">${txHash}</a>`;
        
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: PAYMENTS_CHANNEL,
            text: messageText,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        }).catch(e => console.log("Error enviando a canal"));

        return res.status(200).json({ success: true, txHash });
      }
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
      if (cleanIp !== 'IP_DESCONOCIDA') {
        try {
          const vpnResponse = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,proxy,hosting,mobile`);
          const vpnData = await vpnResponse.json();
          if (vpnData.status === 'success' && (vpnData.proxy || vpnData.hosting) && !vpnData.mobile) {
            return res.status(403).json({ error: 'VPN/Proxies no permitidos.' });
          }
        } catch (e) {}
      }
      if (previousAccountDetected) return res.status(403).json({ error: 'Múltiples cuentas detectadas.' });
      if (deviceId) {
        const { data: devM } = await supabase.from('users').select('id').eq('device_id', deviceId).limit(1);
        if (devM && devM.length > 0) return res.status(403).json({ error: 'Dispositivo ya registrado.' });
      }
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
        points: 0, // 🔥 Iniciamos los Puntos en 0
        is_human: false,
        device_id: deviceId || null,               
        ip_address: cleanIp !== 'IP_DESCONOCIDA' ? cleanIp : null 
      };

      if (start_param && String(start_param) !== targetId) {
        newUserObj.referred_by = String(start_param);
      }

      // 🔥 SE ELIMINÓ EL PAGO AUTOMÁTICO AL REFERIDO POR REGISTRO.
      // Ahora solo se guarda quién invitó a quién. El pago ocurre cuando completan misiones.
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
      stats: { n1, n2, n3 }, // Nota: Retiramos los montos fijos (c1, c2, c3) de aquí porque ahora las ganancias son variables y dinámicas.
      channels: { c1: isMember1, c2: isMember2 }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}