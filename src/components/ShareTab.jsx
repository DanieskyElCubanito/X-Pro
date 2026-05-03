import { s } from '../styles/appStyles';

function ShareTab({ stats, handleShare }) {
  // Aseguramos que los valores sean números antes de sumar
  const n1 = stats?.n1 || 0;
  const n2 = stats?.n2 || 0;
  const n3 = stats?.n3 || 0;
  
  const c1 = parseFloat(stats?.c1 || 0);
  const c2 = parseFloat(stats?.c2 || 0);
  const c3 = parseFloat(stats?.c3 || 0);

  const totalEarned = (c1 + c2 + c3).toFixed(4);

  return (
    <div className="tab-content fade-in">
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <span style={{ fontSize: '20px' }}>💎</span>
          <h4 style={{ margin: 0, color: '#0088cc', fontSize: '14px', letterSpacing: '1px' }}>SISTEMA DE AFILIADOS</h4>
        </div>

        <div style={s.row}>
          <div style={s.box}>NIVEL 1<br /><b style={{ color: '#fff', fontSize: '12px' }}>0.005</b></div>
          <div style={s.box}>NIVEL 2<br /><b style={{ color: '#fff', fontSize: '12px' }}>0.003</b></div>
          <div style={s.box}>NIVEL 3<br /><b style={{ color: '#fff', fontSize: '12px' }}>0.002</b></div>
        </div>

        <button style={s.btnGreen} onClick={handleShare}>
          🚀 INVITAR AMIGOS
        </button>
      </div>

      <div style={{ ...s.card, border: '1px solid #1f1f1f' }}>
        <h4 style={{ color: '#666', textAlign: 'left', fontSize: '11px', marginBottom: '15px', fontWeight: 'bold' }}>
          📊 TU RED DE TRABAJO
        </h4>

        <div style={s.statsGrid}>
          <div style={s.statCol}>
            <p style={s.statLabel}>Directos</p>
            <p style={s.statValue}>{n1}</p>
            <p style={s.statCom}>+{c1.toFixed(4)}</p>
          </div>

          <div style={s.statCol}>
            <p style={s.statLabel}>Nivel 2</p>
            <p style={s.statValue}>{n2}</p>
            <p style={s.statCom}>+{c2.toFixed(4)}</p>
          </div>

          <div style={s.statCol}>
            <p style={s.statLabel}>Nivel 3</p>
            <p style={s.statValue}>{n3}</p>
            <p style={s.statCom}>+{c3.toFixed(4)}</p>
          </div>
        </div>

        <div style={s.totalCard}>
          <div>
            <p style={{ fontSize: '10px', color: '#888', margin: 0 }}>GANANCIAS TOTALES</p>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#28a745', margin: 0 }}>
              {totalEarned} <span style={{fontSize: '12px'}}>TON</span>
            </p>
          </div>
          <div style={{ backgroundColor: '#28a74522', padding: '8px', borderRadius: '12px' }}>
            💰
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '10px', color: '#444', marginTop: '10px' }}>
        Las comisiones se basan en la actividad de tu red.
      </p>
    </div>
  );
}

export default ShareTab;