import { useState } from 'react';
import toast from 'react-hot-toast';
import { botApi } from '../api/botApi';

// --- ESTILOS NEÓN CYBERPUNK (Aplicados a la estructura Neobrutalista) ---
const neon = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },
  
  // 1. Header (Reemplaza a .neo-header)
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  iconBtn: {
    width: '46px',
    height: '46px',
    background: 'rgba(15, 5, 28, 0.8)',
    border: '2px solid #8a2be2',
    borderRadius: '14px',
    boxShadow: '0 0 10px rgba(138, 43, 226, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#ffffff'
  },
  iconBtnBlue: {
    width: '46px',
    height: '46px',
    background: 'linear-gradient(135deg, #00f0ff, #0088ff)',
    border: 'none',
    borderRadius: '14px',
    boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '900',
    cursor: 'pointer',
    color: '#050214'
  },
  title: {
    fontSize: '28px',
    fontWeight: '900',
    letterSpacing: '-0.5px',
    textTransform: 'uppercase',
    color: '#00f0ff',
    margin: 0,
    textShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
  },

  // 2. Stats Cards (Reemplaza a .stats-grid-neo y .stat-card-neo)
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '20px'
  },
  statCard: (borderColor, bgColor, glowColor) => ({
    background: bgColor,
    border: `2px solid ${borderColor}`,
    borderRadius: '20px',
    boxShadow: `0 4px 15px ${glowColor}`,
    padding: '16px 6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  }),
  statInnerIcon: {
    width: '36px',
    height: '36px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    marginBottom: '8px'
  },
  statNumber: {
    fontSize: '22px',
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '4px',
    color: '#ffffff'
  },
  statDesc: {
    fontSize: '9px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    lineHeight: '1.2',
    color: '#ff99dd'
  },
  btnMiniAdd: {
    marginTop: '8px',
    background: 'linear-gradient(90deg, #ff1493, #8a2be2)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '999px',
    padding: '4px 12px',
    fontSize: '10px',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(255, 20, 147, 0.4)'
  },

  // 3. Info Box "CÓMO FUNCIONA" (Reemplaza a .how-it-works-card)
  infoCard: {
    background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.6), rgba(20, 8, 38, 0.8))',
    border: '2px solid #8a2be2',
    borderRadius: '26px',
    boxShadow: '0 8px 24px rgba(138, 43, 226, 0.2)',
    padding: '20px 18px',
    marginBottom: '20px'
  },
  howTitle: {
    fontSize: '14px',
    fontWeight: '900',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#ffe600',
    marginBottom: '16px'
  },
  howStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px 0'
  },
  howStepIcon: (bgColor, textColor, glowColor) => ({
    width: '44px',
    height: '44px',
    background: bgColor,
    color: textColor,
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '900',
    flexShrink: 0,
    boxShadow: `0 0 15px ${glowColor}`
  }),
  howStepText: {
    fontSize: '14px',
    fontWeight: '800',
    lineHeight: '1.3',
    color: '#ffffff'
  },
  dashedDivider: {
    border: 'none',
    borderTop: '2px dashed rgba(255, 65, 180, 0.4)',
    margin: '6px 0'
  },

  // 4. Botón Grande (Reemplaza a .btn-neo-main)
  btnMain: {
    width: '100%',
    background: 'linear-gradient(180deg, #00f0ff 0%, #0099ff 100%)',
    color: '#050214',
    border: 'none',
    borderRadius: '20px',
    boxShadow: '0 6px 0 #0066aa, 0 10px 20px rgba(0, 240, 255, 0.4)',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    marginTop: '15px'
  }
};

export default function HomeTab({ userData, setUserData }) {
  const [isClaiming, setIsClaiming] = useState(false);

  // Formateamos las estadísticas usando "CLICK"
  const clickBalance = Number(userData?.balance || 0).toFixed(2);
  const clicksReceived = Number(userData?.total_earnings || 0).toFixed(2);
  
  // Simulamos clicks globales como en el ejemplo
  const globalClicks = '232.1K';

  // Función para el botón del Header "+" o reclamar energía
  const handleClaimBonus = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    const tid = toast.loading("Recolectando CLICK...");

    try {
      const res = await botApi.claimBonus(userData?.id);
      if (res.success) {
        toast.success("¡+0.10 CLICK obtenidos!", { id: tid });
        if (res.balance !== undefined) {
          setUserData(prev => ({ 
            ...prev, 
            balance: res.balance,
            total_earnings: Number(prev.total_earnings || 0) + 0.1 
          }));
        }
      } else {
        toast.error(res.error || "Vuelve más tarde.", { id: tid });
      }
    } catch (e) {
      toast.error("Error de conexión.", { id: tid });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fade-in" style={neon.container}>
      
      {/* HEADER */}
      <div style={neon.header}>
        <div 
          onClick={() => toast('Historial en construcción', {icon: '🕒'})} 
          style={neon.iconBtn}
        >
          🕒
        </div>
        <h1 style={neon.title}>INICIO</h1>
        <div 
          onClick={handleClaimBonus} 
          style={neon.iconBtnBlue}
        >
          +
        </div>
      </div>

      {/* TRES TARJETAS DE MÉTRICAS */}
      <div style={neon.statsGrid}>
        {/* Global (Morado/Neón) */}
        <div style={neon.statCard('#8a2be2', 'rgba(138, 43, 226, 0.2)', 'rgba(138, 43, 226, 0.3)')}>
          <div style={neon.statInnerIcon}>🌐</div>
          <div style={neon.statNumber}>{globalClicks}</div>
          <div style={{...neon.statDesc, color: '#ff99dd'}}>Global</div>
        </div>

        {/* Saldo de Clicks (Amarillo/Cian) */}
        <div style={neon.statCard('#00f0ff', 'rgba(0, 240, 255, 0.1)', 'rgba(0, 240, 255, 0.3)')}>
          <div style={neon.statInnerIcon}>⚡</div>
          <div style={{...neon.statNumber, color: '#00f0ff'}}>{clickBalance}</div>
          <div style={{...neon.statDesc, color: '#ffffff'}}>Saldo</div>
          <button style={neon.btnMiniAdd} onClick={handleClaimBonus}>
            RECLAMAR
          </button>
        </div>

        {/* Clicks Recibidos (Magenta/Rosa) */}
        <div style={neon.statCard('#ff1493', 'rgba(255, 20, 147, 0.2)', 'rgba(255, 20, 147, 0.3)')}>
          <div style={neon.statInnerIcon}>📥</div>
          <div style={neon.statNumber}>{clicksReceived}</div>
          <div style={{...neon.statDesc, color: '#ff99dd'}}>Recibidos</div>
        </div>
      </div>

      {/* SECCIÓN "CÓMO FUNCIONA" */}
      <div style={neon.infoCard}>
        <div style={neon.howTitle}>CÓMO FUNCIONA</div>

        {/* Paso 1 */}
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#00f0ff', '#050214', 'rgba(0, 240, 255, 0.4)')}>+</div>
          <div style={neon.howStepText}>Añade una campaña de tráfico</div>
        </div>

        <hr style={neon.dashedDivider} />

        {/* Paso 2 */}
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#ffe600', '#050214', 'rgba(255, 230, 0, 0.4)')}>⚡</div>
          <div style={neon.howStepText}>Completa tareas y gana CLICK</div>
        </div>

        <hr style={neon.dashedDivider} />

        {/* Paso 3 */}
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#ff1493', '#ffffff', 'rgba(255, 20, 147, 0.4)')}>🚀</div>
          <div style={neon.howStepText}>Tu tarea sale en el feed público</div>
        </div>

        {/* Botón Principal */}
        <button 
          onClick={() => toast('Ve a la pestaña de "Publicar" para crear una campaña', {icon: '🚀'})} 
          style={neon.btnMain}
        >
          + CREA TU PRIMERA TAREA
        </button>
      </div>

    </div>
  );
}
