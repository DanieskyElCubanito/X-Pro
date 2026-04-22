import axios from 'axios';

const api = axios.create({
  baseURL: '', // Relativo en Vercel
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

export const botApi = {
  verifyUser: async (user, startParam) => {
    const res = await api.post('/api/verify', { user, start_param: startParam });
    return res.data;
  },

  // ESTA FUNCIÓN SE LLAMA "withdraw" EN App.jsx
  withdraw: async (userId, address, amount) => {
    const res = await api.post('/api/withdraw', { userId, address, amount });
    return res.data;
  },

  // ESTA FUNCIÓN ES LA QUE LLAMA EL BOTÓN DE ANUNCIOS
  adReward: async (userId) => {
    const res = await api.post('/api/ad-reward', { userId });
    return res.data;
  },

  getHistory: async (userId) => {
    const res = await api.get(`/api/history?userId=${userId}`);
    return res.data;
  }
};