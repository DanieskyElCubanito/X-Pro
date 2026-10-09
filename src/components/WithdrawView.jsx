import { s } from '../styles/appStyles';

export default function WithdrawView({ withdrawAddress, setWithdrawAddress, withdrawAmount, setWithdrawAmount, isWithdrawing, handleWithdraw, setView }) {
  return (
    <div className="fade-in">
      
      {/* CABECERA DE RETIRO */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px', filter: 'drop-shadow(0 0 15px rgba(0, 240, 255, 0.4))' }}>
          💎
        </div>
        <h2 style={{ margin: '0 0 8px 0', color: '#00f0ff', fontSize: '24px', fontWeight: '900', textTransform: 'uppercase' }}>
          Retirar Fondos
        </h2>
        <p style={{ color: '#ff99dd', fontSize: '14px', margin: 0, fontWeight: 'bold' }}>
          Transfiere tus ganancias a tu Wallet
        </p>
      </div>

      {/* AVISO DE SEGURIDAD */}
      <div style={s.helpText}>
        <span style={{ fontSize: '14px', display: 'block', marginBottom: '6px', color: '#ffe600' }}>
          ⚠️ <strong>ATENCIÓN</strong>
        </span>
        Asegúrate de usar una dirección válida de la red <strong>TON / GRAM</strong> (Ej: Tonkeeper o Wallet de Telegram). Mínimo de retiro: <strong>0.25</strong>.
      </div>

      {/* FORMULARIO DE RETIRO EN TARJETA */}
      <div style={s.card}>
        <label style={{ display: 'block', color: '#ff99dd', fontSize: '12px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Dirección de tu Wallet
        </label>
        <input 
          style={s.input} 
          placeholder="Ej: UQDL... o tunombre.ton" 
          value={withdrawAddress} 
          onChange={(e) => setWithdrawAddress(e.target.value)} 
          disabled={isWithdrawing} 
        />

        <label style={{ display: 'block', color: '#ff99dd', fontSize: '12px', fontWeight: '900', marginBottom: '8px', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Monto a retirar
        </label>
        <div style={{ position: 'relative' }}>
          <input 
            style={{ ...s.input, paddingRight: '65px', marginBottom: 0 }} 
            type="number" 
            placeholder="0.00" 
            value={withdrawAmount} 
            onChange={(e) => setWithdrawAmount(e.target.value)} 
            disabled={isWithdrawing} 
            min="0.25" 
            step="0.01"
          />
          <span style={{ position: 'absolute', right: '16px', top: '14px', color: '#00f0ff', fontWeight: '900', fontSize: '14px' }}>
            CRYPTO
          </span>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div style={{ marginTop: '20px' }}>
        <button 
          style={{ ...s.btnGreen, opacity: isWithdrawing ? 0.6 : 1, marginBottom: '12px' }} 
          onClick={handleWithdraw} 
          disabled={isWithdrawing}
        >
          {isWithdrawing ? "PROCESANDO TRANSACCIÓN..." : "⚡ SOLICITAR RETIRO"}
        </button>
        
        <button 
          style={s.btnOutline} 
          onClick={() => setView('main')} 
          disabled={isWithdrawing}
        >
          ◀ VOLVER AL INICIO
        </button>
      </div>

    </div>
  );
}
