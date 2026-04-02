const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
const { TonClient, WalletContractV5R1, toNano, internal } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONFIGURACIÓN INICIAL
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = "f8c2008d8ba557465e49df5bdd98eb987ef639a5ffabca82203c6d6f6b802fb5";

// RECOMPENSAS POR NIVEL (TON)
const REWARDS = {
  level1: 0.003,
  level2: 0.002,
  level3: 0.001
};

// --- RUTA: VERIFICACIÓN, REGISTRO Y MULTINIVEL ---
app.post('/api/verify', async (req, res) => {
  try {
    const { user, start_param } = req.body;
    if (!user?.id) return res.status(400).json({ success: false, error: 'No user data' });

    // A. Verificar Membresía en Telegram
    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`;
    const tgRes = await axios.get(tgUrl);
    const status = tgRes.data.result?.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);

    if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });

    // B. Verificar si es usuario nuevo
    const { data: existingUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (!existingUser) {
      const referrerId = start_param ? parseInt(start_param) : null;
      
      // Crear registro del nuevo usuario
      await supabase.from('users').insert([{
        id: user.id,
        username: user.username || 'user_' + user.id,
        referred_by: referrerId,
        balance: 0,
        is_verified: true
      }]);

      // --- REPARTO DE COMISIONES (MULTINIVEL) ---
      if (referrerId) {
        // NIVEL 1: Referido directo
        await supabase.rpc('increment_balance', { user_id: referrerId, amount: REWARDS.level1 });
        
        // NIVEL 2: Padre del nivel 1
        const { data: p1 } = await supabase.from('users').select('referred_by').eq('id', referrerId).single();
        if (p1?.referred_by) {
          await supabase.rpc('increment_balance', { user_id: p1.referred_by, amount: REWARDS.level2 });
          
          // NIVEL 3: Abuelo del nivel 1
          const { data: p2 } = await supabase.from('users').select('referred_by').eq('id', p1.referred_by).single();
          if (p2?.referred_by) {
            await supabase.rpc('increment_balance', { user_id: p2.referred_by, amount: REWARDS.level3 });
          }
        }
      }
    }
    
    // Obtener datos finales del usuario
    const { data: finalUser } = await supabase.from('users').select('*').eq('id', user.id).single();
    return res.json({ success: true, user: finalUser });

  } catch (error) {
    console.error("Error en /verify:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// --- RUTA: RETIRO AUTOMÁTICO (API INTERNA) ---
app.post('/api/withdraw', async (req, res) => {
  const { userId, address } = req.body;
  const FIXED_AMOUNT = 0.1; 
  const MNEMONIC = process.env.ADMIN_MNEMONIC; // <--- Recuerda crear esta KEY en Vercel

  if (!MNEMONIC) return res.status(500).json({ error: "Faltan las semillas en el servidor." });

  try {
    // 1. Validaciones de Balance
    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
    if (!user || user.balance < FIXED_AMOUNT) {
      return res.json({ success: false, error: 'Balance insuficiente (Mínimo 0.1 TON)' });
    }

    // 2. Límite: 1 retiro por hora
    const { data: lastW } = await supabase.from('withdrawals').select('created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single();
    if (lastW) {
      const diffMin = (new Date() - new Date(lastW.created_at)) / 1000 / 60;
      if (diffMin < 60) return res.json({ success: false, error: 'Solo 1 retiro por hora' });
    }

    // 3. LÓGICA DE PAGO AUTOMÁTICO (BLOCKCHAIN)
    const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
    const keyPair = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
    const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });
    const contract = client.open(wallet);
    
    const seqno = await contract.getSeqno();

    // Enviamos la transferencia
    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: 3, // Modo profesional: paga gas por separado
      messages: [
        internal({
          to: address,
          value: toNano(FIXED_AMOUNT.toString()),
          bounce: false,
          body: "IA Profit Ton Payout", // Mensaje de la transacción
        })
      ]
    });

    // 4. ACTUALIZAR BASE DE DATOS TRAS ÉXITO
    await supabase.rpc('decrement_balance', { user_id: userId, amount: FIXED_AMOUNT });
    await supabase.from('withdrawals').insert([{ 
      user_id: userId, 
      amount: FIXED_AMOUNT, 
      status: 'completed' 
    }]);

    return res.json({ success: true });

  } catch (err) {
    console.error("Error en /withdraw:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = app;
