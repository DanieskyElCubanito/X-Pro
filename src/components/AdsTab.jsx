import { s } from '../styles/appStyles';
import toast from 'react-hot-toast';
import botApi from '../api/botApi';

function AdsTab({ userData, setUserData }) {
  // Asegurar formato de fecha para reiniciar el contador visual si es un nuevo día
  const today = new Date().toISOString().split('T')[0];
  const isSameDay = userData?.last_ad_date === today;
  
  const adsWatched = isSameDay ? (Number(userData?.ads_watched_today) || 0) : 0; 
  const totalAdsNeeded = 4;
  const isCompleted = adsWatched >= totalAdsNeeded;

  const handleWatchAd = async () => {
    if (isCompleted) {
      return toast.error("Ya viste todos los anuncios de hoy.");
    }
    
    const tid = toast.loading("Mostrando anuncio...");
    
    // Aquí integras la lógica del proveedor de anuncios (Giga Pub, etc.)
    // Asumimos que el usuario ve el anuncio y luego llamas a la API:
    
    try {
      const res = await botApi.claimAdReward(userData.id);
      
      if (res.success) {
        if (res.balance) {
          // Si el backend devolvió un balance nuevo, significa que completó los 4
          toast.success(res.message || "¡Completaste los 4 anuncios! Has ganado +1 PT.", { id: tid });
          setUserData(prev => ({ 
            ...prev, 
            balance: res.balance,
            ads_watched_today: 4,
            last_ad_date: today,
            last_ad_claimed_date: today
          }));
        } else {
          // Solo registró una vista
          toast.success(`Anuncio visto: ${res.adsCount}/4`, { id: tid });
          setUserData(prev => ({ 
            ...prev, 
            ads_watched_today: res.adsCount,
            last_ad_date: today
          }));
        }
      } else {
        toast.error(res.error || "Error al registrar el anuncio.", { id: tid });
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor.", { id: tid });
    }
  };

  return (
    <div className="tab-content fade-in" style={{ paddingBottom: '130px' }}>
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <span style={{ fontSize: '20px' }}>📺</span>
          <h4 style={{ margin: 0, color: '#ffcc00', fontSize: '14px', letterSpacing: '1px' }}>
            VER ANUNCIOS
          </h4>
        </div>
        
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>
          Mira 4 anuncios diarios para recibir 1 Punto (PT) y poder publicar en los grupos.
        </p>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#fff', fontSize: '24px', margin: '0 0 5px 0' }}>
            {adsWatched} / {totalAdsNeeded}
          </h2>
          <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>Anuncios vistos hoy</p>
        </div>

        <div style={{ width: '100%', backgroundColor: '#1a1a1a', borderRadius: '10px', height: '10px', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${(adsWatched / totalAdsNeeded) * 100}%`, 
            backgroundColor: '#ffcc00', 
            height: '100%', 
            transition: 'width 0.3s' 
          }}></div>
        </div>

        <button 
          style={{ ...s.btnGreen, width: '100%', backgroundColor: isCompleted ? '#555' : '#26A17B' }}
          onClick={handleWatchAd}
          disabled={isCompleted}
        >
          {isCompleted ? 'COMPLETADO POR HOY' : '📺 VER ANUNCIO'}
        </button>
      </div>
    </div>
  );
}

export default AdsTab;
