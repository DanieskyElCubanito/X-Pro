import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles';

export default function DailyCheckIn({ userData, setUserData }) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState("");
  const [canClaim, setCanClaim] = useState(false); // 🔥 Corrección: Iniciamos en false para evitar parpadeos

  useEffect(() => {
    // Si los datos del usuario aún no han cargado desde el backend, protegemos el estado
    if (!userData || !userData.id) {
      setCanClaim(false);
      return;
    }

    // Si el usuario nunca ha reclamado un bono, habilitamos de inmediato
    if (!userData.last_bonus) {
      setCanClaim(true);
      setCooldown("");
      return;
    }

    const checkCooldown = () => {
      const now = Date.now();
      const lastBonusTime = new Date(userData.last_bonus).getTime();
      const timePassed = now - lastBonusTime;
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (timePassed < twentyFourHours) {
        setCanClaim(false);
        const timeLeft = twentyFourHours - timePassed;

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        setCooldown(`${hours}h ${minutes}m ${seconds}s`);
        return false; // No se puede reclamar
      } else {
        setCanClaim(true);
        setCooldown("");
        return true; // Ya se puede reclamar
      }
    };

    // Ejecutamos la verificación inmediatamente al montar o actualizar datos
    const available = checkCooldown();

    // Solo activamos el intervalo de cuenta regresiva si el bono NO está disponible
    let interval;
    if (!available) {
      interval = setInterval(() => {
        const stillLocked = !checkCooldown();
        if (!stillLocked && interval) {
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [userData]); // Escucha los cambios completos del objeto de usuario

  const handleDailyCheck = async () => {
    if (!canClaim || loading || !userData?.id) return;
    setLoading(true);

    try {
      const userId = userData?.id || 'invitado';
      const shareUrl = `https://t.me/Xokpro_Bot/app?startapp=${userId}`;
      const shareText = encodeURIComponent("🚀 ¡Mira esta Mini App para ganar Toncoin diario con Inteligencia Artificial! Entra ya: 💎");
      const telegramShareLink = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;

      WebApp.openTelegramLink(telegramShareLink);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (typeof window.showGiga === 'function') {
        const tid = toast.loading("Cargando recompensa...");
        window.showGiga()
          .then(async () => {
            const res = await botApi.claimBonus(userData.id);
            if (res.success) {
              toast.success("¡Bono diario reclamado con éxito! +0.001 TON", { id: tid });
              setUserData(prev => ({
                ...prev,
                balance: res.newBalance,
                last_bonus: new Date().toISOString()
              }));
            } else {
              toast.error("Error al procesar el bono.", { id: tid });
            }
          })
          .catch((err) => {
            toast.error("⚠️ Debes ver el anuncio completo para recibir la recompensa.", { id: tid });
            console.error(err);
          })
          .finally(() => setLoading(false));
      } else {
        toast.error("Error al cargar el sistema de anuncios.");
        setLoading(false);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado.");
      setLoading(false);
    }
  };

  // Determinamos si todo el componente está esperando datos globales
  const isAppLoading = !userData || !userData.id;

  return (
    <div style={{...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '28px' }}>🎁</div>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 'bold' }}>Check Daily</h4>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#888' }}>Comparte + Mira un Ad</p>
        </div>
      </div>
      <button 
        onClick={handleDailyCheck} 
        disabled={!canClaim || loading || isAppLoading}
        style={{
          ...s.btnGreen,
          padding: '8px 16px',
          fontSize: '13px',
          width: 'auto',
          backgroundColor: canClaim && !isAppLoading ? '#0088cc' : '#334455',
          opacity: canClaim && !loading && !isAppLoading ? 1 : 0.6,
          cursor: canClaim && !loading && !isAppLoading ? 'pointer' : 'not-allowed',
          border: 'none'
        }}
      >
        {loading || isAppLoading ? "Cargando..." : canClaim ? "+0.001 TON" : cooldown}
      </button>
    </div>
  );
}