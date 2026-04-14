import axios from 'axios';

// Configuración base por si decides cambiar de dominio luego
const api = axios.create({
  baseURL: '/', // Aquí puedes poner tu URL base si no es relativa
});

export const botApi = {
  // Verificar usuario al iniciar
  verifyUser: async (user, startParam) => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userLang = navigator.language || navigator.userLanguage;
    const res = await api.post('/api/verify', { 
      user, 
      start_param: startParam,
      tz: userTimezone,
      ln: userLang
    });
    return res.data;
  },

  // Reclamar recompensa de misión
  claimMission: async (userId, missionId) => {
    const res = await api.post('/api/claim-mission', { userId, missionId });
    return res.data;
  },

  // Ejecutar retiro
  executeWithdraw: async (withdrawData) => {
    const res = await api.post('/api/withdraw', withdrawData);
    return res.data;
  },

  // Cargar historial
  getHistory: async (userId) => {
    const res = await api.get(`/api/history?userId=${userId}`);
    return res.data;
  }
};
