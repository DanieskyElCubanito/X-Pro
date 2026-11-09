import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function HomeTab({ userData, setUserData, setActiveTab, t }) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [txId, setTxId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  // Dirección de depósito de la plataforma (BEP20)
  const platformWallet = "0x1234567890abcdef1234567890abcdef12345678"; 

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
    
    // Simulamos la deducción del saldo
    setUserData(prev => ({
      ...prev,
      balance: prev.balance - amount
    }));
    toast.success(`Retiro de ${amount} USDT solicitado con éxito.`);
    setWithdrawAmount('');
    setWithdrawAddress('');
    setShowWithdraw(false);
  };

  const styles = {
    balanceCard: { background: 'linear-gradient(145deg, rgba(20,5,40,0.9), rgba(10,2,20,0.95))', border: '2px solid #00f0ff', borderRadius: '24px', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0, 240, 255, 0.2)', marginBottom: '20px' },
    glowCircle: { position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)', pointerEvents: 'none' },
    balanceLabel: { color: '#00f0ff', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' },
    balanceValue: { color: '#ffffff', fontSize: '38px', fontWeight: '900', margin: 0, textShadow: '0 0 20px rgba(0, 240, 255, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    currencyText: { fontSize: '18px', color: '#00f0ff', fontWeight: '800' },
    actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' },
    actionBtn: (type) => ({ background: type === 'deposit' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 20, 147, 0.1)', border: `1px solid ${type === 'deposit' ? '#00f0ff' : '#ff1493'}`, borderRadius: '16px', padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 15px ${type === 'deposit' ? 'rgba(0,240,255,0.15)' : 'rgba(255,20,147,0.15)'}` }),
    actionIcon: { fontSize: '24px' },
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
      
      {/* TARJETA DE SALDO */}
      <div style={styles.balanceCard}>
        <div style={styles.glowCircle}></div>
        <div style={styles.balanceLabel}>{t('home_balance') || 'Saldo Disponible'}</div>
        <h1 style={styles.balanceValue}>
          {userData?.balance?.toFixed(2) || '0.00'}
          <span style={styles.currencyText}>USDT</span>
        </h1>
        <div style={{ marginTop: '12px', background: 'rgba(0, 240, 255, 0.1)', display: 'inline-block', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#00f0ff', fontSize: '11px', fontWeight: 'bold' }}>
          Red BEP20 (BSC)
        </div>
      </div>

      {/* BOTONES DE ACCIÓN RÁPIDA */}
      <div style={styles.actionGrid}>
        <button style={styles.actionBtn('deposit')} onClick={() => setShowDeposit(true)}>
          <div style={styles.actionIcon}>⬇️</div>
          <div style={styles.actionText('deposit')}>{t('home_earn') || 'Depositar'}</div>
        </button>
        <button style={styles.actionBtn('withdraw')} onClick={() => setShowWithdraw(true)}>
          <div style={styles.actionIcon}>⬆️</div>
          <div style={styles.actionText('withdraw')}>{t('home_create') || 'Retirar'}</div>
        </button>
      </div>

      {/* SECCIÓN "IR A LA TIENDA" */}
      <div 
        onClick={() => setActiveTab('goods')}
        style={{ background: 'linear-gradient(90deg, #ff1493, #8a2be2)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255, 20, 147, 0.3)' }}
      >
        <div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>Explorar Zapatillas</h3>
          <p style={{ margin: '4px 0 0 0', color: '#ff99dd', fontSize: '12px' }}>Gana hasta un 2% diario con nuestros planes.</p>
        </div>
        <div style={{ fontSize: '24px' }}>👟</div>
      </div>

      {/* MODAL DE DEPÓSITO */}
      {showDeposit && (
        <div style={styles.modalOverlay} className="fade-in">
          <div style={styles.modalCard('#00f0ff')}>
            <button style={styles.modalClose} onClick={() => setShowDeposit(false)}>✕</button>
            <h3 style={styles.modalTitle('#00f0ff')}>{t('deposit_title') || 'Depositar USDT'}</h3>
            
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

            <p style={{ margin: '16px 0 8px 0', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>{t('deposit_txid') || 'Hash de Transacción (TxID)'}:</p>
            <input 
              type="text" 
              placeholder="Ej. 0x123abc..." 
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              style={styles.inputBox}
            />
            
            <button style={styles.submitBtn('#00f0ff')} onClick={handleDepositSubmit}>
              {t('deposit_submit') || 'Confirmar Depósito'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE RETIRO */}
      {showWithdraw && (
        <div style={styles.modalOverlay} className="fade-in">
          <div style={styles.modalCard('#ff1493')}>
            <button style={styles.modalClose} onClick={() => setShowWithdraw(false)}>✕</button>
            <h3 style={styles.modalTitle('#ff1493')}>{t('withdraw_title') || 'Retirar USDT'}</h3>
            
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ ...styles.networkTag, background: '#ff1493', color: '#fff' }}>RED: BNB Smart Chain (BEP20)</span>
              <p style={{ margin: '0 0 12px 0', color: '#aaa', fontSize: '12px' }}>Tu saldo disponible: <strong style={{ color: '#fff' }}>{userData?.balance?.toFixed(2)} USDT</strong></p>
            </div>

            <p style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>{t('withdraw_amount') || 'Cantidad a retirar'}:</p>
            <input 
              type="number" 
              placeholder="Ej. 50" 
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={styles.inputBox}
            />

            <p style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>{t('withdraw_address') || 'Tu billetera (BEP20)'}:</p>
            <input 
              type="text" 
              placeholder="0x..." 
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              style={styles.inputBox}
            />
            
            <button style={styles.submitBtn('#ff1493')} onClick={handleWithdrawSubmit}>
              {t('withdraw_submit') || 'Solicitar Retiro'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
