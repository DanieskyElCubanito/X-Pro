import { s } from '../styles/appStyles';

export default function HistoryView({ history, loadingHistory, setView }) {
  return (
    <div className="fade-in">
      <h2 style={{textAlign:'center', marginBottom:'20px'}}>Historial de Retiros</h2>
      {loadingHistory ? (
        <p style={{textAlign:'center'}}>Cargando transacciones...</p>
      ) : history.length > 0 ? (
        <div style={{maxHeight: '300px', overflowY: 'auto'}}>
          {history.map((tx, index) => (
            <div key={index} style={{...s.card, marginBottom: '10px', fontSize: '12px'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                <span style={{color:'#28a745', fontWeight:'bold'}}>+ {tx.amount} TON</span>
                <span style={{color:'#888'}}>{new Date(tx.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{margin:0, color:'#555', wordBreak:'break-all'}}>Wallet: {tx.address}</p>
              <a href={`https://tonscan.org/tx/${tx.tx_hash}`} target="_blank" rel="noreferrer" style={{color:'#0088cc', textDecoration:'none', display:'block', marginTop:'5px'}}>Ver en Explorer 🔗</a>
            </div>
          ))}
        </div>
      ) : (
        <div style={{...s.card, textAlign:'center', color:'#555'}}><p>No tienes retiros registrados.</p></div>
      )}
      <button style={{...s.btnOutline, marginTop: '20px'}} onClick={() => setView('main')}>VOLVER</button>
    </div>
  );
}
