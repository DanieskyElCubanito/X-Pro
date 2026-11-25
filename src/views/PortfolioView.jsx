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
  const [activeSection, setActiveSection] = useState(initialSection || 'deposit'); // 'deposit' | 'withdraw' | 'reinvest'
  const [selectedNetwork, setSelectedNetwork] = useState('BEP20'); // 'BEP20' | 'TON'
  const [withdrawNetwork, setWithdrawNetwork] = useState('BEP20');
  const [amount, setAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const availableBalance = Number(userData?.balance ?? 45.8);
  const currentActiveBalance = Number(userData?.active_investments ?? 1245.8);

  useEffect(() => {
    if (
      initialSection === 'deposit' ||
      initialSection === 'withdraw' ||
      initialSection === 'reinvest'
    ) {
      setActiveSection(initialSection);
      if (initialSection === 'reinvest' && availableBalance > 0) {
        setAmount(availableBalance.toFixed(2));
      } else {
        setAmount('');
      }
    }
  }, [initialSection, availableBalance]);

  const numericAmount = parseFloat(amount) || 0;
  const estimatedNewActiveBalance = currentActiveBalance + numericAmount;

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

    toast('Toca el campo y pega tu dirección manualmente', {
      style: { background: '#111C2E', color: '#CBD5E1', border: '1px solid #243247' }
    });
  };

  const handleMaxAmount = () => {
    safeHaptic('light');
    if (availableBalance <= 0) {
      return toast.error('No tienes saldo disponible', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    }
    setAmount(availableBalance.toFixed(2));
  };

  const handleConfirmReinvest = async (e) => {
    e.preventDefault();
    if (numericAmount < 1) {
      safeHaptic('heavy');
      return toast.error('El monto mínimo de reinversión es $1 USD', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    }
    if (numericAmount > availableBalance) {
      safeHaptic('heavy');
      return toast.error('Supera tu saldo disponible para reinvertir', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    }

    setLoading(true);
    safeHaptic('medium');

    try {
      if (botApi?.reinvestBalance) {
        await botApi.reinvestBalance({ user_id: userData?.id, amount: numericAmount });
      }
      toast.success(`¡$${numericAmount.toFixed(2)} USD añadidos a tu Saldo Activo!`, {
        style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
      });
      setAmount('');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('No se pudo completar la reinversión.', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWithdraw = async (e) => {
    e.preventDefault();
    if (numericAmount < 1) {
      safeHaptic('heavy');
      return toast.error('El monto mínimo de retiro es $1 USD', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    }
    if (numericAmount > availableBalance) {
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

  const pageTitle =
    activeSection === 'reinvest'
      ? 'Reinvertir'
      : activeSection === 'withdraw'
      ? 'Retirar'
      : 'Depositar';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '16px' }}>
           {/* Título principal + switch rápido de 3 modos */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#F8FAFC', flexShrink: 0 }}>
          {pageTitle}
        </h2>

        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
              padding: '5px 9px',
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
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Retirar
          </button>

          <button
            type="button"
            onClick={() => {
              safeHaptic('light');
              setActiveSection('reinvest');
            }}
            style={{
              backgroundColor: activeSection === 'reinvest' ? '#111C2E' : 'transparent',
              color: activeSection === 'reinvest' ? '#22D3EE' : '#94A3B8',
              border: activeSection === 'reinvest' ? '1px solid #22D3EE' : '1px solid #1E293B',
              borderRadius: '999px',
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Reinvertir
          </button>
        </div>
      </div>


      {/* VISTA REINVENTIR (Como la imagen) */}
      {activeSection === 'reinvest' && (
        <form onSubmit={handleConfirmReinvest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Saldo Disponible para Reinvertir */}
          <div
            style={{
              background: 'linear-gradient(180deg, #102033 0%, #0B1322 100%)',
              border: '1px solid #1E324A',
              borderRadius: '18px',
              padding: '14px 16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', marginBottom: '4px' }}>
              Saldo Disponible para Reinvertir:
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
              ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#E2E8F0' }}>USD</span>
            </div>
          </div>

          {/* Tarjeta PLAN ÚNICO: 5% DIARIO */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '18px',
              padding: '14px 16px'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#E2E8F0', letterSpacing: '0.4px', marginBottom: '8px' }}>
              PLAN ÚNICO: 5% DIARIO
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC', lineHeight: '1.2' }}>Durante</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#22C55E', lineHeight: '1.15' }}>40 días</div>
              </div>

              <div
                style={{
                  width: '104px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: '#111C2E',
                  border: '1px solid #1E293B'
                }}
              />
            </div>

            <div style={{ fontSize: '12px', fontWeight: '700', color: '#E2E8F0', lineHeight: '1.45' }}>
              <div>Rendimiento Total: 200%</div>
              <div>Monto mínimo de reinversión: $1 USD</div>
            </div>
          </div>

          {/* Monto a Reinvertir + MAX + Resultado */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '18px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0' }}>
              Monto a Reinvertir
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
                placeholder="45.80"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#F8FAFC',
                  fontSize: '18px',
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

            <p style={{ margin: 0, fontSize: '12px', color: '#CBD5E1', lineHeight: '1.45', textAlign: 'center' }}>
              Resultado: Se añadirán{' '}
              <strong style={{ color: '#22D3EE' }}>
                ${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </strong>{' '}
              a tu Saldo Activo. Nuevo Saldo Activo estimado:{' '}
              <strong style={{ color: '#F8FAFC' }}>
                ${estimatedNewActiveBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD.
              </strong>
            </p>
          </div>

          {/* Botón Confirmar Reinversión */}
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
            {loading ? 'Reinvirtiendo...' : 'Confirmar Reinversión'}
          </button>
        </form>
      )}

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

      {/* VISTA RETIRAR */}
      {activeSection === 'withdraw' && (
        <form onSubmit={handleConfirmWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span style={{ fontSize: '16px', fontWeight: '800' }}>USD</span>
            </div>
          </div>

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
