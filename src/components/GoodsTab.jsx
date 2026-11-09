import React, { useState } from 'react';
import toast from 'react-hot-toast';

// 🔥 LOS 10 PLANES DE ZAPATILLAS (2% Diario)
const SNEAKER_PLANS = [
  { id: 1, name: "Inicio", price: 10, color: "#00f0ff", icon: "👟", return: "200%" },
  { id: 2, name: "Urban", price: 25, color: "#ff1493", icon: "🛹", return: "200%" },
  { id: 3, name: "Runner", price: 50, color: "#00ffaa", icon: "🏃", return: "200%" },
  { id: 4, name: "Street", price: 100, color: "#ffe600", icon: "🔥", return: "200%" },
  { id: 5, name: "Cyber", price: 250, color: "#8a2be2", icon: "🦿", return: "200%" },
  { id: 6, name: "Neon", price: 500, color: "#ff41b4", icon: "✨", return: "200%" },
  { id: 7, name: "Hype", price: 1000, color: "#00f0ff", icon: "🚀", return: "200%" },
  { id: 8, name: "Elite", price: 2500, color: "#ff1493", icon: "💎", return: "200%" },
  { id: 9, name: "Master", price: 5000, color: "#00ffaa", icon: "👑", return: "200%" },
  { id: 10, name: "Legend", price: 10000, color: "#ffe600", icon: "🏆", return: "200%" }
];

export default function GoodsTab({ userData, setUserData, t }) {
  const [view, setView] = useState('market'); // 'market' o 'my_shoes'
  const [processingId, setProcessingId] = useState(null);

  // Simulador de compra de zapatillas
  const handleBuySneaker = (plan) => {
    if (userData.balance < plan.price) {
      toast.error(`Saldo insuficiente. Necesitas ${plan.price} USDT.`);
      return;
    }

    setProcessingId(plan.id);
    
    // Simulamos la llamada a la blockchain / backend
    setTimeout(() => {
      setUserData(prev => ({
        ...prev,
        balance: prev.balance - plan.price
      }));
      setProcessingId(null);
      toast.success(`¡Plan ${plan.name} adquirido con éxito!`);
      // Aquí luego agregaremos la zapatilla a 'Mis Planes'
    }, 1500);
  };

  const styles = {
    toggleContainer: { display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '6px', marginBottom: '20px', border: '1px solid #3d1b63' },
    toggleBtn: (active) => ({ flex: 1, padding: '12px', fontSize: '13px', fontWeight: '900', color: active ? '#fff' : '#888', background: active ? 'linear-gradient(90deg, #ff1493, #8a2be2)' : 'transparent', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.5px' }),
    card: (color) => ({ background: 'linear-gradient(145deg, rgba(20,5,40,0.8), rgba(10,2,20,0.9))', border: `1px solid ${color}40`, borderRadius: '20px', padding: '16px', marginBottom: '16px', position: 'relative', overflow: 'hidden', boxShadow: `0 4px 15px ${color}15` }),
    cardGlow: (color) => ({ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle, ${color}10 0%, transparent 60%)`, pointerEvents: 'none' }),
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    titleBox: { display: 'flex', alignItems: 'center', gap: '10px' },
    iconBox: (color) => ({ width: '40px', height: '40px', borderRadius: '12px', background: `${color}20`, border: `1px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: `0 0 10px ${color}40` }),
    title: { margin: 0, fontSize: '16px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
    price: (color) => ({ margin: 0, fontSize: '18px', fontWeight: '900', color: color, textShadow: `0 0 10px ${color}50` }),
    statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' },
    statBox: { background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' },
    statLabel: { fontSize: '10px', color: '#aaa', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' },
    statValue: { fontSize: '14px', color: '#fff', fontWeight: '900' },
    buyBtn: (color, loading) => ({ width: '100%', padding: '12px', background: loading ? 'transparent' : `${color}20`, border: `1px solid ${color}`, color: color, borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: loading ? 'none' : `0 0 10px ${color}30` })
  };

  return (
    <div style={{ paddingBottom: '20px' }}>
      
      {/* PESTAÑAS SUPERIORES */}
      <div style={styles.toggleContainer}>
        <button style={styles.toggleBtn(view === 'market')} onClick={() => setView('market')}>
          {t('ads_explore') || 'Tienda'}
        </button>
        <button style={styles.toggleBtn(view === 'my_shoes')} onClick={() => setView('my_shoes')}>
          {t('ads_tab_my_ads') || 'Mis Zapatillas'}
        </button>
      </div>

      {/* VISTA DE MERCADO (TIENDA) */}
      {view === 'market' && (
        <div className="fade-in">
          {SNEAKER_PLANS.map((plan) => (
            <div key={plan.id} style={styles.card(plan.color)}>
              <div style={styles.cardGlow(plan.color)}></div>
              
              <div style={styles.header}>
                <div style={styles.titleBox}>
                  <div style={styles.iconBox(plan.color)}>{plan.icon}</div>
                  <div>
                    <h3 style={styles.title}>{plan.name}</h3>
                    <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>Nivel {plan.id}</div>
                  </div>
                </div>
                <div style={styles.price(plan.color)}>{plan.price} USDT</div>
              </div>

              <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Rendimiento Diario</div>
                  <div style={styles.statValue}>2.00%</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Retorno Total</div>
                  <div style={styles.statValue}>{plan.return}</div>
                </div>
              </div>

              <button 
                onClick={() => handleBuySneaker(plan)} 
                disabled={processingId === plan.id}
                style={styles.buyBtn(plan.color, processingId === plan.id)}
              >
                {processingId === plan.id ? (
                  <span style={{ color: '#fff' }}>Procesando... ⏳</span>
                ) : (
                  `💳 Adquirir por ${plan.price} USDT`
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* VISTA DE MIS ZAPATILLAS (PRÓXIMAMENTE) */}
      {view === 'my_shoes' && (
        <div className="fade-in" style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: '1px dashed #ff1493' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎒</div>
          <h3 style={{ color: '#ff99dd', margin: '0 0 10px 0' }}>Bóveda Vacía</h3>
          <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.5' }}>
            Aún no has adquirido ningún plan de inversión.<br/>¡Ve a la tienda y compra tu primer par de zapatillas!
          </p>
        </div>
      )}
    </div>
  );
}
