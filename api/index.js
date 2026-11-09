import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  "https://shfogfihzkwmusarhlxv.supabase.co",
  "sb_secret_iJuny6yxjMzqrSj_hoMmJA_SoJhjYu5",
  { auth: { persistSession: false } }
);

const BOT_TOKEN = "8954086426:AAEkDtxPVSRxhvtpBGkjkalusc4zby_tnIY";
const MAIN_ADMIN_ID = '8968109534'; 

// 🔥 LOS 10 PLANES DE ZAPATILLAS (2% Diario x 50 días = 100% Retorno + 100% Ganancia)
const SNEAKER_PLANS = [
  { id: 1, name: "Inicio", price: 10, daily_roi: 0.02, duration_days: 50, image: "https://i.imgur.com/placeholder1.png" },
  { id: 2, name: "Urban", price: 25, daily_roi: 0.02, duration_days: 50, image: "https://i.imgur.com/placeholder2.png" },
  { id: 3, name: "Runner", price: 50, daily_roi: 0.02, duration_days: 50, image: "https://i.imgur.com/placeholder3.png" },
  { id: 4, name: "Street", price: 100, daily_roi: 0.02, duration_days: 50, image: "https://i.imgur.com/placeholder4.png" },
  { id: 5, name: "Cyber", price: 250, daily_roi: 0.02, duration_days: 50, image: "https://i.imgur.com/placeholder5.png" },
  { id: 6, name: "Neon", price: 500, daily_roi: 0.02, duration_days: 50, image: "https://i.imgur.com/placeholder6.png" },
  { id: 7, name: "Hype", price: 1000, daily_roi: 0.02, duration_days: 50, image: "https://i.imgur.com/placeholder7.png" },
  { id: 8, name: "Elite", price: 2500, daily_roi: 0.02, duration_days: 50, image: "https://i.imgur.com/placeholder8.png" },
  { id: 9, name: "Master", price: 5000, daily_roi: 0.02, duration_days: 50, image: "https://i.imgur.com/placeholder9.png" },
  { id: 10, name: "Legend", price: 10000, daily_roi: 0.02, duration_days: 50, image: "https://i.imgur.com/placeholder10.png" }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 🔥 SEGURIDAD DESACTIVADA: No exigimos firma de Telegram para poder hacer pruebas libres
    const { user, action, userId, start_param } = req.body; 

    // ==========================================
    // SECCIÓN DE INVERSIÓN (ZAPATILLAS)
    // ==========================================
    if (action === 'get-plans') {
      return res.status(200).json({ success: true, plans: SNEAKER_PLANS });
    }

    // ==========================================
    // SISTEMA BASE DE USUARIOS (AHORA EN USDT)
    // ==========================================
    const targetUser = user || { id: userId, is_premium: false };
    const targetId = String(targetUser?.id);
    
    // Si entras desde el navegador de PC/Móvil sin usuario, asignamos un ID de prueba para que te deje ver la app
    if (!targetId || targetId === 'undefined') {
        return res.status(200).json({ 
            success: true, 
            user: { id: "999999", username: "DevTester", balance: 1000, total_earnings: 0, is_human: true } 
        });
    }

    let { data: dbUser } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();

    if (!dbUser) {
      const newUserObj = { 
        id: targetId, 
        username: targetUser.username || 'Inversor', 
        balance: 0, // 👈 Ahora esto representará USDT
        total_earnings: 0, 
        referral_earnings: 0, 
        is_human: true, // 👈 Saltamos el captcha automático
      };
      if (start_param && String(start_param) !== targetId) newUserObj.referred_by = String(start_param);
      const { data: newUser } = await supabase.from('users').insert([newUserObj]).select().single();
      dbUser = newUser;
    }

    return res.status(200).json({ success: true, user: dbUser });

  } catch (error) { 
    return res.status(500).json({ success: false, error: error.message }); 
  }
}
