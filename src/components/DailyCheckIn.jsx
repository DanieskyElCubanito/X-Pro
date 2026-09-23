import { useState } from 'react';
import toast from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles';

export default function DailyCheckIn({ userData, setUserData }) {
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const channels = [
    { id: "-1004308461940", name: "Crypto News", username: "Cryptotio", dbCol: "last_claim_cryptotio" },
    { id: "-1003928890953", name: "Payment Offers", username: "InstantPaymentOffers", dbCol: "last_claim_paymentoffers" }
  ];

  // --- LÓGICA DE ANUNCIOS ---
  const handleWatchAd = () => {
    if (typeof window.showGiga !== 'function') {
      return toast.error("El sistema de anuncios no está disponible ahora.");
    }
    if (loading) return;

    const tid = toast.loading("Cargando anuncio...");
    setLoading(true);

    window.showGiga()
      .then(async () => {
        toast.loading("Acreditando 0.1 PT...", { id: tid });
        try {
          const res = await botApi.claimBonus(userData.id);
          if (res.success) {
            toast.success("¡Has ganado +0.1 PT!", { id: tid });
            setUserData(prev => ({ ...prev, balance: res.balance }));
          } else {
            toast.error("Error al procesar el pago.", { id: tid });
          }
        } catch (error) {
          toast.error("Ocurrió un error inesperado con el servidor.", { id: tid });
        } finally {
          setLoading(false);
        }
      })
      .catch(() => {
        toast.error("Debes ver el anuncio completo para cobrar.", { id: tid });
        setLoading(false);
      });
  };

  // --- LÓGICA DE CANALES DIARIOS ---
  const handleClaimChannel = async (channel) => {
    setLoadingId(channel.id);
    const tid = toast.loading(`Verificando ${channel.name}...`);
    
    try {
      const res = await botApi.claimDailyChannel(userData.id, channel.id);
      if (res.success) {
        toast.success(`¡Has ganado +0.1 PT!`, { id: tid });
        setUserData(prev => ({
          ...prev,
          balance: res.balance,
          [channel.dbCol]: today
        }));
      } else {
        toast.error(res.error || "Error al verificar.", { id: tid });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error de conexión con el servidor.";
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* TARJETA DE ANUNCIOS */}
      <div style={{...s.card, display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '28px' }}>📺</div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 'bold' }}>Anuncios Ilimitados</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#888' }}>
                Gana 0.1 PT por cada anuncio que veas completo.
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleWatchAd} 
          disabled={loading || isAppLoading}
          style={{ ...s.btnGreen, width: '100%', padding: '10px', backgroundColor: '#0088cc', color: '#fff', fontWeight: 'bold', border: 'none' }}
        >
          {loading ? "Procesando..." : "Ver Anuncio (+0.1 PT)"}
        </button>
      </div>

      {/* TARJETA DE CANALES DIARIOS */}
      {!isAppLoading && (
        <div style={{...s.card, backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '24px' }}>📅</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 'bold' }}>Canales Diarios</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#888' }}>
                Únete y verifica cada 24h para ganar +0.1 PT
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {channels.map(ch => {
              const isClaimedToday = userData[ch.dbCol] === today;
              return (
                <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a3a5a', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{ch.name}</span>
                    <span style={{ color: '#0088cc', fontSize: '11px' }}>@{ch.username}</span>
                  </div>
                  
                  {isClaimedToday ? (
                    <span style={{ color: '#26A17B', fontSize: '12px', fontWeight: 'bold' }}>✅ Reclamado</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        onClick={() => handleJoin(ch.username)}
                        style={{ backgroundColor: '#0088cc', color: '#fff', border: 'none', borderRadius: '5px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        Unirme
                      </button>
                      <button 
                        onClick={() => handleClaimChannel(ch)}
                        disabled={loadingId === ch.id}
                        style={{ backgroundColor: '#26A17B', color: '#fff', border: 'none', borderRadius: '5px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        {loadingId === ch.id ? "..." : "Verificar"}
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
