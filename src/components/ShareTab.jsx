import { s } from '../styles/appStyles';
import toast from 'react-hot-toast';

function ShareTab({ stats, handleShare, userId, totalReferralEarnings }) {
  // Aseguramos que los valores sean números
  const n1 = stats?.n1 || 0;
  const n2 = stats?.n2 || 0;
  const n3 = stats?.n3 || 0;

  const c1 = parseFloat(stats?.c1 || 0);
  const c2 = parseFloat(stats?.c2 || 0);
  const c3 = parseFloat(stats?.c3 || 0);

  // Total acumulado
  const totalEarned = totalReferralEarnings !== undefined 
    ? parseFloat(totalReferralEarnings).toFixed(4) 
    : (c1 + c2 + c3).toFixed(4);

  // Función para copiar el enlace
  const handleCopy = () => {
    if (!userId) {
      toast.error("Error: ID de usuario no encontrado.");
      return;
    }
    const link = `https://t.me/Xokpro_Bot/app?startapp=${userId}`;
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

        {/* Muestra de Porcentajes por Nivel */}
        <div style={s.row}>
          <div style={s.box}>NIVEL 1<br /><b style={{ color: '#26A17B', fontSize: '13px' }}>10%</b></div>
          <div style={s.box}>NIVEL 2<br /><b style={{ color: '#26A17B', fontSize: '13px' }}>6%</b></div>
          <div style={s.box}>NIVEL 3<br /><b style={{ color: '#26A17B', fontSize: '13px' }}>4%</b></div>
        </div>

        {/* ESTRUCTURA DE BOTONES */}
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
          <div style={s.statCol}>
            <p style={s.statLabel}>Directos (10%)</p>
            <p style={s.statValue}>{n1}</p>
            <p style={s.statCom}>+${c1.toFixed(4)}</p>
          </div>

          <div style={s.statCol}>
            <p style={s.statLabel}>Nivel 2 (6%)</p>
            <p style={s.statValue}>{n2}</p>
            <p style={s.statCom}>+${c2.toFixed(4)}</p>
          </div>

          <div style={s.statCol}>
            <p style={s.statLabel}>Nivel 3 (4%)</p>
            <p style={s.statValue}>{n3}</p>
            <p style={s.statCom}>+${c3.toFixed(4)}</p>
          </div>
        </div>

        <div style={s.totalCard}>
          <div>
            <p style={{ fontSize: '10px', color: '#888', margin: 0 }}>GANANCIAS TOTALES</p>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#26A17B', margin: 0 }}>
              ${totalEarned} <span style={{ fontSize: '12px' }}>USDT</span>
            </p>
          </div>
          <div style={{ backgroundColor: '#26A17B22', padding: '8px', borderRadius: '12px' }}>
            💵
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '10px' }}>
        Las comisiones se acreditan automáticamente al completar Misiones Premium.
      </p>
    </div>
  );
}

export default ShareTab;