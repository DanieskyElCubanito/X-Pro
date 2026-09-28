import axios from 'axios';

const api = axios.create({
  baseURL: '/api', 
  timeout: 20000, 
  headers: { 'Content-Type': 'application/json' }
});

/**
 * Función auxiliar para centralizar las peticiones y el manejo de errores.
 */
const postAction = async (action, payload = {}) => {
  try {
    const res = await api.post('', { action, ...payload });
    return res.data;
  } catch (error) {
    console.error(`Error en la acción '${action}':`, error.response?.data || error.message);
    throw error;
  }
};

export const botApi = {
  verifyUser: (user, startParam) => 
    postAction('verify', { user, start_param: startParam }),

  checkChannels: (userId) => 
    postAction('check-channels', { userId }),

  claimBonus: (userId) => 
    postAction('claim-bonus', { userId }),

  verifyHuman: (userId, method) => 
    postAction('verify-human', { userId, method }),

  publishPost: (userId, text, link, photoUrl, chatId) => 
    postAction('publish-post', { userId, text, link, photoUrl, chatId }),

  // Reclamar recompensa diaria por canal (0.1 PT)
  claimDailyChannel: (userId, channelId) => 
    postAction('claim-daily-channel', { userId, channelId })
};

export default botApi;
