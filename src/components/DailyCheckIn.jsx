import { useState } from 'react';
import toast from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles';

export default function DailyCheckIn({ userData, setUserData }) {
  const [loading, setLoading] = useState(false);

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
          // Llama al botApi para sumar el saldo directamente
          const res = await botApi.claimBonus(userData.id);
          
          if (res.success) {
            toast.success("¡Has ganado +0.1 PT!", { id: tid });
            setUserData(prev => ({
              ...prev,
              balance: res.balance // Asegúrate de que tu backend devuelva el nuevo balance aquí
            }));
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
        // Si el usuario cierra el anuncio antes de tiempo, cae aquí y no cobra
        toast.error("Debes ver el anuncio completo para cobrar.", { id: tid });
        setLoading(false);
      });
  };

  const isAppLoading = !userData || !userData.id;

  return (
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
        style={{
          ...s.btnGreen,
          width: '100%',
          padding: '10px',
          backgroundColor: '#0088cc',
          color: '#fff',
          fontWeight: 'bold',
          border: 'none'
        }}
      >
        {loading ? "Procesando..." : "Ver Anuncio (+0.1 PT)"}
      </button>
    </div>
  );
}
