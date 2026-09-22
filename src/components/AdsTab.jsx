import { useState } from 'react';
import { s } from '../styles/appStyles';
import toast from 'react-hot-toast';

function AdsTab({ userData, setUserData }) {
  // Simularemos el estado de anuncios vistos por ahora (0 a 4)
  const [adsWatched, setAdsWatched] = useState(0); 
  const totalAdsNeeded = 4;

  const handleWatchAd = () => {
    if (adsWatched >= totalAdsNeeded) {
      toast.error("Ya viste todos los anuncios de hoy.");
      return;
    }
    
    const tid = toast.loading("Cargando anuncio...");
    // Aquí conectaremos la red de anuncios (ej. Giga Pub)
    setTimeout(() => {
      toast.dismiss(tid);
      const newCount = adsWatched + 1;
      setAdsWatched(newCount);
      
      if (newCount === totalAdsNeeded) {
        toast.success("¡Completaste los 4 anuncios! Has ganado +1 PT.");
        setUserData(prev => ({ ...prev, points: (prev.points || 0) + 1 }));
      } else {
        toast.success(`Anuncio visto: ${newCount}/4`);
      }
    }, 2000);
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

        {/* Barra de progreso */}
        <div style={{ width: '100%', backgroundColor: '#1a1a1a', borderRadius: '10px', height: '10px', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${(adsWatched / totalAdsNeeded) * 100}%`, 
            backgroundColor: '#ffcc00', 
            height: '100%', 
            transition: 'width 0.3s' 
          }}></div>
        </div>

        <button 
          style={{ ...s.btnGreen, width: '100%', backgroundColor: adsWatched >= totalAdsNeeded ? '#555' : '#26A17B' }}
          onClick={handleWatchAd}
          disabled={adsWatched >= totalAdsNeeded}
        >
          {adsWatched >= totalAdsNeeded ? 'COMPLETADO POR HOY' : '📺 VER ANUNCIO'}
        </button>
      </div>
    </div>
  );
}

export default AdsTab;
