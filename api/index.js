import { createClient } from '@supabase/supabase-js';
import { TonClient, WalletContractV5R1, internal, toNano } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import axios from 'axios';

const supabase = createClient(
  "https://shfogfihzkwmusarhlxv.supabase.co",
  "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx"
);

// --- CONFIGURACIÓN PRINCIPAL ---
const BOT_TOKEN = "8272127366:AAHwAbfVqQDklyLYI0PVo5gvveLaTGtUS6Y";
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = "f8c2008d8ba557465e49df5bdd98eb987ef639a5ffabca82203c6d6f6b802fb5"; 
const PAYMENTS_CHANNEL = "-1002100816898";
const ADMIN_MNEMONIC = "victory end nothing roast ice begin paddle orient dish three poem salute bright term mixed under nature bacon make amazing add round dynamic market";

// --- FUNCIONES DE AYUDA ---

async function checkMembership(userId, chatId) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`;
    const response = await fetch(url);
    const resData = await response.json();
    return ['member', 'administrator', 'creator'].includes(resData.result?.status);
  } catch (e) { return false; }
}

async function isVpn(ip) {
  try {
    // Usamos ip-api para detectar proxy/hosting/vpn (requiere plan pro para precisión total, pero el free ayuda)
    const res = await axios.get(`http://ip-api.com/json/${ip}?fields=proxy,hosting,status`);
    return res.data.status === 'success' && (res.data.proxy || res.data.hosting);
  } catch (e) { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  try {
    const { user, action, userId, amount, address, start_param } = req.body;

    // --- ACCIÓN: RETIRO ---
    if (action === 'withdraw') {
      const withdrawAmount = parseFloat(amount);
      const { data: u } = await supabase.from('users').select('*').eq('id', String(userId)).single();

      if (!u || u.balance < withdrawAmount) return res.status(400).json({ error: 'Saldo insuficiente' });
      if (withdrawAmount < 0.1) return res.status(400).json({ error: 'Mínimo 0.1 TON' });

      let txHash = null;
      try {
        const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
        const keyPair = await mnemonicToPrivateKey(ADMIN_MNEMONIC.trim().split(/\s+/));
        const wallet = client.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));
        const seqno = await wallet.getSeqno();

        await wallet.sendTransfer({
          seqno,
          secretKey: keyPair.secretKey,
          messages: [internal({
            to: address.trim(),
            value: toNano(withdrawAmount.toString()),
            bounce: false,
            body: "IA Profit Payment ✅",
          })]
        });

        let success = false;
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 3000));
          if ((await wallet.getSeqno()) > seqno) { success = true; break; }
        }
        if (!success) throw new Error("La red TON tarda demasiado.");

        const transactions = await client.getTransactions(wallet.address, { limit: 1 });
        txHash = transactions[0]?.hash().toString('hex');
      } catch (e) {
        return res.status(500).json({ error: "Error Blockchain: " + e.message });
      }

      if (txHash) {
        const newBalance = Number(u.balance) - withdrawAmount;
        await supabase.from('users').update({ balance: newBalance }).eq('id', String(userId));
        await supabase.from('withdrawals').insert([{ user_id: String(userId), amount: withdrawAmount, status: 'SUCCESS', tx_hash: txHash, address: address.trim() }]);
        
        // Notificación de Telegram (omitida por brevedad, mantener igual a tu original)
        return res.status(200).json({ success: true, txHash });
      }
    }

    // --- ACCIÓN: INICIO / VERIFICACIÓN ---
    if (!user?.id) return res.status(400).json({ error: 'No user id' });

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', String(user.id)).single();

    if (!dbUser) {
      // 1. Detección de VPN
      if (await isVpn(userIp)) {
        return res.status(403).json({ error: 'VPN/Proxy detectado. Desactívalo para usar la app.' });
      }

      // 2. Detección de Multi-cuenta por IP
      const { data: ipCheck } = await supabase.from('users').select('id').eq('last_ip', userIp).limit(1);
      if (ipCheck && ipCheck.length > 0) {
        return res.status(403).json({ error: 'Ya existe una cuenta vinculada a esta red (IP).' });
      }

      const newUserObj = { 
        id: String(user.id), 
        username: user.username || 'Gamer', 
        balance: 0,
        is_human: false,
        last_ip: userIp
      };

      if (start_param && start_param !== String(user.id)) {
        newUserObj.referred_by = String(start_param);
      }

      const { data: newUser } = await supabase.from('users').insert([newUserObj]).select().single();
      dbUser = newUser;

      // 3. LÓGICA DE AFILIADOS 3 NIVELES
      if (newUserObj.referred_by) {
        // NIVEL 1
        const { data: l1 } = await supabase.from('users').select('id, balance, referred_by').eq('id', newUserObj.referred_by).single();
        if (l1) {
          await supabase.from('users').update({ balance: (Number(l1.balance) || 0) + 0.003 }).eq('id', l1.id);
          
          // NIVEL 2
          if (l1.referred_by) {
            const { data: l2 } = await supabase.from('users').select('id, balance, referred_by').eq('id', l1.referred_by).single();
            if (l2) {
              await supabase.from('users').update({ balance: (Number(l2.balance) || 0) + 0.002 }).eq('id', l2.id);
              
              // NIVEL 3
              if (l2.referred_by) {
                const { data: l3 } = await supabase.from('users').select('id, balance').eq('id', l2.referred_by).single();
                if (l3) {
                  await supabase.from('users').update({ balance: (Number(l3.balance) || 0) + 0.001 }).eq('id', l3.id);
                }
              }
            }
          }
        }
      }
    } else {
      // Actualizar IP en cada login para control de cambios de red
      await supabase.from('users').update({ last_ip: userIp }).eq('id', dbUser.id);
    }

    // --- CÁLCULO DE ESTADÍSTICAS PARA EL FRONTEND ---
    const { data: lv1 } = await supabase.from('users').select('id').eq('referred_by', String(user.id));
    const ids1 = lv1?.map(u => u.id) || [];
    let ids2 = [];
    if (ids1.length > 0) {
      const { data: lv2 } = await supabase.from('users').select('id').in('referred_by', ids1);
      ids2 = lv2?.map(u => u.id) || [];
    }
    let n3 = 0;
    if (ids2.length > 0) {
      const { data: lv3 } = await supabase.from('users').select('id').in('referred_by', ids2);
      n3 = lv3?.length || 0;
    }

    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { 
        n1: ids1.length, c1: (ids1.length * 0.003).toFixed(4), 
        n2: ids2.length, c2: (ids2.length * 0.002).toFixed(4), 
        n3: n3, c3: (n3 * 0.001).toFixed(4) 
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}