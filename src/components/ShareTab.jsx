import { s } from '../styles/appStyles';
import toast from 'react-hot-toast';

function ShareTab({ stats, handleShare, userId, totalReferralEarnings }) {
  const n1 = stats?.n1 || 0;
  const c1 = parseFloat(stats?.c1 || 0);

  // Total acumulado (solo nivel 1)
  const totalEarned = totalReferralEarnings !== undefined 
    ? parseFloat(totalReferralEarnings).toFixed(4) 
    : c1.toFixed(4);

  const handleCopy = () => {
    if (!userId) {
      toast.error("Error: ID de usuario no encontrado.");
      return;
    }
    const link = `https://t.me/Referidos_Gratis_bot/app?startapp=${userId}`;
    navigator.clipboard.writeText(link)
      .then(() => toast.success("¡Enlace copiado al portapapeles!"))
      .catch(() => toast.error("Error al copiar el enlace"));
  };

  return (
    <div className="tab-content fade-in" style={{ paddingBottom: '130px' }}>
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <span style={{ fontSize: '20px' }}>💎</span>
          <h4 style={{ margin: 0, color: '#0088cc', fontSize: '14px', letterSpacing: '1px' }}>
            SISTEMA DE AFILIADOS
          </h4>
        </div>

        <div style={s.row}>
          <div style={{...s.box, width: '100%'}}>
            TUS REFERIDOS DIRECTOS<br />
            <b style={{ color: '#26A17B', fontSize: '16px' }}>{n1} Usuarios</b>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            style={{ ...s.btnGreen, flex: 1, padding: '12px 0', fontSize: '13px', backgroundColor: '#0088cc' }} 
            onClick={handleShare}
          >
            🚀 INVITAR
          </button>

          <button 
            style={{ 
              ...s.btnGreen, 
              flex: 1, 
              padding: '12px 0', 
              fontSize: '13px', 
              backgroundColor: '#1a3a5a',
              border: '1px solid #0088cc'
            }} 
            onClick={handleCopy}
          >
            📋 COPIAR
          </button>
        </div>
      </div>

      <div style={{ ...s.card, border: '1px solid #1f1f1f' }}>
        <h4 style={{ color: '#888', textAlign: 'left', fontSize: '11px', marginBottom: '15px', fontWeight: 'bold' }}>
          📊 TU RED DE TRABAJO
        </h4>

        <div style={s.statsGrid}>
          <div style={{...s.statCol, flex: '1'}}>
            <p style={s.statLabel}>Directos (Nivel 1)</p>
            <p style={s.statValue}>{n1}</p>
            <p style={s.statCom}>+${c1.toFixed(4)}</p>
          </div>
        </div>

        <div style={s.totalCard}>
          <div>
            <p style={{ fontSize: '10px', color: '#888', margin: 0 }}>GANANCIAS TOTALES</p>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#26A17B', margin: 0 }}>
              ${totalEarned} <span style={{ fontSize: '12px' }}>PT</span>
            </p>
          </div>
          <div style={{ backgroundColor: '#26A17B22', padding: '8px', borderRadius: '12px' }}>
            💵
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '10px' }}>
        Ganas recompensas directamente por los usuarios que invites con tu enlace.
      </p>
    </div>
  );
}

export default ShareTab;