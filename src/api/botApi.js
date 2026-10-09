import axios from 'axios';

const api = axios.create({
  baseURL: '/api', 
  timeout: 20000, 
  headers: { 'Content-Type': 'application/json' }
});

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

  publishPost: (userId, text, link, photoData, chatId, buttonConfig) => 
    postAction('publish-post', { userId, text, link, photoData, chatId, buttonConfig }),

  claimDailyChannel: (userId, channelId) => 
    postAction('claim-daily-channel', { userId, channelId }),

  getReferrals: (userId) => 
    postAction('get-referrals', { userId }),

  // --- NUEVAS FUNCIONES DE TAREAS ---
  createTask: (payload) => 
    postAction('create-task', payload),

  getTasks: (userId) => 
    postAction('get-tasks', { userId }),

  completeTask: (userId, taskId) => 
    postAction('complete-task', { userId, taskId })
};

export default botApi;
