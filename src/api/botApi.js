import axios from 'axios';

const api = axios.create({
  baseURL: '', 
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

export const botApi = {
  verifyUser: async (user, startParam) => {
    // Enviamos action: 'verify'
    const res = await api.post('/api', { action: 'verify', user, start_param: startParam });
    return res.data;
  },

  withdraw: async (userId, address, amount) => {
    // Enviamos action: 'withdraw'
    const res = await api.post('/api', { action: 'withdraw', userId, address, amount });
    return res.data;
  },

  adReward: async (userId) => {
    // Enviamos action: 'ad-reward'
    const res = await api.post('/api', { action: 'ad-reward', userId });
    return res.data;
  }
};