import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles';

export default function DailyCheckIn({ userData, setUserData }) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState("");
  const [canClaim, setCanClaim] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);

  const REQUIRED_ADS = 15;

  useEffect(() => {
    if (!userData || !userData.id) {
      setCanClaim(false);
      return;
    }

    // Cargar progreso de anuncios desde el almacenamiento local
    const savedAds = localStorage.getItem(`ads_progress_${userData.id}`);
    if (savedAds) setAdsWatched(Number(savedAds));

    const checkCooldown = () => {
      if (!userData.last_bonus) return true;
      const timePassed = Date.now() - new Date(userData.last_bonus).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (timePassed < twentyFourHours) {
        const timeLeft = twentyFourHours - timePassed;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        setCooldown(`${hours}h ${minutes}m`);
        return false; 
      }
      return true; 
    };

    const available = checkCooldown();
    setCanClaim(available);

    let interval;
    if (!available) {
      interval = setInterval(() => {
        if (checkCooldown()) {
          setCanClaim(true);
          clearInterval(interval);
        }
      }, 60000); // Actualiza cada minuto para ahorrar recursos
    }

    return () => {
  if (interval) clearInterval(interval);
};
}, [userData]);

  const handleWatchAd = () => {
    if (typeof window.showGiga !== 'function') {
      return toast.error("El sistema de anuncios no está disponible ahora.");
    }
    
    const tid = toast.loading("Cargando anuncio...");
    window.showGiga()
      .then(() => {
        const newCount = adsWatched + 1;
        setAdsWatched(newCount);
        localStorage.setItem(`ads_progress_${userData.id}`, newCount.toString());
        toast.success(`¡Anuncio visto! (${newCount}/${REQUIRED_ADS})`, { id: tid });
      })
      .catch(() => {
        toast.error("Debes ver el anuncio completo.", { id: tid });
      });
  };

  const handleClaimReward = async () => {
    if (adsWatched < REQUIRED_ADS || loading) return;
    setLoading(true);
    const tid = toast.loading("Reclamando 1 PT...");

    try {
      const res = await botApi.claimBonus(userData.id);
      if (res.success) {
        toast.success("¡Has ganado 1 PT!", { id: tid });
        setAdsWatched(0);
        localStorage.removeItem(`ads_progress_${userData.id}`);
        setUserData(prev => ({
          ...prev,
          points: res.points,
          last_bonus: new Date().toISOString()
        }));
      } else {
        toast.error("Error al procesar el bono.", { id: tid });
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado.", { id: tid });
    } finally {
      setLoading(false);
    }
  };

  const isAppLoading = !userData || !userData.id;
  const isReadyToClaim = adsWatched >= REQUIRED_ADS;

  return (
    <div style={{...s.card, display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '28px' }}>🎁</div>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 'bold' }}>Bono Diario</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#888' }}>
              {!canClaim ? `Vuelve en ${cooldown}` : `Mira ${REQUIRED_ADS} ads para 1 PT`}
            </p>
          </div>
        </div>
        
        {canClaim && (
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: isReadyToClaim ? '#FFD700' : '#888' }}>
            {adsWatched} / {REQUIRED_ADS}
          </div>
        )}
      </div>

      {canClaim && (
        <button 
          onClick={isReadyToClaim ? handleClaimReward : handleWatchAd} 
          disabled={loading || isAppLoading}
          style={{
            ...s.btnGreen,
            width: '100%',
            padding: '10px',
            backgroundColor: isReadyToClaim ? '#FFD700' : '#0088cc',
            color: isReadyToClaim ? '#000' : '#fff',
            fontWeight: 'bold',
            border: 'none'
          }}
        >
          {loading ? "Procesando..." : isReadyToClaim ? "Reclamar 1 PT" : "Ver Anuncio"}
        </button>
      )}
    </div>
  );
}