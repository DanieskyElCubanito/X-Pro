import axios from 'axios';

/**
 * Configuración unificada para Vercel.
 * Si tu archivo de backend es api/index.js, la ruta base es /api
 */
const api = axios.create({
  baseURL: '/api', 
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

export const botApi = {
  // 1. Verificar Usuario e Inicio
  verifyUser: async (user, startParam) => {
    try {
      const res = await api.post('/', { 
        user, 
        start_param: startParam 
      });
      return res.data;
    } catch (error) {
      console.error("Error en verifyUser:", error.response?.data || error.message);
      throw error;
    }
  },

  // 2. Re-verificar unión a canales
  checkChannels: async (userId) => {
    try {
      const res = await api.post('/', { 
        action: 'check-channels', 
        userId 
      });
      return res.data;
    } catch (error) {
      console.error("Error en checkChannels:", error.response?.data || error.message);
      throw error;
    }
  },

  // 3. Reclamar Bono Diario
  claimBonus: async (userId) => {
    try {
      const res = await api.post('/', { 
        action: 'claim-bonus', 
        userId 
      });
      return res.data;
    } catch (error) {
      console.error("Error en claimBonus:", error.response?.data || error.message);
      throw error;
    }
  },

  // 4. Retirar Saldo
  withdraw: async (userId, address, amount) => {
    try {
      const res = await api.post('/', { 
        action: 'withdraw', 
        userId, 
        address, 
        amount 
      });
      return res.data;
    } catch (error) {
      console.error("Error en withdraw:", error.response?.data || error.message);
      throw error;
    }
  },

  // 5. Obtener Historial
  getHistory: async (userId) => {
    try {
      const res = await api.post('/', { 
        action: 'get-history', 
        userId 
      });
      return res.data;
    } catch (error) {
      console.error("Error en getHistory:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 6. Verificar Humano con Cloudflare Turnstile
   * Se envía el captchaToken recibido del componente frontend para validación en servidor.
   */
  verifyHuman: async (userId, captchaToken) => {
    try {
      const res = await api.post('/', {
        action: 'verify-human',
        userId,
        captchaToken // Token generado por Cloudflare
      });
      return res.data;
    } catch (error) {
      console.error("Error en verifyHuman:", error.response?.data || error.message);
      throw error;
    }
  }
};

export default botApi;