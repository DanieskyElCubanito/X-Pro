import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import { s } from '../styles/appStyles';
import { botApi } from '../api/botApi';

const DEFAULT_WALLETS = {
  BEP20: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  TON: 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ'
};

const formatShortAddress = (addr = '') => {
  if (!addr || addr.length <= 12) return addr;
  return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
};

export default function PortfolioView({ userData, initialSection = 'deposit', onUpdate }) {
  const [activeSection, setActiveSection] = useState(initialSection || 'deposit');
  const [selectedNetwork, setSelectedNetwork] = useState('BEP20'); // 'BEP20' | 'TON'
  const [withdrawNetwork, setWithdrawNetwork] = useState('BEP20');
  const [amount, setAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSection === 'deposit' || initialSection === 'withdraw') {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const balance = Number(userData?.balance ?? 45.8);
  const numericAmount = parseFloat(amount) || 0;

  const currentDepositAddress =
    selectedNetwork === 'BEP20'
      ? userData?.deposit_bep20 || DEFAULT_WALLETS.BEP20
      : userData?.deposit_ton || DEFAULT_WALLETS.TON;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=${encodeURIComponent(
    currentDepositAddress
  )}`;

  const safeHaptic = (style = 'light') => {
    try {
      if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred(style);
    } catch (e) {}
  };

  const handleCopyAddress = () => {
    safeHaptic('light');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentDepositAddress);
    }
    toast.success(`Dirección ${selectedNetwork === 'BEP20' ? 'USDT (BEP20)' : 'GRAM / TON'} copiada`, {
      style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
    });
  };

  const handlePasteAddress = async () => {
    safeHaptic('light');
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setWithdrawAddress(text.trim());
          toast.success('Dirección pegada', {
            style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
          });
          return;
        }
      }
    } catch (e) {}

    // Fallback si el navegador bloquea readText en el WebView de Telegram
    toast('Toca el campo y pega tu dirección manualmente', {
      style: { background: '#111C2E', color: '#CBD5E1', border: '1px solid #243247' }
    });
  };

  const handleMaxAmount = () => {
    safeHaptic('light');
    if (balance <= 0) {
      return toast.error('No tienes saldo disponible para retirar', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    }
    setAmount(balance.toFixed(2));
  };

  const handleConfirmWithdraw = async (e) => {
    e.preventDefault();
    if (numericAmount < 1) {
      safeHaptic('heavy');
      return toast.error('El monto mínimo de retiro es $1 USD', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    }
    if (numericAmount > balance) {
      safeHaptic('heavy');
      return toast.error('Saldo disponible insuficiente', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    }
    if (!withdrawAddress.trim()) {
      safeHaptic('heavy');
      return toast.error('Ingresa tu dirección de billetera para retirar', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    }

    setLoading(true);
    safeHaptic('medium');

    try {
      const payload = {
        user_id: userData?.id,
        amount: numericAmount,
        network: withdrawNetwork,
        address: withdrawAddress.trim()
      };

      if (botApi?.requestWithdraw) {
        await botApi.requestWithdraw(payload);
      }

      toast.success('Retiro confirmado y enviado a procesamiento', {
        style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
      });
      setAmount('');
      setWithdrawAddress('');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Error al procesar el retiro.', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '16px' }}>
      {/* Título principal + switch rápido */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#F8FAFC' }}>
          {activeSection === 'deposit' ? 'Depositar' : 'Retirar'}
        </h2>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => {
              safeHaptic('light');
              setActiveSection('deposit');
            }}
            style={{
              backgroundColor: activeSection === 'deposit' ? '#111C2E' : 'transparent',
              color: activeSection === 'deposit' ? '#22D3EE' : '#94A3B8',
              border: activeSection === 'deposit' ? '1px solid #22D3EE' : '1px solid #1E293B',
              borderRadius: '999px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Depositar
          </button>
          <button
            type="button"
            onClick={() => {
              safeHaptic('light');
              setActiveSection('withdraw');
            }}
            style={{
              backgroundColor: activeSection === 'withdraw' ? '#111C2E' : 'transparent',
              color: activeSection === 'withdraw' ? '#22D3EE' : '#94A3B8',
              border: activeSection === 'withdraw' ? '1px solid #22D3EE' : '1px solid #1E293B',
              borderRadius: '999px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Retirar
          </button>
        </div>
      </div>

      {/* VISTA DEPOSITAR */}
      {activeSection === 'deposit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                safeHaptic('light');
                setSelectedNetwork('BEP20');
              }}
              style={{
                background:
                  selectedNetwork === 'BEP20'
                    ? 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)'
                    : '#0F172A',
                color: selectedNetwork === 'BEP20' ? '#06101C' : '#CBD5E1',
                border: selectedNetwork === 'BEP20' ? 'none' : '1px solid #1E293B',
                borderRadius: '999px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: selectedNetwork === 'BEP20' ? '0 0 16px rgba(34, 211, 238, 0.35)' : 'none'
              }}
            >
              USDT (BEP20)
            </button>

            <button
              type="button"
              onClick={() => {
                safeHaptic('light');
                setSelectedNetwork('TON');
              }}
              style={{
                background:
                  selectedNetwork === 'TON'
                    ? 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)'
                    : '#0F172A',
                color: selectedNetwork === 'TON' ? '#06101C' : '#CBD5E1',
                border: selectedNetwork === 'TON' ? 'none' : '1px solid #1E293B',
                borderRadius: '999px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: selectedNetwork === 'TON' ? '0 0 16px rgba(34, 211, 238, 0.35)' : 'none'
              }}
            >
              GRAM/TON
            </button>
          </div>

          <div
            style={{
              background: 'linear-gradient(180deg, #102033 0%, #0B1322 100%)',
              border: '1px solid #1E324A',
              borderRadius: '20px',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)'
              }}
            >
              <img
                src={qrUrl}
                alt={`QR ${selectedNetwork}`}
                style={{ width: '176px', height: '176px', display: 'block', borderRadius: '8px' }}
              />
            </div>

            <div
              style={{
                width: '100%',
                backgroundColor: '#0B1220',
                border: '1px solid #243247',
                borderRadius: '12px',
                padding: '8px 10px 8px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <span
                title={currentDepositAddress}
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#E2E8F0',
                  fontFamily: 'monospace'
                }}
              >
                {formatShortAddress(currentDepositAddress)}
              </span>

              <button
                type="button"
                onClick={handleCopyAddress}
                style={{
                  background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
                  color: '#06101C',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Copiar
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#F8FAFC', marginBottom: '4px' }}>
                Monto Mínimo: $1 USD
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#CBD5E1' }}>
                ⚡ <span style={{ color: '#22D3EE', fontWeight: '700' }}>¡Todo depósito se invierte automáticamente!</span>
              </div>
            </div>

            <div
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #1E293B',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '12px',
                color: '#CBD5E1',
                lineHeight: '1.45',
                textAlign: 'left'
              }}
            >
              {selectedNetwork === 'BEP20'
                ? 'Envía solo USDT (BEP20) a esta dirección. Los fondos se acreditarán automáticamente después de la confirmación de la red.'
                : 'Envía solo GRAM o TON a esta dirección. Los fondos se acreditarán automáticamente después de la confirmación de la red.'}
            </div>
          </div>
        </div>
      )}

      {/* VISTA RETIRAR (Como la imagen) */}
      {activeSection === 'withdraw' && (
        <form onSubmit={handleConfirmWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Tarjeta Saldo Disponible */}
          <div
            style={{
              background: 'linear-gradient(180deg, #102033 0%, #0B1322 100%)',
              border: '1px solid #1E324A',
              borderRadius: '18px',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#CBD5E1', marginBottom: '4px' }}>
              Saldo Disponible:
            </div>
            <div style={{ fontSize: '30px', fontWeight: '800', color: '#22D3EE', letterSpacing: '-0.5px' }}>
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span style={{ fontSize: '16px', fontWeight: '800' }}>USD</span>
            </div>
          </div>

          {/* Selector de Red: USDT (BEP20) | GRAM/TON */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                safeHaptic('light');
                setWithdrawNetwork('BEP20');
              }}
              style={{
                background:
                  withdrawNetwork === 'BEP20'
                    ? 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)'
                    : '#0F172A',
                color: withdrawNetwork === 'BEP20' ? '#06101C' : '#CBD5E1',
                border: withdrawNetwork === 'BEP20' ? 'none' : '1px solid #1E293B',
                borderRadius: '999px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: withdrawNetwork === 'BEP20' ? '0 0 16px rgba(34, 211, 238, 0.35)' : 'none'
              }}
            >
              USDT (BEP20)
            </button>

            <button
              type="button"
              onClick={() => {
                safeHaptic('light');
                setWithdrawNetwork('TON');
              }}
              style={{
                background:
                  withdrawNetwork === 'TON'
                    ? 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)'
                    : '#0F172A',
                color: withdrawNetwork === 'TON' ? '#06101C' : '#CBD5E1',
                border: withdrawNetwork === 'TON' ? 'none' : '1px solid #1E293B',
                borderRadius: '999px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: withdrawNetwork === 'TON' ? '0 0 16px rgba(34, 211, 238, 0.35)' : 'none'
              }}
            >
              GRAM/TON
            </button>
          </div>

          {/* Contenedor de campos: Dirección de Billetera + Monto a Retirar */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '18px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Dirección de Billetera + Pegar */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', display: 'block', marginBottom: '8px' }}>
                Dirección de Billetera
              </label>
              <div
                style={{
                  backgroundColor: '#0B1220',
                  border: '1px solid #243247',
                  borderRadius: '12px',
                  padding: '6px 8px 6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <input
                  type="text"
                  placeholder={withdrawNetwork === 'BEP20' ? '0x71C...3a9f' : 'EQ... o UQ...'}
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    fontWeight: '600',
                    minWidth: 0
                  }}
                />
                <button
                  type="button"
                  onClick={handlePasteAddress}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#22D3EE',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    flexShrink: 0
                  }}
                >
                  Pegar
                </button>
              </div>
            </div>

            {/* Monto a Retirar + MAX */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', display: 'block', marginBottom: '8px' }}>
                Monto a Retirar
              </label>
              <div
                style={{
                  backgroundColor: '#0B1220',
                  border: '1px solid #243247',
                  borderRadius: '12px',
                  padding: '6px 8px 6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="20.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#F8FAFC',
                    fontSize: '16px',
                    fontWeight: '700',
                    minWidth: 0
                  }}
                />
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  style={{
                    backgroundColor: '#0891B2',
                    color: '#FFFFFF',
                    border: '1px solid #22D3EE',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  MAX
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                Monto mínimo: $1 USD
              </div>
            </div>
          </div>

          {/* Botón Confirmar Retiro */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
              color: '#06101C',
              border: 'none',
              borderRadius: '999px',
              padding: '15px 20px',
              fontSize: '15px',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 0 22px rgba(34, 211, 238, 0.35)'
            }}
          >
            {loading ? 'Procesando...' : 'Confirmar Retiro'}
          </button>
        </form>
      )}
    </div>
  );
}
