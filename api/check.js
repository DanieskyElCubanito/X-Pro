export default async function handler(req, res) {
  // Ahora recibimos user_id y la lista de canales (separados por coma)
  const { user_id, channels } = req.query;
  const BOT_TOKEN = process.env.BOT_TOKEN;

  if (!user_id || !channels) {
    return res.status(400).json({ error: "Faltan parámetros: user_id o channels" });
  }

  // Convertimos el string de canales en una lista (Array)
  const channelsList = channels.split(',');
  let missingChannels = [];

  for (let channel of channelsList) {
    const cleanChannel = channel.trim();
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${cleanChannel}&user_id=${user_id}`);
      const data = await response.json();

      if (!data.ok || data.result.status === 'left' || data.result.status === 'kicked') {
        missingChannels.push(cleanChannel);
      }
    } catch (error) {
      missingChannels.push(cleanChannel);
    }
  }

  const isMember = missingChannels.length === 0;
  return res.status(200).json({ 
    is_member: isMember, 
    missing_channels: missingChannels 
  });
}
