import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles';

export default function DailyCheckIn({ userData, setUserData }) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState("");
  const [canClaim, setCanClaim] = useState(true);

  useEffect(() => {
    if (!userData?.last_bonus) {
      setCanClaim(true);
      return;
    }

    const interval = setInterval(() => {
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
      } else {
        setCanClaim(true);
        setCooldown("");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userData?.last_bonus]);

  const handleDailyCheck = async () => {
    if (!canClaim || loading) return;
    setLoading(true);

    try {
      const userId = userData?.id || 'invitado';
      const shareUrl = `https://t.me/IAProfitTonBot/app?startapp=${userId}`;
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
        disabled={!canClaim || loading}
        style={{
          ...s.btnGreen,
          padding: '8px 16px',
          fontSize: '13px',
          width: 'auto',
          backgroundColor: canClaim ? '#0088cc' : '#334455',
          opacity: canClaim && !loading ? 1 : 0.6,
          cursor: canClaim && !loading ? 'pointer' : 'not-allowed',
          border: 'none'
        }}
      >
        {loading ? "Cargando..." : canClaim ? "+0.001 TON" : cooldown}
      </button>
    </div>
  );
}
