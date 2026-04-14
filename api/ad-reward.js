// api/ad-reward.js
import { createClient } from '@supabase/supabase-js';

// 1. Configuración de conexión (CORREGIDA)
const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'Falta el ID del usuario' });
  }

  try {
    // 2. Buscar al usuario en Supabase
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('balance, ads_watched, last_ad_date')
      .eq('id', userId)
      .single();

    if (fetchError || !user) throw new Error("Usuario no encontrado");

    // 3. Lógica de reinicio diario
    const today = new Date().toISOString().split('T')[0]; 
    let currentAds = user.ads_watched || 0;

    if (user.last_ad_date !== today) {
      currentAds = 0; 
    }

    // 4. Verificar límite de 50 anuncios
    if (currentAds >= 50) {
      return res.status(200).json({ success: false, error: "Límite diario alcanzado" });
    }

    // 5. Calcular nuevos valores (Uso de parseFloat para evitar errores con decimales)
    const newBalance = parseFloat(user.balance || 0) + 0.0001;
    const newAdsCount = currentAds + 1;

    // 6. Actualizar Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        balance: newBalance,
        ads_watched: newAdsCount,
        last_ad_date: today
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 7. Respuesta al frontend
    return res.status(200).json({
      success: true,
      newBalance: newBalance,
      newAdsCount: newAdsCount
    });

  } catch (error) {
    console.error('Error en ad-reward:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}
