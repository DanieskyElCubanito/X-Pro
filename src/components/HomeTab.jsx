import { useState } from 'react';
import toast from 'react-hot-toast';
import { botApi } from '../api/botApi';

const neon = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
  iconBtn: { width: '46px', height: '46px', background: 'rgba(15, 5, 28, 0.8)', border: '2px solid #8a2be2', borderRadius: '14px', boxShadow: '0 0 10px rgba(138, 43, 226, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', color: '#ffffff' },
  title: { fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', textTransform: 'uppercase', color: '#00f0ff', margin: 0, textShadow: '0 0 15px rgba(0, 240, 255, 0.4)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' },
  statCard: (borderColor, bgColor, glowColor) => ({ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '20px', boxShadow: `0 4px 15px ${glowColor}`, padding: '16px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }),
  statInnerIcon: { width: '36px', height: '36px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '10px' },
  statNumber: { fontSize: '22px', fontWeight: '900', lineHeight: '1.1', marginBottom: '6px', color: '#ffffff' },
  statDesc: { fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.2', color: '#ff99dd' },
  infoCard: { background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.6), rgba(20, 8, 38, 0.8))', border: '2px solid #8a2be2', borderRadius: '26px', boxShadow: '0 8px 24px rgba(138, 43, 226, 0.2)', padding: '20px 18px', marginBottom: '20px' },
  howTitle: { fontSize: '14px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#ffe600', marginBottom: '16px' },
  howStep: { display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0' },
  howStepIcon: (bgColor, textColor, glowColor) => ({ width: '44px', height: '44px', background: bgColor, color: textColor, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', flexShrink: 0, boxShadow: `0 0 15px ${glowColor}` }),
  howStepText: { fontSize: '14px', fontWeight: '800', lineHeight: '1.3', color: '#ffffff' },
  dashedDivider: { border: 'none', borderTop: '2px dashed rgba(255, 65, 180, 0.4)', margin: '6px 0' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 2, 20, 0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100000 },
  modalContent: { width: '100%', height: '70vh', background: 'linear-gradient(180deg, rgba(46, 16, 77, 0.95), rgba(20, 8, 38, 1))', borderTop: '2px solid #00f0ff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 30px rgba(0, 240, 255, 0.2)' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(15, 5, 28, 0.8)', borderRadius: '12px', border: '1px solid rgba(138, 43, 226, 0.5)', marginBottom: '8px' }
};

export default function HomeTab({ userData, setActiveTab }) {
  const [showHistory, setShowHistory] = useState(false);
  const [History, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const clickBalance = Number(userData?.balance || 0).toFixed(2);
  const globalClicks = userData?.global_clicks || '0';
  const clicksReceived = userData?.clicks_received || '0';

  const openHistory = async () => {
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const res = await botApi.getHistory(userData.id);
      if (res.success) setRealHistory(res.history);
    } catch (e) {
      toast.error("Error al cargar historial");
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="fade-in" style={neon.container}>

      <div style={neon.header}>
        <div onClick={openHistory} style={neon.iconBtn}>🕒</div>
        <h1 style={neon.title}>INICIO</h1>
        <div style={{ width: '46px' }}></div> 
      </div>

      <div style={neon.statsGrid}>
        <div style={neon.statCard('#8a2be2', 'rgba(138, 43, 226, 0.2)', 'rgba(138, 43, 226, 0.3)')}>
          <div style={neon.statInnerIcon}>🌐</div>
          <div style={neon.statNumber}>{globalClicks}</div>
          <div style={{...neon.statDesc, color: '#ff99dd'}}>Clicks Globales</div>
        </div>
        <div style={neon.statCard('#00f0ff', 'rgba(0, 240, 255, 0.1)', 'rgba(0, 240, 255, 0.3)')}>
          <div style={neon.statInnerIcon}>⚡</div>
          <div style={{...neon.statNumber, color: '#00f0ff'}}>{clickBalance}</div>
          <div style={{...neon.statDesc, color: '#ffffff'}}>Saldo</div>
        </div>
        <div style={neon.statCard('#ff1493', 'rgba(255, 20, 147, 0.2)', 'rgba(255, 20, 147, 0.3)')}>
          <div style={neon.statInnerIcon}>📥</div>
          <div style={neon.statNumber}>{clicksReceived}</div>
          <div style={{...neon.statDesc, color: '#ff99dd'}}>Recibidos</div>
        </div>
      </div>

      <div style={neon.infoCard}>
        <div style={neon.howTitle}>MERCADO DE TRÁFICO</div>
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#00f0ff', '#050214', 'rgba(0, 240, 255, 0.4)')}>+</div>
          <div style={neon.howStepText}>Crea una campaña y atrae usuarios a tu Bot o Grupo.</div>
        </div>
        <hr style={neon.dashedDivider} />
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#ffe600', '#050214', 'rgba(255, 230, 0, 0.4)')}>⚡</div>
          <div style={neon.howStepText}>Completa tareas de otros para ganar saldo CLICK gratis.</div>
        </div>
        <hr style={neon.dashedDivider} />
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#ff1493', '#ffffff', 'rgba(255, 20, 147, 0.4)')}>💎</div>
          <div style={neon.howStepText}>Usa el menú inferior para ir al mercado de tráfico.</div>
        </div>
      </div>

            {/* MODAL DE HISTORIAL ACTUALIZADO */}
      {showHistory && (
        <div className="fade-in" style={neon.modalOverlay} onClick={() => setShowHistory(false)}>
          <div style={neon.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#00f0ff', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>
                🕒 Mi Historial
              </h3>
              <button onClick={() => setShowHistory(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#00f0ff', fontWeight: 'bold' }}>Cargando transacciones...</div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#ff99dd', fontWeight: 'bold' }}>Aún no hay movimientos recientes.</div>
              ) : (
                history.map((item) => (
                  <div key={item.id} style={{ ...neon.historyItem, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '14px', gap: '8px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '900', marginBottom: '4px' }}>
                          {item.title}
                        </div>
                        
                        {/* Nueva descripción del historial */}
                        {item.description && (
                          <div style={{ color: '#ff99dd', fontSize: '11px', lineHeight: '1.4' }}>
                            {item.description}
                          </div>
                        )}
                        
                        <div style={{ color: '#8a2be2', fontSize: '10px', marginTop: '6px', fontWeight: 'bold' }}>
                          {new Date(item.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Monto dinámico con colores */}
                      <div style={{ 
                        color: Number(item.amount) > 0 ? '#00ffaa' : Number(item.amount) < 0 ? '#ff1493' : '#00f0ff', 
                        fontSize: '16px', 
                        fontWeight: '900', 
                        textShadow: Number(item.amount) > 0 ? '0 0 5px rgba(0,255,170,0.5)' : 'none',
                        whiteSpace: 'nowrap'
                      }}>
                        {Number(item.amount) > 0 ? '+' : ''}{Number(item.amount) === 0 ? '-' : Number(item.amount).toFixed(2)} CLICK
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}