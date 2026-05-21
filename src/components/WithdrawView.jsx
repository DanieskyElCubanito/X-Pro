import { s } from '../styles/appStyles';

export default function WithdrawView({ withdrawAddress, setWithdrawAddress, withdrawAmount, setWithdrawAmount, isWithdrawing, handleWithdraw, setView }) {
  return (
    <div className="fade-in">
      <h2 style={{textAlign:'center', marginBottom:'20px'}}>Retirar Balance</h2>
      <p style={s.helpText}>Mínimo de retiro: 0.25 TON. Usa red TON nativa.</p>
      <input style={s.input} placeholder="Dirección de Wallet TON" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} disabled={isWithdrawing} />
      <input style={s.input} type="number" placeholder="Monto" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} disabled={isWithdrawing} min="0.25" />
      <button style={{...s.btnGreen, opacity: isWithdrawing ? 0.6 : 1}} onClick={handleWithdraw} disabled={isWithdrawing}>
        {isWithdrawing ? "PROCESANDO PAGO..." : "ENVIAR SOLICITUD"}
      </button>
      <button style={s.btnOutline} onClick={() => setView('main')} disabled={isWithdrawing}>VOLVER AL INICIO</button>
    </div>
  );
}
