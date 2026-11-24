import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import { s } from '../styles/appStyles';
import { botApi } from '../api/botApi';

const DEFAULT_WALLETS = {
  bep20: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  ton: 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ'
};

export default function PortfolioView({ userData, activePlans = [], initialSection = 'deposit', onUpdate }) {
  const [activeSection, setActiveSection] = useState(initialSection || 'deposit');
  const [selectedNetwork, setSelectedNetwork] = useState('BEP20'); // 'BEP20' | 'TON'
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('BEP20');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSection === 'deposit' || initialSection === 'withdraw') {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const balance = Number(userData?.balance || 0);
  const numericAmount = parseFloat(amount) || 0;
  const dailyEstimate = (numericAmount * 0.05).toFixed(2);
  const total40DaysEstimate = (numericAmount * 0.05 * 40).toFixed(2);

  const depositAddress =
    selectedNetwork === 'BEP20'
      ? userData?.deposit_bep20 || DEFAULT_WALLETS.bep20
      : userData?.deposit_ton || DEFAULT_WALLETS.ton;

  const safeHaptic = (style = 'light') => {
    try {
      if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred(style);
    } catch (e) {}
  };

  const handleCopyAddress = () => {
    safeHaptic('light');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(depositAddress);
    }
    toast.success(`Dirección ${selectedNetwork} copiada`, {
      style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
    });
  };

  const handleConfirmDeposit = async (e) => {
    e.preventDefault();
    if (numericAmount < 1) {
      safeHaptic('heavy');
      return toast.error('El monto mínimo de depósito es $1.00 USD', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    }
    if (!txHash.trim()) {
      safeHaptic('heavy');
      return toast.error('Ingresa el Hash (TxID) de la transacción', {
        style: { background: '#111C2E', color: '#F87171', border: '1px solid #243247' }
      });
    }

    setLoading(true);
    safeHaptic('medium');

    try {
      const payload = {
        user_id: userData?.id,
        amount: numericAmount,
        network: selectedNetwork,
        tx_hash: txHash.trim(),
        plan: '5_DAILY_40D'
      };

      if (botApi?.submitDeposit) {
        await botApi.submitDeposit(payload);
      }

      toast.success('¡Depósito enviado a verificación! Se invertirá al 5% diario.', {
        style: { background: '#111C2E', color: '#22C55E', border: '1px solid #22C55E' }
      });
      setAmount('');
      setTxHash('');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('No se pudo registrar el depósito. Intenta de nuevo.', {
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
      return toast.error('El retiro mínimo es $1.00 USD', {
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

      toast.success('Solicitud de retiro enviada correctamente', {
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
      {/* Resumen de Saldo y Plan Único */}
      <div
        style={{
          background: 'linear-gradient(180deg, #102033 0%, #0B1322 100%)',
          border: '1px solid #1E324A',
          borderRadius: '18px',
          padding: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8' }}>SALDO DISPONIBLE</span>
          <span
            style={{
              backgroundColor: 'rgba(34, 211, 238, 0.14)',
              color: '#22D3EE',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(34, 211, 238, 0.35)'
            }}
          >
            5% Diario • 40 Días
          </span>
        </div>

        <div style={{ fontSize: '28px', fontWeight: '800', color: '#F8FAFC' }}>
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span style={{ fontSize: '15px', color: '#94A3B8', fontWeight: '700' }}>USD</span>
        </div>

        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#CBD5E1' }}>
          Planes activos: <strong>{activePlans.length}</strong> • Todo depósito entra al plan automáticamente.
        </p>
      </div>

      {/* Selector de Pestaña: Depositar / Retirar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          backgroundColor: '#0F172A',
          padding: '5px',
          borderRadius: '999px',
          border: '1px solid #1E293B'
        }}
      >
        <button
          type="button"
          onClick={() => {
            safeHaptic('light');
            setActiveSection('deposit');
          }}
          style={{
            background: activeSection === 'deposit' ? 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)' : 'transparent',
            color: activeSection === 'deposit' ? '#06101C' : '#94A3B8',
            border: 'none',
            borderRadius: '999px',
            padding: '10px',
            fontWeight: '800',
            fontSize: '13px',
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
            background: activeSection === 'withdraw' ? 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)' : 'transparent',
            color: activeSection === 'withdraw' ? '#06101C' : '#94A3B8',
            border: 'none',
            borderRadius: '999px',
            padding: '10px',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Retirar
        </button>
      </div>

      {/* SECCIÓN DEPÓSITO */}
      {activeSection === 'deposit' && (
        <form
          onSubmit={handleConfirmDeposit}
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#F1F5F9' }}>
            1. Selecciona la Red de Depósito
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSelectedNetwork('BEP20')}
              style={{
                backgroundColor: selectedNetwork === 'BEP20' ? '#102033' : '#111C2E',
                color: selectedNetwork === 'BEP20' ? '#22D3EE' : '#CBD5E1',
                border: selectedNetwork === 'BEP20' ? '1px solid #22D3EE' : '1px solid #1E293B',
                borderRadius: '12px',
                padding: '10px',
                fontWeight: '800',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              USDT (BEP-20)
            </button>

            <button
              type="button"
              onClick={() => setSelectedNetwork('TON')}
              style={{
                backgroundColor: selectedNetwork === 'TON' ? '#102033' : '#111C2E',
                color: selectedNetwork === 'TON' ? '#38BDF8' : '#CBD5E1',
                border: selectedNetwork === 'TON' ? '1px solid #38BDF8' : '1px solid #1E293B',
                borderRadius: '12px',
                padding: '10px',
                fontWeight: '800',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              GRAM / TON
            </button>
          </div>

          <div style={{ fontSize: '13px', fontWeight: '800', color: '#F1F5F9', marginTop: '2px' }}>
            2. Envía tu monto (Mín. $1 USD) a esta dirección:
          </div>

          <div
            style={{
              backgroundColor: '#0B1220',
              border: '1px solid #243247',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: '#CBD5E1',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {depositAddress}
            </span>
            <button
              type="button"
              onClick={handleCopyAddress}
              style={{
                backgroundColor: '#22D3EE',
                color: '#06101C',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Copiar
            </button>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
              Monto depositado (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              placeholder="Ej. 10.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ ...s.input, marginTop: 0 }}
            />
          </div>

          {/* Proyección del Plan Único */}
          <div
            style={{
              backgroundColor: '#111C2E',
              border: '1px solid #1E293B',
              borderRadius: '12px',
              padding: '10px 12px',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Ganancia diaria estimada (5%):</span>
              <strong style={{ color: '#22C55E' }}>+${dailyEstimate} USD</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Retorno en 40 días:</span>
              <strong style={{ color: '#22D3EE' }}>+${total40DaysEstimate} USD</strong>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
              Hash de transacción (TxID)
            </label>
            <input
              type="text"
              placeholder="Pega aquí el hash de pago"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              style={{ ...s.input, marginTop: 0 }}
            />
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
              padding: '14px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '4px'
            }}
          >
            {loading ? 'Procesando...' : 'Confirmar Depósito (Mín. $1 USD)'}
          </button>
        </form>
      )}

      {/* SECCIÓN RETIRO */}
      {activeSection === 'withdraw' && (
        <form
          onSubmit={handleConfirmWithdraw}
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#F1F5F9' }}>
            Retirar Saldo (Mín. $1 USD)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setWithdrawNetwork('BEP20')}
              style={{
                backgroundColor: withdrawNetwork === 'BEP20' ? '#102033' : '#111C2E',
                color: withdrawNetwork === 'BEP20' ? '#22D3EE' : '#CBD5E1',
                border: withdrawNetwork === 'BEP20' ? '1px solid #22D3EE' : '1px solid #1E293B',
                borderRadius: '12px',
                padding: '10px',
                fontWeight: '800',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              USDT (BEP20)
            </button>

            <button
              type="button"
              onClick={() => setWithdrawNetwork('TON')}
              style={{
                backgroundColor: withdrawNetwork === 'TON' ? '#102033' : '#111C2E',
                color: withdrawNetwork === 'TON' ? '#38BDF8' : '#CBD5E1',
                border: withdrawNetwork === 'TON' ? '1px solid #38BDF8' : '1px solid #1E293B',
                borderRadius: '12px',
                padding: '10px',
                fontWeight: '800',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              GRAM / TON
            </button>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
              Monto a retirar (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              placeholder="Mínimo $1.00 USD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ ...s.input, marginTop: 0 }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
              Tu billetera ({withdrawNetwork === 'BEP20' ? 'USDT BEP-20' : 'GRAM / TON'})
            </label>
            <input
              type="text"
              placeholder={withdrawNetwork === 'BEP20' ? '0x...' : 'EQ... o UQ...'}
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              style={{ ...s.input, marginTop: 0 }}
            />
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
              padding: '14px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '4px'
            }}
          >
            {loading ? 'Enviando...' : 'Solicitar Retiro'}
          </button>
        </form>
      )}
    </div>
  );
}
