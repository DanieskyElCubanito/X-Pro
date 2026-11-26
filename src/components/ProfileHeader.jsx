import React, { useState } from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import { s } from '../styles/appStyles';

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconGear = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default function ProfileHeader({
  userData,
  transactions = [],
  lang = 'es',
  setLang,
  activeModal,
  setActiveModal,
  t
}) {
  const tgUser = WebApp.initDataUnsafe?.user;
  const displayName =
    userData?.username && userData.username !== 'Usuario'
      ? userData.username
      : tgUser?.first_name || tgUser?.username || 'User123';

  const [bep20Wallet, setBep20Wallet] = useState(userData?.wallet_bep20 || '');
  const [tonWallet, setTonWallet] = useState(userData?.wallet_ton || '');

  const safeHaptic = (style = 'light') => {
    try {
      if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred(style);
    } catch {}
  };

  const handleToggleLang = () => {
    safeHaptic('light');
    if (typeof setLang === 'function') {
      const next = lang === 'es' ? 'en' : 'es';
      setLang(next);
      toast.success(`Idioma: ${next.toUpperCase()}`, {
        style: { background: '#0F172A', color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.14)' }
      });
    }
  };

  const handleSaveWallets = () => {
    safeHaptic('heavy');
    toast.success('Billeteras guardadas en tu perfil', {
      style: { background: '#0F172A', color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.14)' }
    });
    if (typeof setActiveModal === 'function') setActiveModal(null);
  };

  const currentLangCode = String(lang || 'es').toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Barra superior: Avatar + Nombre a la izquierda, Idioma a la derecha */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 2px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {activeModal ? (
            <button
              type="button"
              onClick={() => {
                safeHaptic('light');
                setActiveModal(null);
              }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                color: '#E2E8F0',
                fontSize: '12px',
                fontWeight: '700',
                padding: '6px 10px',
                cursor: 'pointer'
              }}
            >
              ← Atrás
            </button>
          ) : (
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <IconUser />
            </div>
          )}

          <span
            style={{
              fontSize: '15px',
              fontWeight: '700',
              color: '#F8FAFC',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {activeModal === 'about'
              ? t?.('home_about') || 'ACERCA'
              : activeModal === 'terms'
              ? t?.('home_terms') || 'TÉRMINOS'
              : activeModal === 'history'
              ? t?.('home_history') || 'Historial'
              : activeModal === 'wallets'
              ? 'Billeteras'
              : displayName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggleLang}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '6px 10px',
            color: '#E2E8F0',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <IconGear />
          <span>Idioma: {currentLangCode}</span>
        </button>
      </div>

      {/* Subvistas al pulsar Acerca, Términos, Historial o Billeteras */}
      {activeModal === 'about' && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(20, 27, 38, 0.95) 0%, rgba(10, 14, 21, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '16px',
            fontSize: '13px',
            color: '#CBD5E1',
            lineHeight: 1.55
          }}
        >
          <div style={{ fontWeight: '800', color: '#F8FAFC', marginBottom: '6px' }}>
            Acerca de la Plataforma
          </div>
          Plataforma de tráfico y misiones en Telegram con conversión fija de 1 USD = 1,000 Créditos / $TGM.
        </div>
      )}

      {activeModal === 'terms' && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(20, 27, 38, 0.95) 0%, rgba(10, 14, 21, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '16px',
            fontSize: '13px',
            color: '#CBD5E1',
            lineHeight: 1.55
          }}
        >
          <div style={{ fontWeight: '800', color: '#F8FAFC', marginBottom: '6px' }}>
            Términos y Condiciones
          </div>
          No se permiten multicuentas ni automatizaciones fraudulentas. Los fondos de campaña se destinan a la creación de anuncios y los saldos ganados en $TGM se liquidan según las reglas de la red.
        </div>
      )}

      {activeModal === 'history' && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(20, 27, 38, 0.95) 0%, rgba(10, 14, 21, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {transactions.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '14px 0' }}>
              Sin movimientos registrados todavía.
            </div>
          ) : (
            transactions.slice(0, 15).map((tx, idx) => (
              <div
                key={tx.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                    {tx.title || 'Movimiento'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {tx.description || tx.date || ''}
                  </div>
                </div>
                {tx.amount !== undefined && (
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#E2E8F0' }}>
                    {Number(tx.amount) >= 0 ? `+${tx.amount}` : tx.amount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeModal === 'wallets' && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(20, 27, 38, 0.95) 0%, rgba(10, 14, 21, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
              Billetera USDT (BEP-20)
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={bep20Wallet}
              onChange={(e) => setBep20Wallet(e.target.value)}
              style={{ ...s.input, marginTop: 0 }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
              Billetera TON
            </label>
            <input
              type="text"
              placeholder="UQ... o EQ..."
              value={tonWallet}
              onChange={(e) => setTonWallet(e.target.value)}
              style={{ ...s.input, marginTop: 0 }}
            />
          </div>
          <button
            type="button"
            onClick={handleSaveWallets}
            style={{
              width: '100%',
              padding: '11px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              color: '#F8FAFC',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
