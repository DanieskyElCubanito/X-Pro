import axios from 'axios';

const api = axios.create({
  baseURL: '/api', 
  timeout: 20000, 
  headers: { 'Content-Type': 'application/json' }
});

export const botApi = {
  verifyUser: async (user, startParam) => {
    try {
      const res = await api.post('', { action: 'verify', user, start_param: startParam });
      return res.data;
    } catch (error) {
      console.error("Error en verifyUser:", error.response?.data || error.message);
      throw error;
    }
  },

  checkChannels: async (userId) => {
    try {
      const res = await api.post('', { action: 'check-channels', userId });
      return res.data;
    } catch (error) {
      console.error("Error en checkChannels:", error.response?.data || error.message);
      throw error;
    }
  },

  claimBonus: async (userId) => {
    try {
      const res = await api.post('', { action: 'claim-bonus', userId });
      return res.data;
    } catch (error) {
      console.error("Error en claimBonus:", error.response?.data || error.message);
      throw error;
    }
  },

  verifyHuman: async (userId, method) => {
    try {
      const res = await api.post('', { action: 'verify-human', userId, method });
      return res.data;
    } catch (error) {
      console.error("Error en verifyHuman:", error.response?.data || error.message);
      throw error;
    }
  },

  publishPost: async (userId, text, link, photoUrl, chatId) => {
    try {
      const res = await api.post('', {
        action: 'publish-post',
        userId,
        text,
        link,
        photoUrl,
        chatId
      });
      return res.data;
    } catch (error) {
      console.error("Error en publishPost:", error.response?.data || error.message);
      throw error;
    }
  },

  // NUEVO: Reclamar recompensa diaria por canal (0.1 PT)
  claimDailyChannel: async (userId, channelId) => {
    try {
      const res = await api.post('', {
        action: 'claim-daily-channel',
        userId,
        channelId
      });
      return res.data;
    } catch (error) {
      console.error("Error en claimDailyChannel:", error.response?.data || error.message);
      throw error;
    }
  }
};

export default botApi;
