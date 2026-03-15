export default async function handler(req, res) {
  const { user_id, channels } = req.query;
  const BOT_TOKEN = process.env.BOT_TOKEN;

  if (!user_id || !channels) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  const channelsList = channels.split(',');
  let missingChannels = [];
  let debugLog = []; // Para saber qué responde Telegram exactamente

  for (let channel of channelsList) {
    let cleanChannel = channel.trim();
    // Si el canal no empieza con @ ni con -100, le ponemos el @ por defecto
    if (!cleanChannel.startsWith('@') && !cleanChannel.startsWith('-100')) {
      cleanChannel = '@' + cleanChannel;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${cleanChannel}&user_id=${user_id}`);
      const data = await response.json();

      debugLog.push({ channel: cleanChannel, status: data.result?.status, ok: data.ok });

      // Verificamos si el usuario es miembro, administrador o creador
      const isMember = data.ok && ['member', 'administrator', 'creator'].includes(data.result.status);

      if (!isMember) {
        missingChannels.push(cleanChannel);
      }
    } catch (error) {
      missingChannels.push(cleanChannel);
    }
  }

  return res.status(200).json({ 
    is_member: missingChannels.length === 0, 
    missing_channels: missingChannels,
    debug: debugLog 
  });
        }
