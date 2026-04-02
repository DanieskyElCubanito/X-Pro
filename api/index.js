const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
const { TonClient, WalletContractV5R1, toNano, internal } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");

const app = express();
app.use(cors());
app.use(express.json());

/* --- CONFIGURACIÓN DE VARIABLES DE ENTORNO Y CONSTANTES --- */

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; 
const PAYMENTS_CHANNEL = "-1002352835078"; 
const TON_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = "f8c2008d8ba557465e49df5bdd98eb987ef639a5ffabca82203c6d6f6b802fb5";
const CLOUDFLARE_SECRET = "0x4AAAAAACqyiN_P_Tu_Secret_Key_Aqui"; // Reemplaza con tu Secret Key (no la Site Key)

const REWARDS = { level1: 0.03, level2: 0.02, level3: 0.01 };
const WITHDRAW_FIXED = 0.1; 
const COOLDOWN_MS = 60 * 60 * 1000; 

/* --- [FUNCIONES AUXILIARES DE SEGURIDAD] --- */

// Función para verificar el token de Cloudflare Turnstile
async function verifyTurnstile(token) {
  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      `secret=${CLOUDFLARE_SECRET}&response=${token}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.success;
  } catch (e) {
    return false;
  }
}

// Función para notificar baneos al administrador
async function notifyBan(adminMsg) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: PAYMENTS_CHANNEL,
      text: adminMsg,
      parse_mode: 'HTML'
    });
  } catch (e) {
    console.error("Error al notificar baneo");
  }
}

/* --- [ENDPOINT DE VERIFICACIÓN E INGRESO] --- */

app.post('/api/verify', async (req, res) => {
  try {
    const { user, start_param } = req.body;
    if (!user || !user.id) return res.status(400).json({ success: false, error: 'No user data' });

    // 1. Verificar si el usuario está baneado en la base de datos
    const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    
    if (dbUser && dbUser.is_banned) {
      return res.json({ success: false, error: 'USER_BANNED' });
    }

    // 2. Verificar suscripción al canal
    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${user.id}`;
    const tgRes = await axios.get(tgUrl);
    const status = tgRes.data.result?.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);

    if (!isMember) return res.json({ success: false, error: 'NOT_MEMBER' });

    // 3. Registro de nuevo usuario y lógica de referidos
    if (!dbUser) {
      const referrerId = start_param ? parseInt(start_param) : null;
      
      // Seguridad: Un usuario no puede referirse a sí mismo
      const validReferrer = (referrerId && referrerId !== user.id) ? referrerId : null;

      await supabase.from('users').insert([{
        id: user.id,
        username: user.username || 'user',
        referred_by: validReferrer,
        balance: 0,
        is_verified: true,
        is_banned: false
      }]);

      if (validReferrer) {
        // Nivel 1
        await supabase.rpc('increment_balance', { user_id: validReferrer, amount: REWARDS.level1 });
        
        // Nivel 2
        const { data: p1 } = await supabase.from('users').select('referred_by').eq('id', validReferrer).maybeSingle();
        if (p1?.referred_by) {
          await supabase.rpc('increment_balance', { user_id: p1.referred_by, amount: REWARDS.level2 });
          
          // Nivel 3
          const { data: p2 } = await supabase.from('users').select('referred_by').eq('id', p1.referred_by).maybeSingle();
          if (p2?.referred_by) {
            await supabase.rpc('increment_balance', { user_id: p2.referred_by, amount: REWARDS.level3 });
          }
        }
      }
    }

    // 4. Cálculo de estadísticas de red de 3 niveles
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
    console.error("Verify Error:", error.message);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

/* --- [ENDPOINT DE RETIRO CON ANTI-FRAUDE AVANZADO] --- */

app.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, address, captchaToken } = req.body;
    const MNEMONIC = process.env.ADMIN_MNEMONIC;

    // 1. Validaciones de Seguridad Iniciales
    if (!captchaToken) return res.json({ success: false, error: "Verificación de seguridad requerida." });
    
    const isHuman = await verifyTurnstile(captchaToken);
    if (!isHuman) return res.json({ success: false, error: "Fallo en la verificación de Cloudflare." });

    const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (!user) return res.json({ success: false, error: "Usuario no encontrado." });
    
    if (user.is_banned) return res.json({ success: false, error: "Esta cuenta está bloqueada por fraude." });

    if (user.balance < WITHDRAW_FIXED) {
        return res.json({ success: false, error: `Balance insuficiente. Mínimo ${WITHDRAW_FIXED} TON` });
    }

    // 2. DETECCIÓN DE MULTICUENTA POR WALLET (Regla de Oro)
    const { data: existingWalletUse } = await supabase
      .from('withdrawals')
      .select('user_id')
      .eq('address', address.trim())
      .neq('user_id', userId) // Si otro ID ya usó esta wallet
      .limit(1)
      .maybeSingle();

    if (existingWalletUse) {
      // Baneo fulminante a ambos involucrados
      await supabase.from('users').update({ is_banned: true }).eq('id', userId);
      await supabase.from('users').update({ is_banned: true }).eq('id', existingWalletUse.user_id);
      
      const banMsg = `🚫 <b>SISTEMA ANTI-FRAUDE ACTIVADO</b>\n\n` +
                     `Se detectó uso de Wallet duplicada.\n` +
                     `• <b>Infractor 1:</b> <code>${userId}</code>\n` +
                     `• <b>Infractor 2:</b> <code>${existingWalletUse.user_id}</code>\n` +
                     `• <b>Wallet:</b> <code>${address}</code>\n\n` +
                     `<i>Ambas cuentas han sido baneadas permanentemente.</i>`;
      await notifyBan(banMsg);

      return res.json({ success: false, error: "Fraude detectado: Esta wallet ya está vinculada a otra cuenta. Ambas han sido bloqueadas." });
    }

    // 3. Verificación de Cooldown (Límite de tiempo)
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
        return res.json({ success: false, error: `Límite alcanzado. Espera ${minsLeft} minutos.` });
      }
    }

    // 4. Ejecución del Pago en la Blockchain TON
    if (!MNEMONIC) throw new Error("ADMIN_MNEMONIC missing");

    const client = new TonClient({ endpoint: TON_RPC, apiKey: TON_API_KEY });
    const keyPair = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
    const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });
    const contract = client.open(wallet);
    
    const seqno = await contract.getSeqno();
    
    const transfer = contract.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: 3,
      messages: [
        internal({ 
          to: address, 
          value: toNano(WITHDRAW_FIXED.toString()), 
          bounce: false, 
          body: "IA Profit Payout Official" 
        })
      ]
    });

    await contract.send(transfer);
    const txHash = transfer.hash().toString('hex');

    // 5. Registro de Transacción y Descuento de Saldo
    await supabase.rpc('decrement_balance', { user_id: userId, amount: WITHDRAW_FIXED });
    await supabase.from('withdrawals').insert([{ 
      user_id: userId, 
      amount: WITHDRAW_FIXED, 
      status: 'completed', 
      tx_hash: txHash,
      address: address.trim() // Guardamos la wallet para futuras detecciones
    }]);

    // 6. Notificación Profesional al Canal
    const message = `💎 <b>PAGO VERIFICADO EXITOSAMENTE</b>\n\n` +
                    `👤 <b>Beneficiario:</b> <a href="tg://user?id=${user.id}">${user.username}</a>\n` +
                    `💸 <b>Monto Total:</b> ${WITHDRAW_FIXED} TON\n` +
                    `🛡️ <b>Red:</b> Toncoin (Ton)\n` +
                    `⚡ <b>Estado:</b> Finalizado / 100%\n\n` +
                    `🔹 <b>TXID (Blockchain):</b>\n<a href="https://tonscan.org/tx/${txHash}">${txHash}</a>\n\n` +
                    `🔥 <i>¡Ganancias reales con IA Profit!</i>`;

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: PAYMENTS_CHANNEL,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{ text: "💰 ¡EMPEZAR A GANAR AHORA!", url: "https://t.me/IAProfitTonBot/app" }]]
      }
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Withdraw Error:", err.message);
    return res.status(500).json({ success: false, error: "Error procesando el pago en red." });
  }
});

/* --- [ENDPOINT DE HISTORIAL] --- */

app.get('/api/history', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, error: "ID de usuario requerido" });

    const { data: history, error } = await supabase
      .from('withdrawals')
      .select('amount, status, created_at, tx_hash')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, history: history || [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = app;
