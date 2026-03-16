export default async function handler(req, res) {
  const { user_id, channels, token } = req.query;

  if (!user_id || !channels || !token) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  const channelsList = channels.split(',');
  let missingChannels = [];

  for (let channel of channelsList) {
    let cleanChannel = channel.trim();
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${cleanChannel}&user_id=${user_id}`);
      const data = await response.json();

      // Verificamos si es miembro, admin o creador
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
    missing_channels: missingChannels 
  });
}
