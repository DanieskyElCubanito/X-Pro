import axios from 'axios';

// Configuración central de la API para la Mini App
const api = axios.create({
  baseURL: '/api', 
  timeout: 25000, // 25s para evitar cortes en conexiones móviles lentas
  headers: { 'Content-Type': 'application/json' }
});

// Helper centralizado para manejar todas las peticiones al backend
const postAction = async (action, payload = {}) => {
  try {
    const res = await api.post('', { action, ...payload });
    return res.data;
  } catch (error) {
    // Extracción de error limpia para que los 'toasts' del frontend lo lean fácilmente
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
    console.error(`[API Error - ${action}]:`, errorMessage);
    throw new Error(errorMessage);
  }
};

export const botApi = {
  // --- MÓDULO DE AUTENTICACIÓN Y SEGURIDAD ---
  verifyUser: (user, startParam) => postAction('verify', { user, start_param: startParam }),
  verifyHuman: (userId, method) => postAction('verify-human', { userId, method }),
  checkChannels: (userId) => postAction('check-channels', { userId }),

  // --- MÓDULO DE ECONOMÍA Y AFILIADOS ---
  claimBonus: (userId) => postAction('claim-bonus', { userId }),
  getReferrals: (userId) => postAction('get-referrals', { userId }),

  // --- MÓDULO DE CAMPAÑAS Y TAREAS (MERCADO DE TRÁFICO) ---
  verifyBotAdmin: (url) => postAction('verify-admin', { url }),
  createTask: (payload) => postAction('create-task', payload),
  getTasks: (userId) => postAction('get-tasks', { userId }),
  completeTask: (userId, taskId) => postAction('complete-task', { userId, taskId }),

  // --- MÓDULOS EXTRA / LEGACY ---
  publishPost: (userId, text, link, photoData, chatId, buttonConfig) => 
    postAction('publish-post', { userId, text, link, photoData, chatId, buttonConfig }),
  claimDailyChannel: (userId, channelId) => 
    postAction('claim-daily-channel', { userId, channelId })
};

export default botApi;
