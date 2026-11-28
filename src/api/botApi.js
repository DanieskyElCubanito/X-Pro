import axios from 'axios';
import WebApp from '@twa-dev/sdk'; // Necesitamos WebApp para obtener initData

const api = axios.create({
  baseURL: '/api',
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para inyectar initData de forma segura en CADA petición al backend
api.interceptors.request.use((config) => {
  const initData = WebApp.initData;
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }
  return config;
});

const postAction = async (action, payload = {}) => {
  try {
    const res = await api.post('', { action, ...payload });
    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message;
    console.error(`[API Error - ${action}]:`, errorMessage);
    throw new Error(errorMessage);
  }
};

export const botApi = {
  // Usuario, saldo real, planes activos y transacciones
  verifyUser: (user, startParam) =>
    postAction('verify', { user, start_param: startParam }),

  getDashboard: (userId) =>
    postAction('get-dashboard', { userId }),

  // Depósitos (USDT BEP-20 / GRAM-TON), Retiros y Reinversión Manual (Mín. $1 USD)
  generatePaymentWallet: (payload) =>
    postAction('generate-payment-wallet', payload),

  verifyCryptoPayment: (payload) =>
    postAction('verify-crypto-payment', payload),

  requestWithdraw: ({ user_id, amount, network, address }) =>
    postAction('request-withdraw', {
      userId: user_id,
      amount: Number(amount),
      network,
      address
    }),

  reinvestBalance: ({ user_id, amount }) =>
    postAction('reinvest-balance', {
      userId: user_id,
      amount: Number(amount)
    }),

  // Billeteras guardadas del usuario
  updateWallets: (userId, { wallet_bep20, wallet_ton }) =>
    postAction('update-wallets', {
      userId,
      wallet_bep20,
      wallet_ton
    }),

  // Referidos reales de 5 niveles (L1: 50%, L2: 30%, L3: 10%, L4: 5%, L5: 5%)
  getTeamStats: (userId) =>
    postAction('get-team-stats', { userId }),

  getReferrals: (userId) =>
    postAction('get-referrals', { userId }),

  // Historial de transacciones y bonos
  getHistory: (userId) =>
    postAction('get-history', { userId }),

  claimBonus: (userId) =>
    postAction('claim-bonus', { userId }),

  // Acciones previas mantenidas por compatibilidad con el backend
  verifyHuman: (userId, method) =>
    postAction('verify-human', { userId, method }),

  checkChannels: (userId) =>
    postAction('check-channels', { userId }),

  verifyBotAdmin: (url) =>
    postAction('verify-admin', { url }),

  createTask: (payload) =>
    postAction('create-task', payload),

  getTasks: (userId) =>
    postAction('get-tasks', { userId }),

  completeTask: (userId, taskId) =>
    postAction('complete-task', { userId, taskId }),

  generateStarsInvoice: (payload) =>
    postAction('generate-stars-invoice', payload),

  confirmStarsPayment: (payload) =>
    postAction('confirm-stars-payment', payload)
};

export default botApi;
