import React, { useState } from 'react';
import toast from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';

export default function HomeTab({ userData, setUserData, setActiveTab, t }) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [txId, setTxId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  // Dirección de depósito de la plataforma (BEP20)
  const platformWallet = "0x1234567890abcdef1234567890abcdef12345678"; 
  const supportLink = "https://t.me/TheDannyWeb3"; // <-- Tu enlace de soporte

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(platformWallet);
    toast.success('¡Dirección BEP20 copiada!');
  };

  const handleDepositSubmit = () => {
    if (txId.trim().length < 10) {
      toast.error('Por favor, ingresa un TxID válido.');
      return;
    }
    toast.success('Depósito enviado a revisión. Tu saldo se actualizará pronto.');
    setTxId('');
    setShowDeposit(false);
  };

  const handleWithdrawSubmit = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa una cantidad válida.');
      return;
    }
    if (amount > (userData?.balance || 0)) {
      toast.error('Saldo insuficiente para este retiro.');
      return;
    }
    if (withdrawAddress.trim().length < 20) {
      toast.error('Ingresa una billetera BEP20 válida.');
      return;
    }
    
    setUserData(prev => ({
      ...prev,
      balance: prev.balance - amount
    }));
    toast.success(`Retiro de ${amount} USDT solicitado con éxito.`);
    setWithdrawAmount('');
    setWithdrawAddress('');
    setShowWithdraw(false);
  };

  const openSupport = () => {
    if (WebApp.openTelegramLink) {
      WebApp.openTelegramLink(supportLink);
    } else {
      window.open(supportLink, '_blank');
    }
  };

  const styles = {
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 4px' },
    logoContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
    logoText: { color: '#fff', fontSize: '18px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' },
    supportBtn: { background: 'rgba(0, 240, 255, 0.1)', border: '1px solid #00f0ff', borderRadius: '12px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)', transition: 'transform 0.2s' },
    
    // Tarjeta Financiera Principal
    dashboardCard: { background: 'linear-gradient(145deg, rgba(20,5,40,0.95), rgba(10,2,20,0.98))', border: '2px solid #8a2be2', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(138, 43, 226, 0.25)', marginBottom: '20px' },
    glowCircle: { position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, transparent 70%)', pointerEvents: 'none' },
    balanceLabel: { color: '#ff99dd', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' },
    balanceValue: { color: '#ffffff', fontSize: '42px', fontWeight: '900', margin: 0, textShadow: '0 0 20px rgba(255, 255, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center' },
    currencyText: { fontSize: '18px', color: '#00f0ff', fontWeight: '800' },
    
    // Cuadrícula de Ingresos (Income Stats)
    incomeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '24px', borderTop: '1px solid rgba(138, 43, 226, 0.3)', paddingTop: '20px' },
    incomeBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' },
    incomeLabel: { color: '#aaa', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px', textAlign: 'center' },
    incomeValue: (color) => ({ color: color, fontSize: '12px', fontWeight: '900', textShadow: `0 0 10px ${color}50` }),

    actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' },
    actionBtn: (type) => ({ background: type === 'deposit' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 20, 147, 0.1)', border: `1px solid ${type === 'deposit' ? '#00f0ff' : '#ff1493'}`, borderRadius: '16px', padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 15px ${type === 'deposit' ? 'rgba(0,240,255,0.15)' : 'rgba(255,20,147,0.15)'}` }),
    actionText: (type) => ({ color: type === 'deposit' ? '#00f0ff' : '#ff99dd', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }),
    
    // Modal Styles
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(5, 1, 13, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '20px' },
    modalCard: (color) => ({ background: '#0a0314', border: `2px solid ${color}`, borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '360px', boxShadow: `0 0 30px ${color}40`, position: 'relative' }),
    modalClose: { position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
    modalTitle: (color) => ({ margin: '0 0 16px 0', color: color, fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }),
    inputBox: { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid #3d1b63', borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '14px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' },
    submitBtn: (color) => ({ width: '100%', background: `linear-gradient(90deg, ${color}, #8a2be2)`, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '14px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', boxShadow: `0 4px 15px ${color}50` }),
    walletBox: { background: 'rgba(0, 240, 255, 0.05)', border: '1px dashed #00f0ff', borderRadius: '12px', padding: '12px', textAlign: 'center', wordBreak: 'break-all', color: '#fff', fontSize: '13px', marginBottom: '12px' },
    networkTag: { display: 'inline-block', background: '#ffe600', color: '#000', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', marginBottom: '8px' }
  };

  return (
    <div style={{ paddingBottom: '20px' }}>
      <style>{`
        @keyframes floatingShoe {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(-5deg); filter: drop-shadow(0 0 15px #00f0ff); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>

      {/* BARRA SUPERIOR: Logo animado y Botón de Soporte SVG */}
      <div style={styles.topBar}>
        <div style={styles.logoContainer}>
          <div style={{ animation: 'floatingShoe 3s ease-in-out infinite', fontSize: '32px', filter: 'drop-shadow(0 0 8px #ff1493)' }}>
            👟
          </div>
          <div style={styles.logoText}>
            Click<span style={{ color: '#00f0ff' }}>Sneakers</span>
          </div>
        </div>

        <button onClick={openSupport} style={styles.supportBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
          </svg>
        </button>
      </div>

      {/* TARJETA DE DASHBOARD FINANCIERO */}
      <div style={styles.dashboardCard}>
        <div style={styles.glowCircle}></div>
        <div style={styles.balanceLabel}>My Balance / Mi Saldo</div>
        <h1 style={styles.balanceValue}>
          {userData?.balance?.toFixed(2) || '0.00'}
          <span style={styles.currencyText}>USDT</span>
        </h1>
        
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <div style={{ background: 'rgba(0, 240, 255, 0.1)', display: 'inline-block', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#00f0ff', fontSize: '10px', fontWeight: 'bold' }}>
            RED BEP20 (BSC)
          </div>
        </div>

        {/* ESTADÍSTICAS DE INGRESOS (Today, Yesterday, Total) */}
        <div style={styles.incomeGrid}>
          <div style={styles.incomeBox}>
            <span style={styles.incomeLabel}>Today Income</span>
            <span style={styles.incomeValue('#00ffaa')}>+ {userData?.today_income?.toFixed(2) || '14.50'}</span>
          </div>
          <div style={styles.incomeBox}>
            <span style={styles.incomeLabel}>Yesterday</span>
            <span style={styles.incomeValue('#ff99dd')}>+ {userData?.yesterday_income?.toFixed(2) || '12.00'}</span>
          </div>
          <div style={styles.incomeBox}>
            <span style={styles.incomeLabel}>Total Earned</span>
            <span style={styles.incomeValue('#ffe600')}>+ {userData?.total_earnings?.toFixed(2) || '150.00'}</span>
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN RÁPIDA */}
      <div style={styles.actionGrid}>
        <button style={styles.actionBtn('deposit')} onClick={() => setShowDeposit(true)}>
          <div style={{ fontSize: '28px' }}>⬇️</div>
          <div style={styles.actionText('deposit')}>Depositar USDT</div>
        </button>
        <button style={styles.actionBtn('withdraw')} onClick={() => setShowWithdraw(true)}>
          <div style={{ fontSize: '28px' }}>⬆️</div>
          <div style={styles.actionText('withdraw')}>Retirar Fondos</div>
        </button>
      </div>

      {/* BANNER IR A LA TIENDA */}
      <div 
        onClick={() => setActiveTab('goods')}
        style={{ background: 'linear-gradient(90deg, #ff1493, #8a2be2)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255, 20, 147, 0.3)' }}
      >
        <div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>Mercado de Zapatillas</h3>
          <p style={{ margin: '4px 0 0 0', color: '#ff99dd', fontSize: '12px' }}>Compra tu plan y gana 2% diario.</p>
        </div>
        <div style={{ fontSize: '28px', animation: 'floatingShoe 2s ease-in-out infinite' }}>👟</div>
      </div>

      {/* MODAL DE DEPÓSITO */}
      {showDeposit && (
        <div style={styles.modalOverlay} className="fade-in">
          <div style={styles.modalCard('#00f0ff')}>
            <button style={styles.modalClose} onClick={() => setShowDeposit(false)}>✕</button>
            <h3 style={styles.modalTitle('#00f0ff')}>Depositar USDT</h3>
            
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={styles.networkTag}>RED: BNB Smart Chain (BEP20)</span>
              <p style={{ margin: '0 0 12px 0', color: '#aaa', fontSize: '12px' }}>Envía únicamente USDT por la red BEP20 a esta dirección:</p>
              
              <div style={styles.walletBox}>
                {platformWallet}
              </div>
              <button 
                onClick={handleCopyWallet}
                style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid #00f0ff', borderRadius: '8px', padding: '6px 12px', color: '#00f0ff', fontSize: '11px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                📋 Copiar Dirección
              </button>
            </div>

            <p style={{ margin: '16px 0 8px 0', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>Hash de Transacción (TxID):</p>
            <input 
              type="text" 
              placeholder="Ej. 0x123abc..." 
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              style={styles.inputBox}
            />
            
            <button style={styles.submitBtn('#00f0ff')} onClick={handleDepositSubmit}>
              Confirmar Depósito
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE RETIRO */}
      {showWithdraw && (
        <div style={styles.modalOverlay} className="fade-in">
          <div style={styles.modalCard('#ff1493')}>
            <button style={styles.modalClose} onClick={() => setShowWithdraw(false)}>✕</button>
            <h3 style={styles.modalTitle('#ff1493')}>Retirar USDT</h3>
            
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ ...styles.networkTag, background: '#ff1493', color: '#fff' }}>RED: BNB Smart Chain (BEP20)</span>
              <p style={{ margin: '0 0 12px 0', color: '#aaa', fontSize: '12px' }}>Tu saldo disponible: <strong style={{ color: '#fff' }}>{userData?.balance?.toFixed(2)} USDT</strong></p>
            </div>

            <p style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>Cantidad a retirar:</p>
            <input 
              type="number" 
              placeholder="Ej. 50" 
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={styles.inputBox}
            />

            <p style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>Tu billetera (BEP20):</p>
            <input 
              type="text" 
              placeholder="0x..." 
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              style={styles.inputBox}
            />
            
            <button style={styles.submitBtn('#ff1493')} onClick={handleWithdrawSubmit}>
              Solicitar Retiro
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
