import axios from 'axios';

// Detectar si estamos en local o en Vercel
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : ''; // En Vercel dejamos vacío para que sea relativa

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 segundos de espera
  headers: {
    'Content-Type': 'application/json'
  }
});

export const botApi = {
  verifyUser: async (user, startParam) => {
    try {
      // Enviamos SOLO lo que el backend espera para evitar errores de validación
      const res = await api.post('/api/verify', { 
        user: {
          id: user.id,
          username: user.username,
          first_name: user.first_name
        }, 
        start_param: startParam
      });
      return res.data;
    } catch (error) {
      console.error("Error en verifyUser:", error.response?.data || error.message);
      throw error; // Re-lanzamos para que el App.jsx lo capture
    }
  },

  claimMission: async (userId, missionId) => {
    try {
      const res = await api.post('/api/claim', { userId, missionId });
      return res.data;
    } catch (error) {
      console.error("Error en claimMission:", error);
      throw error;
    }
  },

  executeWithdraw: async (withdrawData) => {
    try {
      const res = await api.post('/api/withdraw', withdrawData);
      return res.data;
    } catch (error) {
      console.error("Error en withdraw:", error);
      throw error;
    }
  },

  getHistory: async (userId) => {
    try {
      const res = await api.get(`/api/history?userId=${userId}`);
      return res.data;
    } catch (error) {
      console.error("Error en history:", error);
      throw error;
    }
  }
};