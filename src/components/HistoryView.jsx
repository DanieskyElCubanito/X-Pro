import { s } from '../styles/appStyles';

// --- ESTILOS NEÓN LOCALES PARA EL HISTORIAL ---
const neonHistory = {
  txCard: {
    background: 'linear-gradient(135deg, rgba(38, 14, 66, 0.9), rgba(18, 7, 36, 0.9))',
    border: '1.5px solid #8a2be2',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 4px 15px rgba(138, 43, 226, 0.15)'
  },
  amountText: {
    color: '#00ffaa',
    fontWeight: '900',
    fontSize: '16px',
    textShadow: '0 0 10px rgba(0, 255, 170, 0.4)'
  },
  dateText: {
    color: '#ff99dd',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  walletText: {
    color: '#aaa',
    fontSize: '12px',
    wordBreak: 'break-all',
    margin: '8px 0',
    fontFamily: 'monospace',
    background: 'rgba(0,0,0,0.3)',
    padding: '6px',
    borderRadius: '8px',
    border: '1px dashed #555'
  },
  linkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(0, 240, 255, 0.1)',
    border: '1px solid #00f0ff',
    color: '#00f0ff',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '900',
    textDecoration: 'none',
    textTransform: 'uppercase',
    marginTop: '4px'
  }
};

export default function HistoryView({ history, loadingHistory, setView }) {
  return (
    <div className="fade-in" style={{ paddingBottom: '20px' }}>
      
      {/* CABECERA */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '42px', marginBottom: '8px', filter: 'drop-shadow(0 0 15px rgba(138, 43, 226, 0.5))' }}>
          📜
        </div>
        <h2 style={{ margin: '0 0 6px 0', color: '#00f0ff', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase' }}>
          Historial de Retiros
        </h2>
        <p style={{ margin: 0, color: '#ff99dd', fontSize: '13px', fontWeight: 'bold' }}>
          Registro de tus envíos a la Blockchain
        </p>
      </div>

      {loadingHistory ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#00f0ff', fontSize: '14px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
            Sincronizando transacciones...
          </p>
        </div>
      ) : history.length > 0 ? (
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
          {history.map((tx, index) => (
            <div key={index} style={neonHistory.txCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={neonHistory.amountText}>+ {tx.amount} TON</span>
                <span style={neonHistory.dateText}>{new Date(tx.created_at).toLocaleDateString()}</span>
              </div>
              
              <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>Wallet de destino:</div>
              <p style={neonHistory.walletText}>{tx.address}</p>
              
              <a 
                href={`https://tonscan.org/tx/${tx.tx_hash}`} 
                target="_blank" 
                rel="noreferrer" 
                style={neonHistory.linkBtn}
              >
                Ver en Explorer ↗
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...s.card, textAlign: 'center', padding: '30px 20px', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <span style={{ fontSize: '30px', display: 'block', marginBottom: '10px' }}>📭</span>
          <p style={{ color: '#ff99dd', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.5', margin: 0 }}>
            Aún no tienes retiros registrados.<br/>Sigue acumulando para tu primer pago.
          </p>
        </div>
      )}

      {/* BOTÓN VOLVER */}
      <button 
        style={{ ...s.btnOutline, marginTop: '24px' }} 
        onClick={() => setView('main')}
      >
        ◀ VOLVER AL INICIO
      </button>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; text-shadow: 0 0 10px #00f0ff; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
