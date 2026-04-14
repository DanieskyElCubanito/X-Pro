// src/api.js
import axios from 'axios';

/**
 * Configuración de Axios para conectar con las Serverless Functions de Vercel.
 * baseURL: '/api' le dice a la app que busque los archivos en la carpeta raíz /api/
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20 segundos para soportar conexiones lentas
});

export const botApi = {
  /**
   * Verifica al usuario al abrir la App (llama a api/verify.js)
   */
  verifyUser: async (user, startParam) => {
    try {
      const { data } = await api.post('/verify', { user, startParam });
      return data;
    } catch (error) {
      console.error("Error en verifyUser:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Reclama recompensas de misiones (llama a api/claim.js si existe)
   */
  claimMission: async (userId, missionId) => {
    try {
      const { data } = await api.post('/claim', { userId, missionId });
      return data;
    } catch (error) {
      console.error("Error en claimMission:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Procesa la recompensa por ver anuncios (llama a api/ad-reward.js)
   */
  adReward: async (userId) => {
    try {
      const { data } = await api.post('/ad-reward', { userId });
      return data;
    } catch (error) {
      console.error("Error en adReward:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Procesa solicitudes de retiro de saldo (llama a api/withdraw.js)
   */
  withdraw: async (userId, address, amount) => {
    try {
      const { data } = await api.post('/withdraw', { userId, address, amount });
      return data;
    } catch (error) {
      console.error("Error en withdraw:", error.response?.data || error.message);
      throw error;
    }
  }
};

export default api;
