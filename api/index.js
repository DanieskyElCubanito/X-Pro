import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://shfogfihzkwmusarhlxv.supabase.co",
  "sb_secret_g_KaYGOEQVt0EOYcFENy7g_gzGYQfdx"
);

// TOKEN DE TU BOT DE TELEGRAM
const BOT_TOKEN = "8272127366:AAHwAbfVqQDklyLYI0PVo5gvveLaTGtUS6Y";

/**
 * Función para verificar si un usuario está en un canal específico
 */
async function checkMembership(userId, chatId) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`;
    const response = await fetch(url);
    const resData = await response.json();
    
    if (!resData.ok) return false;
    
    const status = resData.result.status;
    // Consideramos válidos estos estados
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (error) {
    console.error(`Error verificando canal ${chatId}:`, error);
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { user, action, userId, amount, start_param } = req.body; 

    // --- ACCIÓN: VERIFICAR CANALES (Botón de la App) ---
    if (action === 'check-channels') {
      const isMember1 = await checkMembership(userId, "-1002228067712"); // Crypto ₿itcoin
      const isMember2 = await checkMembership(userId, "-1003747302094"); // Crypto Finanzas
      
      return res.status(200).json({
        success: true,
        channel1: isMember1,
        channel2: isMember2,
        allJoined: isMember1 && isMember2
      });
    }

    // --- ACCIÓN: COBRAR BONO DIARIO ---
    if (action === 'claim-bonus') {
      const { data: u } = await supabase.from('users').select('*').eq('id', userId).single();
      const now = Date.now();
      const lastBonus = u.last_bonus ? new Date(u.last_bonus).getTime() : 0;
      const hours24 = 24 * 60 * 60 * 1000;

      if (now - lastBonus < hours24) {
        const faltan = Math.ceil((hours24 - (now - lastBonus)) / (1000 * 60 * 60));
        return res.status(400).json({ error: `Vuelve en ${faltan} horas` });
      }

      const reward = 0.001;
      const newB = (Number(u.balance) || 0) + reward;
      await supabase.from('users').update({ balance: newB, last_bonus: new Date().toISOString() }).eq('id', userId);
      return res.status(200).json({ success: true, newBalance: newB });
    }

    // --- ACCIÓN: RETIRO ---
    if (action === 'withdraw') {
      const { data: u } = await supabase.from('users').select('balance').eq('id', userId).single();
      if (u.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' });
      await supabase.from('users').update({ balance: u.balance - amount }).eq('id', userId);
      return res.status(200).json({ success: true });
    }

    // --- ACCIÓN: VERIFICAR / INICIO (Lógica de Referidos Pro + Canales) ---
    if (!user?.id) return res.status(400).json({ error: 'No user id' });
    let { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (!dbUser) {
      // EL USUARIO NO EXISTE -> LO CREAMOS Y ASIGNAMOS REFERIDO
      const newUserObj = { 
        id: user.id, 
        username: user.username || 'Gamer', 
        balance: 0 
      };

      // Si existe un código de invitación y no es él mismo invitándose
      if (start_param && start_param !== String(user.id)) {
        newUserObj.referred_by = start_param;
      }

      const { data: newUser, error: insError } = await supabase
        .from('users')
        .insert([newUserObj])
        .select()
        .single();

      if (insError) throw insError;
      dbUser = newUser;

      // --- PAGO DE COMISIÓN AUTOMÁTICA AL INVITADOR (Nivel 1: 0.003 TON) ---
      if (newUserObj.referred_by) {
        const { data: inviter } = await supabase.from('users').select('balance').eq('id', newUserObj.referred_by).single();
        if (inviter) {
          const newInviterBalance = (Number(inviter.balance) || 0) + 0.003;
          await supabase.from('users').update({ balance: newInviterBalance }).eq('id', newUserObj.referred_by);
        }
      }
    }

    // --- VERIFICACIÓN DE CANALES AL INICIAR ---
    const isMember1 = await checkMembership(user.id, "-1002228067712");
    const isMember2 = await checkMembership(user.id, "-1003747302094");

    // --- CÁLCULO DE LA RED DE TRABAJO (Los 3 Niveles) ---

    // NIVEL 1 (Directos)
    const { data: lv1 } = await supabase.from('users').select('id, balance').eq('referred_by', user.id);
    const n1 = lv1?.length || 0;
    const c1 = n1 * 0.003; 
    const ids1 = lv1?.map(u => u.id) || [];

    // NIVEL 2 (Invitados de tus directos)
    let n2 = 0, c2 = 0, ids2 = [];
    if (ids1.length > 0) {
      const { data: lv2 } = await supabase.from('users').select('id, balance').in('referred_by', ids1);
      n2 = lv2?.length || 0;
      c2 = n2 * 0.002; 
      ids2 = lv2?.map(u => u.id) || [];
    }

    // NIVEL 3 (Invitados de los de Nivel 2)
    let n3 = 0, c3 = 0;
    if (ids2.length > 0) {
      const { data: lv3 } = await supabase.from('users').select('id, balance').in('referred_by', ids2);
      n3 = lv3?.length || 0;
      c3 = n3 * 0.001; 
    }

    // RETORNAMOS TODO JUNTO: Datos, Red y Estado de los Canales
    return res.status(200).json({
      success: true,
      user: dbUser,
      stats: { 
        n1, c1: c1.toFixed(4), 
        n2, c2: c2.toFixed(4), 
        n3, c3: c3.toFixed(4) 
      },
      mustJoin: !(isMember1 && isMember2), // Si le falta alguno, esto será TRUE
      channels: { c1: isMember1, c2: isMember2 } // Detalle de qué canal le falta
    });

  } catch (error) {
    console.error("Error en el handler:", error);
    return res.status(500).json({ error: error.message });
  }
}