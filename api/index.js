const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
const { TonClient, WalletContractV5R1, toNano, internal } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");

const app = express();
app.use(cors());
app.use(express.json());

/* */

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = "f8c2008d8ba557465e49df5bdd98eb987ef639a5ffabca82203c6d6f6b802fb5";

// Actualizado a los nuevos valores solicitados
const REWARDS = { level1: 0.03, level2: 0.02, level3: 0.01 };

/* */

app.post('/api/verify', async (req, res) => {
  try {
    const { user, start_param } = req.body;
    if (!user || !user.id) return res.status(400).json({ success: false, error: 'No user data' });

    // 1. Verificar Membresía
    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`;
    const tgRes = await axios.get(tgUrl);
    const status = tgRes.data.result?.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);

    if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });

    // 2. Registro y Multinivel
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
        // Nivel 1
        await supabase.rpc('increment_balance', { user_id: referrerId, amount: REWARDS.level1 });
        
        const { data: p1 } = await supabase.from('users').select('referred_by').eq('id', referrerId).maybeSingle();
        if (p1?.referred_by) {
          // Nivel 2
          await supabase.rpc('increment_balance', { user_id: p1.referred_by, amount: REWARDS.level2 });
          
          const { data: p2 } = await supabase.from('users').select('referred_by').eq('id', p1.referred_by).maybeSingle();
          if (p2?.referred_by) {
            // Nivel 3
            await supabase.rpc('increment_balance', { user_id: p2.referred_by, amount: REWARDS.level3 });
          }
        }
      }
    }

    /* */
    
    // Obtener Nivel 1
    const { data: lvl1 } = await supabase.from('users').select('id').eq('referred_by', user.id);
    const idsL1 = lvl1 ? lvl1.map(u => u.id) : [];

    // Obtener Nivel 2
    let idsL2 = [];
    if (idsL1.length > 0) {
      const { data: lvl2 } = await supabase.from('users').select('id').in('referred_by', idsL1);
      idsL2 = lvl2 ? lvl2.map(u => u.id) : [];
    }

    // Obtener Nivel 3
    let idsL3 = [];
    if (idsL2.length > 0) {
      const { data: lvl3 } = await supabase.from('users').select('id').in('referred_by', idsL2);
      idsL3 = lvl3 ? lvl3.map(u => u.id) : [];
    }

    // Calculamos las estadísticas reales basadas en los conteos
    const stats = {
      n1: idsL1.length,
      n2: idsL2.length,
      n3: idsL3.length,
      c1: (idsL1.length * REWARDS.level1).toFixed(2),
      c2: (idsL2.length * REWARDS.level2).toFixed(2),
      c3: (idsL3.length * REWARDS.level3).toFixed(2)
    };
    
    const { data: finalUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    return res.json({ success: true, user: finalUser, stats });

  } catch (error) {
    console.error("Error Verify:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* */

app.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, address } = req.body;
    const MNEMONIC = process.env.ADMIN_MNEMONIC;

    if (!MNEMONIC) throw new Error("ADMIN_MNEMONIC no configurado");

    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).maybeSingle();
    if (!user || user.balance < 0.1) return res.json({ success: false, error: 'Balance insuficiente' });

    const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
    const keyPair = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
    const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });
    const contract = client.open(wallet);
    
    const seqno = await contract.getSeqno();
    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: 3,
      messages: [
        internal({ 
          to: address, 
          value: toNano("0.1"), 
          bounce: false, 
          body: "IA Profit Payout" 
        })
      ]
    });

    await supabase.rpc('decrement_balance', { user_id: userId, amount: 0.1 });
    await supabase.from('withdrawals').insert([{ user_id: userId, amount: 0.1, status: 'completed' }]);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* */

module.exports = app;
