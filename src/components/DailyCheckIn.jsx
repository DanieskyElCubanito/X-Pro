import { useState } from 'react';
import toast from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles';

// --- ESTILOS LOCALES NEÓN CYBERPUNK ---
const localNeon = {
  card: {
    background: 'linear-gradient(135deg, rgba(38, 14, 66, 0.9), rgba(18, 7, 36, 0.9))',
    border: '1.5px solid #8a2be2',
    borderRadius: '20px',
    padding: '16px',
    boxShadow: '0 4px 15px rgba(138, 43, 226, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  channelRow: {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    background: 'rgba(15, 5, 28, 0.6)', 
    padding: '12px', 
    borderRadius: '14px',
    border: '1px solid rgba(0, 240, 255, 0.2)'
  },
  btnBlue: {
    background: 'linear-gradient(90deg, #00f0ff, #0088ff)',
    color: '#050214',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '11px',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0, 240, 255, 0.3)'
  },
  btnMagenta: {
    background: 'linear-gradient(90deg, #ff1493, #d80073)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '11px',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(255, 20, 147, 0.3)'
  }
};

export default function DailyCheckIn({ userData, setUserData }) {
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const channels = [
    { id: "-1004362492963", name: "Crypto Web3", username: "CryptoWeb3Pay", dbCol: "last_claim_cryptotio" },
    { id: "-1004490423840", name: "The Danny Dev", username: "TheDannyDev", dbCol: "last_claim_paymentoffers" }
  ];

  // --- LÓGICA DE ANUNCIOS ---
  const handleWatchAd = () => {
    if (typeof window.showGiga !== 'function') {
      return toast.error("La red de anuncios no está disponible ahora.");
    }
    if (loading) return;

    const tid = toast.loading("Sintonizando señal de video...");
    setLoading(true);

    window.showGiga()
      .then(async () => {
        toast.loading("Acreditando +0.10 CLICK...", { id: tid });
        try {
          const res = await botApi.claimBonus(userData.id);
          if (res.success) {
            toast.success("¡Energía obtenida! +0.10 CLICK", { id: tid });
            setUserData(prev => ({ ...prev, balance: res.balance }));
          } else {
            toast.error("Error al procesar la recompensa.", { id: tid });
          }
        } catch (error) {
          toast.error("Error de conexión con el servidor principal.", { id: tid });
        } finally {
          setLoading(false);
        }
      })
      .catch(() => {
        toast.error("Debes ver la transmisión completa para cobrar.", { id: tid });
        setLoading(false);
      });
  };

  // --- LÓGICA DE CANALES DIARIOS ---
  const handleClaimChannel = async (channel) => {
    setLoadingId(channel.id);
    const tid = toast.loading(`Verificando escaneo en ${channel.name}...`);

    try {
      const res = await botApi.claimDailyChannel(userData.id, channel.id);
      if (res.success) {
        toast.success(`¡Verificado! +0.10 CLICK añadidos.`, { id: tid });
        setUserData(prev => ({
          ...prev,
          balance: res.balance,
          [channel.dbCol]: today
        }));
      } else {
        toast.error(res.error || "No hemos detectado tu ingreso al canal.", { id: tid });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Fallo en la comunicación con la base de datos.";
      toast.error(errorMsg, { id: tid });
    } finally {
      setLoadingId(null);
    }
  };

  const handleJoin = (username) => {
    window.open(`https://t.me/${username}`, '_blank');
  };

  const isAppLoading = !userData || !userData.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '15px' }}>

      {/* TARJETA DE ANUNCIOS INFINITOS */}
      <div className="fade-in" style={localNeon.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '32px', filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.4))' }}>📺</div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#00f0ff', fontWeight: '900', textTransform: 'uppercase' }}>
                Energía Ilimitada
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#ff99dd', fontWeight: 'bold' }}>
                Gana 0.10 CLICK por cada transmisión.
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleWatchAd} 
          disabled={loading || isAppLoading}
          style={{ ...s.btnPrimary, padding: '12px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "SINTONIZANDO..." : "▶ VER TRANSMISIÓN (+0.10 CLICK)"}
        </button>
      </div>

      {/* TARJETA DE CHECK-IN DIARIO DE CANALES */}
      {!isAppLoading && (
        <div className="fade-in" style={localNeon.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
            <span style={{ fontSize: '32px', filter: 'drop-shadow(0 0 10px rgba(255, 230, 0, 0.4))' }}>📅</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#ffe600', fontWeight: '900', textTransform: 'uppercase' }}>
                Recompensas Diarias
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#ff99dd', fontWeight: 'bold' }}>
                Verifica tu estado cada 24h para ganar saldo.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {channels.map(ch => {
              const isClaimedToday = userData[ch.dbCol] === today;
              return (
                <div key={ch.id} style={localNeon.channelRow}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#ffffff', fontWeight: '900', fontSize: '13px' }}>{ch.name}</span>
                    <span style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold' }}>@{ch.username}</span>
                  </div>

                  {isClaimedToday ? (
                    <span style={{ 
                      color: '#00ffaa', fontSize: '11px', fontWeight: '900', 
                      background: 'rgba(0, 255, 170, 0.1)', padding: '6px 10px', borderRadius: '8px', border: '1px solid #00ffaa'
                    }}>
                      ✓ RECLAMADO
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleJoin(ch.username)}
                        style={localNeon.btnBlue}
                      >
                        UNIRME
                      </button>
                      <button 
                        onClick={() => handleClaimChannel(ch)}
                        disabled={loadingId === ch.id}
                        style={{ ...localNeon.btnMagenta, opacity: loadingId === ch.id ? 0.6 : 1 }}
                      >
                        {loadingId === ch.id ? "..." : "VERIFICAR"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
