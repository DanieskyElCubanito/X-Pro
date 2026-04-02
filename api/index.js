const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
const { TonClient, WalletContractV5R1, toNano, internal } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");

const app = express();
app.use(cors());
app.use(express.json());

/* --- Configuración --- */

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; 
const PAYMENTS_CHANNEL = "-1002352835078"; 
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = "f8c2008d8ba557465e49df5bdd98eb987ef639a5ffabca82203c6d6f6b802fb5";

const REWARDS = { level1: 0.03, level2: 0.02, level3: 0.01 };
const WITHDRAW_FIXED = 0.1; 
const COOLDOWN_MS = 60 * 60 * 1000; 

/* --- Endpoint de Verificación --- */

app.post('/api/verify', async (req, res) => {
  try {
    const { user, start_param } = req.body;
    if (!user || !user.id) return res.status(400).json({ success: false, error: 'No user data' });

    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`;
    const tgRes = await axios.get(tgUrl);
    const status = tgRes.data.result?.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);

    if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });

    const { data: existingUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();

    if (!existingUser) {
      const referrerId = start_param ? parseInt(start_param) : null;
      await supabase.from('users').insert([{
        id: user.id,
        username: user.username || 'user',
        referred_by: referrerId,
        balance: 0,
        is_verified: true
      }]);

      if (referrerId) {
        await supabase.rpc('increment_balance', { user_id: referrerId, amount: REWARDS.level1 });
        const { data: p1 } = await supabase.from('users').select('referred_by').eq('id', referrerId).maybeSingle();
        if (p1?.referred_by) {
          await supabase.rpc('increment_balance', { user_id: p1.referred_by, amount: REWARDS.level2 });
          const { data: p2 } = await supabase.from('users').select('referred_by').eq('id', p1.referred_by).maybeSingle();
          if (p2?.referred_by) await supabase.rpc('increment_balance', { user_id: p2.referred_by, amount: REWARDS.level3 });
        }
      }
    }

    const { data: lvl1 } = await supabase.from('users').select('id').eq('referred_by', user.id);
    const idsL1 = lvl1 ? lvl1.map(u => u.id) : [];

    let idsL2 = [];
    if (idsL1.length > 0) {
      const { data: lvl2 } = await supabase.from('users').select('id').in('referred_by', idsL1);
      idsL2 = lvl2 ? lvl2.map(u => u.id) : [];
    }

    let idsL3 = [];
    if (idsL2.length > 0) {
      const { data: lvl3 } = await supabase.from('users').select('id').in('referred_by', idsL2);
      idsL3 = lvl3 ? lvl3.map(u => u.id) : [];
    }

    const stats = {
      n1: idsL1.length, n2: idsL2.length, n3: idsL3.length,
      c1: (idsL1.length * REWARDS.level1).toFixed(2),
      c2: (idsL2.length * REWARDS.level2).toFixed(2),
      c3: (idsL3.length * REWARDS.level3).toFixed(2)
    };
    
    const { data: finalUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    return res.json({ success: true, user: finalUser, stats });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* --- Endpoint de Retiro Actualizado --- */

app.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, address } = req.body;
    const MNEMONIC = process.env.ADMIN_MNEMONIC;

    if (!MNEMONIC) throw new Error("ADMIN_MNEMONIC no configurado");

    const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (!user || user.balance < WITHDRAW_FIXED) {
        return res.json({ success: false, error: `Balance insuficiente. Mínimo ${WITHDRAW_FIXED} TON` });
    }

    const { data: lastWithdraw } = await supabase
      .from('withdrawals')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastWithdraw) {
      const timeElapsed = Date.now() - new Date(lastWithdraw.created_at).getTime();
      if (timeElapsed < COOLDOWN_MS) {
        const minsLeft = Math.ceil((COOLDOWN_MS - timeElapsed) / 60000);
        return res.json({ success: false, error: `Espera ${minsLeft} minutos para tu próximo retiro.` });
      }
    }

    // 3. Procesar envío en Red TON y obtener Hash Real
    const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
    const keyPair = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
    const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });
    const contract = client.open(wallet);
    
    const seqno = await contract.getSeqno();
    
    // Enviamos la transferencia
    const transfer = contract.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: 3,
      messages: [
        internal({ 
          to: address, 
          value: toNano(WITHDRAW_FIXED.toString()), 
          bounce: false, 
          body: "IA Profit Payout" 
        })
      ]
    });

    await contract.send(transfer);
    
    // Obtenemos el Hash de la transacción para el enlace de Tonscan
    const txHash = transfer.hash().toString('hex');

    // 4. Actualizar Supabase
    await supabase.rpc('decrement_balance', { user_id: userId, amount: WITHDRAW_FIXED });
    await supabase.from('withdrawals').insert([{ user_id: userId, amount: WITHDRAW_FIXED, status: 'completed', tx_hash: txHash }]);

    // 5. Notificar al Canal de Pagos con Formato Profesional (Puntos 1, 2 y 3 aplicados)
    const message = `💎 <b>PAGO VERIFICADO EXITOSAMENTE</b>\n\n` +
                    `👤 <b>Beneficiario:</b> <a href="tg://user?id=${user.id}">${user.username}</a>\n` +
                    `💸 <b>Monto Total:</b> ${WITHDRAW_FIXED} TON\n` +
                    `🛡️ <b>Red:</b> Toncoin (Ton)\n` +
                    `⚡ <b>Estado:</b> Finalizado / 100%\n\n` +
                    `🔹 <b>TXID:</b>\n<a href="https://tonscan.org/tx/${txHash}">${txHash}</a>\n\n` +
                    `🔥 <i>¡Retiros procesados con total transparencia!</i>`;

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: PAYMENTS_CHANNEL,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{ text: "💰 ¡QUIERO GANAR TON AHORA!", url: "https://t.me/IAProfitTonBot/app" }]
        ]
      }
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Withdraw Error:", err.message);
    return res.status(500).json({ success: false, error: "Error en el procesamiento del pago" });
  }
});

// NUEVA RUTA PARA EL HISTORIAL
app.get('/api/history', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Falta el ID de usuario" });
    }

    // Buscamos en la tabla 'withdrawals' los retiros de este usuario
    const { data: history, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // Los más recientes primero

    if (error) throw error;

    return res.json({ success: true, history: history || [] });

  } catch (error) {
    console.error("Error en historial:", error.message);
    return res.status(500).json({ success: false, error: "Error al obtener historial" });
  }
});

module.exports = app;
