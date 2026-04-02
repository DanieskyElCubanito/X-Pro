const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
const { TonClient, WalletContractV5R1, toNano, internal } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");

const app = express();
app.use(cors());
app.use(express.json());

/* ------------------------------------------------------------------------- */
/* */
/* ------------------------------------------------------------------------- */

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = "f8c2008d8ba557465e49df5bdd98eb987ef639a5ffabca82203c6d6f6b802fb5";

const REWARDS = { level1: 0.003, level2: 0.002, level3: 0.001 };

/* ------------------------------------------------------------------------- */
/* */
/* ------------------------------------------------------------------------- */

app.post('/api/verify', async (req, res) => {
  try {
    const { user, start_param } = req.body;
    if (!user || !user.id) return res.status(400).json({ success: false, error: 'No user data' });

    // A. Verificar Membresía en el canal
    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`;
    const tgRes = await axios.get(tgUrl);
    const status = tgRes.data.result?.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);

    if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });

    // B. Registro / Multinivel usando .maybeSingle() para evitar errores de búsqueda
    const { data: existingUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();

    if (!existingUser) {
      const referrerId = start_param ? parseInt(start_param) : null;
      
      // Insertamos el nuevo usuario
      await supabase.from('users').insert([{
        id: user.id,
        username: user.username || 'user',
        referred_by: referrerId,
        balance: 0,
        is_verified: true
      }]);

      // Reparto de comisiones en cascada
      if (referrerId) {
        // NIVEL 1
        await supabase.rpc('increment_balance', { user_id: referrerId, amount: REWARDS.level1 });
        
        // NIVEL 2
        const { data: p1 } = await supabase.from('users').select('referred_by').eq('id', referrerId).maybeSingle();
        if (p1?.referred_by) {
          await supabase.rpc('increment_balance', { user_id: p1.referred_by, amount: REWARDS.level2 });
          
          // NIVEL 3
          const { data: p2 } = await supabase.from('users').select('referred_by').eq('id', p1.referred_by).maybeSingle();
          if (p2?.referred_by) {
            await supabase.rpc('increment_balance', { user_id: p2.referred_by, amount: REWARDS.level3 });
          }
        }
      }
    }
    
    // Devolvemos el usuario actualizado
    const { data: finalUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    return res.json({ success: true, user: finalUser });

  } catch (error) {
    console.error("Error en Verify:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* ------------------------------------------------------------------------- */
/* */
/* ------------------------------------------------------------------------- */

app.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, address } = req.body;
    const MNEMONIC = process.env.ADMIN_MNEMONIC;

    if (!MNEMONIC) throw new Error("Falta ADMIN_MNEMONIC en Vercel");

    // Verificar balance antes de proceder
    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).maybeSingle();
    if (!user || user.balance < 0.1) return res.json({ success: false, error: 'Balance insuficiente' });

    // Configuración de cliente TON
    const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
    const keyPair = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
    const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });
    const contract = client.open(wallet);
    
    const seqno = await contract.getSeqno();

    // Ejecución de la transferencia en la Blockchain
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

    // Actualizar base de datos tras el éxito del envío
    await supabase.rpc('decrement_balance', { user_id: userId, amount: 0.1 });
    await supabase.from('withdrawals').insert([{ user_id: userId, amount: 0.1, status: 'completed' }]);

    return res.json({ success: true });
  } catch (err) {
    console.error("Error en Withdraw:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* ------------------------------------------------------------------------- */
/* */
/* ------------------------------------------------------------------------- */

module.exports = app;
