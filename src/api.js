// src/api.js
import axios from 'axios';

/**
 * Configuración de Axios para conectar con las Serverless Functions de Vercel.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, 
});

export const botApi = {
  /**
   * Verifica al usuario al abrir la App
   */
  verifyUser: async (user, startParam) => {
    try {
      const { data } = await api.post('/verify', { 
        user, 
        start_param: startParam // Unificado con guion bajo para el backend
      });
      return data;
    } catch (error) {
      console.error("Error en verifyUser:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * RECLAMA EL BONO DIARIO (Esta es la que faltaba)
   */
  claimBonus: async (userId) => {
    try {
      const { data } = await api.post('/verify', { 
        action: 'claim-bonus', 
        userId 
      });
      return data;
    } catch (error) {
      console.error("Error en claimBonus:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Procesa solicitudes de retiro de saldo
   */
  withdraw: async (userId, address, amount) => {
    try {
      const { data } = await api.post('/verify', { 
        action: 'withdraw', 
        userId, 
        address, 
        amount 
      });
      return data;
    } catch (error) {
      console.error("Error en withdraw:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Procesa recompensas de anuncios (si decides volver a usarlos)
   */
  adReward: async (userId) => {
    try {
      const { data } = await api.post('/verify', { 
        action: 'ad-reward', 
        userId 
      });
      return data;
    } catch (error) {
      console.error("Error en adReward:", error.response?.data || error.message);
      throw error;
    }
  }
};

export default api;