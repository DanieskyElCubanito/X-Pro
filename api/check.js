export default async function handler(req, res) {
  // Obtenemos el ID del usuario desde la URL (ej: /api/check?user_id=123456789)
  const { user_id } = req.query;

  // Tu token del bot y los canales deben estar en las variables de entorno de Vercel
  const BOT_TOKEN = process.env.BOT_TOKEN;
  
  // Lista de tus 4 canales (pueden ser @nombres o IDs numéricos como -100123456)
  const channels = ['@tuCanal1', '@tuCanal2', '@tuCanal3', '@tuCanal4'];

  if (!user_id) {
    return res.status(400).json({ error: "Falta el parámetro user_id" });
  }

  let missingChannels = [];

  for (let channel of channels) {
    try {
      // Llamada a la API oficial de Telegram
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${channel}&user_id=${user_id}`);
      const data = await response.json();

      // Si la API de Telegram da error, o el estado del usuario es 'left' o 'kicked', no está en el canal
      if (!data.ok || data.result.status === 'left' || data.result.status === 'kicked') {
        missingChannels.push(channel);
      }
    } catch (error) {
      // Si hay un error de conexión, asumimos que falló la verificación de ese canal
      missingChannels.push(channel);
    }
  }

  // Si missingChannels tiene elementos, el usuario no está en todos los canales
  if (missingChannels.length > 0) {
    return res.status(200).json({ 
      is_member: false, 
      missing_channels: missingChannels 
    });
  } else {
    // Está en los 4 canales
    return res.status(200).json({ 
      is_member: true, 
      missing_channels: [] 
    });
  }
}
