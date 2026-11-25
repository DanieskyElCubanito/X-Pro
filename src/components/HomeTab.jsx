import React, { useState } from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';

// Ícono circular de USDT y TON para la barra de retiro
const IconUSDT = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#26A17B" />
    <path
      d="M13.2 10.6V8.8H16.8V6.5H7.2V8.8H10.8V10.6C8.1 10.8 6.1 11.4 6.1 12.1C6.1 12.8 8.1 13.4 10.8 13.6V18.2H13.2V13.6C15.9 13.4 17.9 12.8 17.9 12.1C17.9 11.4 15.9 10.8 13.2 10.6ZM12 12.9C9.4 12.9 7.5 12.5 7.5 12.1C7.5 11.7 9.4 11.3 12 11.3C14.6 11.3 16.5 11.7 16.5 12.1C16.5 12.5 14.6 12.9 12 12.9Z"
      fill="#FFFFFF"
    />
  </svg>
);

const IconTON = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#0098EA" />
    <path
      d="M15.8 7.5H8.2C7.3 7.5 6.8 8.5 7.3 9.2L11.4 16.3C11.7 16.8 12.3 16.8 12.6 16.3L16.7 9.2C17.2 8.5 16.7 7.5 15.8 7.5ZM11.3 13.8L8.9 9.5C8.8 9.3 8.9 9 9.2 9H11.3V13.8ZM15.1 9.5L12.7 13.8V9H14.8C15.1 9 15.2 9.3 15.1 9.5Z"
      fill="#FFFFFF"
    />
  </svg>
);

// Ícono de Idioma (Globo / Mundo)
const IconLanguage = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// Ícono de Soporte (Auriculares / Headset)
const IconSupport = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

export default function HomeTab({ userData, onNavigate, onLanguageChange, currentLang }) {
  const [lang, setLang] = useState(currentLang || 'ES');

  const balance = Number(userData?.balance ?? 1245.8);
  const dailyChange = userData?.daily_change ?? '-2.4% hoy';
  const isNegative = String(dailyChange).includes('-');

  const safeHaptic = (style = 'medium') => {
    try {
      if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred(style);
    } catch (e) {}
  };

  const handleToggleLanguage = () => {
    safeHaptic('light');
    const nextLang = lang === 'ES' ? 'EN' : 'ES';
    setLang(nextLang);
    if (onLanguageChange) onLanguageChange(nextLang);
    toast.success(nextLang === 'ES' ? 'Idioma: Español (ES)' : 'Language: English (EN)', {
      style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
    });
  };

  const handleOpenSupport = () => {
    safeHaptic('light');
    try {
      WebApp.openTelegramLink('https://t.me/CryptoWeb3Pay');
    } catch (e) {
      toast('Soporte disponible en @CryptoWeb3Pay', {
        style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
      });
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '12px' }}>

      {/* BARRA SUPERIOR: LENGUAJE Y SOPORTE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          type="button"
          onClick={handleToggleLanguage}
          aria-label="Cambiar idioma"
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '999px',
            padding: '6px 11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#F8FAFC',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer'
          }}
        >
          <IconLanguage />
          <span>{lang}</span>
        </button>

        <button
          type="button"
          onClick={handleOpenSupport}
          aria-label="Soporte"
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '999px',
            padding: '6px 11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#F8FAFC',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer'
          }}
        >
          <IconSupport />
          <span>{lang === 'ES' ? 'Soporte' : 'Support'}</span>
        </button>
      </div>

      {/* 1. TARJETA PRINCIPAL: SALDO ACTIVO */}
      <div
        style={{
          background: 'linear-gradient(180deg, #102033 0%, #0B1322 100%)',
          border: '1px solid #1E324A',
          borderRadius: '20px',
          padding: '20px 16px',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', letterSpacing: '1px' }}>
            SALDO ACTIVO
          </span>
          <span
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.16)',
              color: '#22C55E',
              fontSize: '11px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(34, 197, 94, 0.35)'
            }}
          >
            +5% diario
          </span>
        </div>

        <h1 style={{ margin: '0 0 4px 0', fontSize: '34px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '-0.5px' }}>
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#CBD5E1' }}>USD</span>
        </h1>

        <p
          style={{
            margin: '0 0 8px 0',
            fontSize: '13px',
            fontWeight: '700',
            color: isNegative ? '#F87171' : '#22C55E'
          }}
        >
          ({dailyChange})
        </p>

        <p style={{ margin: 0, fontSize: '12px', color: '#CBD5E1', fontWeight: '500' }}>
          ¡Todo depósito se invierte automáticamente!
        </p>
      </div>

      {/* 2. BOTÓN PRINCIPAL: DEPOSITAR */}
      <button
        type="button"
        onClick={() => {
          safeHaptic('medium');
          onNavigate('portfolio', 'deposit');
        }}
        style={{
          width: '100%',
          background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
          color: '#06101C',
          border: 'none',
          borderRadius: '999px',
          padding: '15px 20px',
          fontSize: '14px',
          fontWeight: '800',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.35)',
          letterSpacing: '0.3px'
        }}
      >
        DEPOSITAR (Mín. $1 USD)
      </button>

      {/* 3. BARRA SECUNDARIA: RETIRAR + ÍCONOS CRIPTO */}
      <div
        onClick={() => {
          safeHaptic('light');
          onNavigate('portfolio', 'withdraw');
        }}
        style={{
          backgroundColor: '#111C2E',
          border: '1px solid #1E293B',
          borderRadius: '999px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
      >
        <div>
          <span style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '14px' }}>Retirar </span>
          <span style={{ color: '#94A3B8', fontSize: '12px' }}>(Mín. $1 USD)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconUSDT />
          <IconTON />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.05', textAlign: 'left' }}>
            <span style={{ fontSize: '9px', fontWeight: '800', color: '#CBD5E1' }}>GRAM</span>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#94A3B8' }}>/ TON</span>
          </div>
        </div>
      </div>

      {/* 4. TARJETA DEL PLAN ÚNICO: 5% DIARIO */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '20px',
          padding: '16px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '800', color: '#F1F5F9', letterSpacing: '0.5px' }}>
          PLAN ÚNICO: 5% DIARIO
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#F1F5F9', lineHeight: '1.2' }}>Durante</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#22C55E', lineHeight: '1.15' }}>40 días</div>
          </div>

          <div
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',
              color: '#06101C',
              borderRadius: '14px',
              padding: '10px 12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(34, 211, 238, 0.25)'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '800', lineHeight: '1.25' }}>Reinversión</div>
            <div style={{ fontSize: '12px', fontWeight: '800', lineHeight: '1.25' }}>Automática / Manual</div>
            <div style={{ fontSize: '10px', fontWeight: '700', marginTop: '2px', opacity: 0.85 }}>(Mín. $1)</div>
          </div>
        </div>

        {/* Botones Invertir y Reinvertir */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              safeHaptic('medium');
              onNavigate('portfolio', 'deposit');
            }}
            style={{
              flex: 1,
              backgroundColor: '#22D3EE',
              color: '#06101C',
              border: 'none',
              borderRadius: '999px',
              padding: '11px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Invertir
          </button>

          <button
            type="button"
            onClick={() => {
              safeHaptic('medium');
              onNavigate('portfolio', 'reinvest');
            }}
            style={{
              flex: 1,
              backgroundColor: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155',
              borderRadius: '999px',
              padding: '11px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Reinvertir
          </button>
        </div>
      </div>

      {/* 5. BANNER PROMOCIONAL RENOVADO: +10% BONO */}
<div
  onClick={() => {
    safeHaptic('light');
    onNavigate('portfolio', 'deposit');
  }}
  style={{
    background: 'linear-gradient(135deg, rgba(16, 32, 51, 0.95) 0%, rgba(24, 24, 58, 0.95) 55%, rgba(45, 22, 75, 0.92) 100%)',
    border: '1px solid rgba(34, 211, 238, 0.35)',
    borderRadius: '16px',
    padding: '13px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
  }}
>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
    <span
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '9px',
        backgroundColor: 'rgba(34, 211, 238, 0.14)',
        border: '1px solid rgba(34, 211, 238, 0.35)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </span>

    <span style={{ fontSize: '13px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '0.2px' }}>
      <span style={{ color: '#22D3EE' }}>+10% BONO</span> en tu 1er Depósito
    </span>
  </div>

  <span
    style={{
      backgroundColor: 'rgba(34, 211, 238, 0.16)',
      color: '#22D3EE',
      border: '1px solid rgba(34, 211, 238, 0.35)',
      borderRadius: '999px',
      padding: '4px 10px',
      fontSize: '11px',
      fontWeight: '800',
      flexShrink: 0
    }}
  >
    Activar
  </span>
</div>

