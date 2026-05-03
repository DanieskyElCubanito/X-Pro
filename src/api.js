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
   * Verifica mediante Cloudflare Turnstile que el usuario es humano
   */
  verifyHuman: async (userId, captchaToken) => {
    try {
      const { data } = await api.post('/verify', {
        action: 'verify-human',
        userId,
        captchaToken
      });
      return data;
    } catch (error) {
      console.error("Error en verifyHuman:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Verifica si el usuario ya se unió a los canales de Telegram requeridos
   */
  checkChannels: async (userId) => {
    try {
      const { data } = await api.post('/verify', {
        action: 'check-channels',
        userId
      });
      return data;
    } catch (error) {
      console.error("Error en checkChannels:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * RECLAMA EL BONO DIARIO
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
   * Obtiene el historial de retiros del usuario
   */
  getHistory: async (userId) => {
    try {
      const { data } = await api.post('/verify', {
        action: 'get-history',
        userId
      });
      return data;
    } catch (error) {
      console.error("Error en getHistory:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Procesa recompensas de anuncios
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