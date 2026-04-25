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
  // 1. Verificar Usuario
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

  // 2. RECLAMAR BONO (¡Aquí estaba el fallo!)
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

  // 3. Retirar Saldo
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
  }
};

export default botApi;