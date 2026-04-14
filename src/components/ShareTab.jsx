import { s } from '../styles/appStyles';

function ShareTab({ stats, handleShare }) {
  // Calculamos el total de forma segura
  const totalEarned = (
    parseFloat(stats?.c1 || 0) + 
    parseFloat(stats?.c2 || 0) + 
    parseFloat(stats?.c3 || 0)
  ).toFixed(4);

  return (
    <div className="tab-content fade-in">
      {/* Sección: Información del Sistema */}
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <span style={{ fontSize: '20px' }}>💎</span>
          <h4 style={{ margin: 0, color: '#0088cc', fontSize: '14px', letterSpacing: '1px' }}>SISTEMA DE AFILIADOS</h4>
        </div>
        
        <div style={s.row}>
          <div style={s.box}>NIVEL 1<br /><b style={{ color: '#fff', fontSize: '12px' }}>0.003</b></div>
          <div style={s.box}>NIVEL 2<br /><b style={{ color: '#fff', fontSize: '12px' }}>0.002</b></div>
          <div style={s.box}>NIVEL 3<br /><b style={{ color: '#fff', fontSize: '12px' }}>0.001</b></div>
        </div>
        
        <button style={s.btnGreen} onClick={handleShare}>
          🚀 INVITAR AMIGOS
        </button>
      </div>

      {/* Sección: Estadísticas de la Red */}
      <div style={{ ...s.card, border: '1px solid #222' }}>
        <h4 style={{ color: '#666', textAlign: 'left', fontSize: '11px', marginBottom: '15px', fontWeight: 'bold' }}>
          📊 TU RED DE TRABAJO
        </h4>
        
        <div style={s.statsGrid}>
          {/* Columna Nivel 1 */}
          <div style={s.statCol}>
            <p style={s.statLabel}>Directos</p>
            <p style={s.statValue}>{stats.n1}</p>
            <p style={s.statCom}>+{stats.c1} TON</p>
          </div>
          
          {/* Columna Nivel 2 */}
          <div style={{...s.statCol, border: '1px solid #333'}}>
            <p style={s.statLabel}>Nivel 2</p>
            <p style={s.statValue}>{stats.n2}</p>
            <p style={s.statCom}>+{stats.c2} TON</p>
          </div>
          
          {/* Columna Nivel 3 */}
          <div style={s.statCol}>
            <p style={s.statLabel}>Nivel 3</p>
            <p style={s.statValue}>{stats.n3}</p>
            <p style={s.statCom}>+{stats.c3} TON</p>
          </div>
        </div>

        {/* Tarjeta de Total Ganado Resaltada */}
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
        Las comisiones se acreditan instantáneamente cuando tus amigos se registran.
      </p>
    </div>
  );
}

export default ShareTab;
