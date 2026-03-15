export default async function handler(req, res) {
  // Ahora también pedimos el 'token' por la URL
  const { user_id, channels, token } = req.query;

  if (!user_id || !channels || !token) {
    return res.status(400).json({ 
      error: "Faltan parámetros", 
      ayuda: "Debes enviar user_id, channels y token" 
    });
  }

  const channelsList = channels.split(',');
  let missingChannels = [];
  let debugLog = [];

  for (let channel of channelsList) {
    let cleanChannel = channel.trim();
    if (!cleanChannel.startsWith('@') && !cleanChannel.startsWith('-100')) {
      cleanChannel = '@' + cleanChannel;
    }

    try {
      // Usamos el token que viene en la URL
      const response = await fetch(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${cleanChannel}&user_id=${user_id}`);
      const data = await response.json();

      debugLog.push({ channel: cleanChannel, ok: data.ok, status: data.result?.status });

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
