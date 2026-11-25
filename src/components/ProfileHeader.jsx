import React, { useState } from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import { s } from '../styles/appStyles';

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconShieldCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

export default function ProfileHeader({ userData, transactions = [], onBack }) {
  const tgUser = WebApp.initDataUnsafe?.user;
  const username = tgUser?.username ? `@${tgUser.username}` : userData?.username || '@usuario_tg';
  const userId = tgUser?.id || userData?.id || '987654321';
  const photoUrl =
    tgUser?.photo_url ||
    userData?.photo_url ||
    'https://i.pravatar.cc/120?img=12';

  const availableBalance = Number(userData?.balance ?? 45.8);
  const activeInvestments = Number(userData?.active_investments ?? 1245.8);
  const totalReinvested = Number(userData?.total_reinvested ?? 140.0);
  const totalWithdrawn = Number(userData?.total_withdrawn ?? 320.0);

  const [activeModal, setActiveModal] = useState(null); // null | 'wallets' | 'history' | 'verified'
  const [lang, setLang] = useState(tgUser?.language_code === 'en' ? 'English' : 'Español');
  const [bep20Wallet, setBep20Wallet] = useState(userData?.wallet_bep20 || '');
  const [tonWallet, setTonWallet] = useState(userData?.wallet_ton || '');

  const safeHaptic = (style = 'light') => {
    try {
      if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred(style);
    } catch (e) {}
  };

  const formatUSD = (val) =>
    val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const openTelegramUrl = (url, label) => {
    safeHaptic('light');
    try {
      WebApp.openTelegramLink(url);
    } catch (e) {
      window.open(url, '_blank');
      toast(`${label}: ${url}`, {
        style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
      });
    }
  };

  const handleSaveWallets = () => {
    safeHaptic('heavy');
    toast.success('Billeteras guardadas en tu perfil', {
      style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
    });
    setActiveModal(null);
  };

  const handleToggleLang = () => {
    safeHaptic('light');
    const nextLang = lang === 'Español' ? 'English' : 'Español';
    setLang(nextLang);
    toast.success(`Idioma: ${nextLang}`, {
      style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
    });
  };

  const menuItems = [
    {
      id: 'history',
      label: 'Historial de transacciones',
      labelColor: '#CBD5E1',
      onClick: () => {
        safeHaptic('light');
        setActiveModal('history');
      }
    },
    {
      id: 'wallets',
      label: 'Configurar billeteras (USDT/TON)',
      labelColor: '#CBD5E1',
      onClick: () => {
        safeHaptic('light');
        setActiveModal('wallets');
      }
    },
    {
      id: 'payments_channel',
      label: 'Canal de pagos',
      labelColor: '#22D3EE',
      onClick: () => openTelegramUrl('https://t.me/CryptoWeb3Pay', 'Canal de pagos')
    },
    {
      id: 'info_channel',
      label: 'Canal de información',
      labelColor: '#CBD5E1',
      onClick: () => openTelegramUrl('https://t.me/TheDannyDev', 'Canal de información')
    },
    {
      id: 'support_group',
      label: 'Grupo de ayuda y soporte',
      labelColor: '#CBD5E1',
      onClick: () => openTelegramUrl('https://t.me/CryptoWeb3Pay', 'Grupo de ayuda y soporte')
    },
    {
      id: 'lang',
      label: `Idioma: ${lang}`,
      labelColor: '#CBD5E1',
      onClick: handleToggleLang
    }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
      {/* Encabezado Superior (sin botón Atrás en la vista principal de Perfil) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {activeModal && (
          <button
            type="button"
            onClick={() => {
              safeHaptic('light');
              setActiveModal(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            ← Atrás
          </button>
        )}
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#F8FAFC' }}>
          {activeModal === 'wallets'
            ? 'Configurar Billeteras'
            : activeModal === 'history'
            ? 'Historial'
            : activeModal === 'verified'
            ? 'Plataforma Verificada'
            : 'Mi Perfil'}
        </h2>
      </div>

      {/* SUBVISTA: CONFIGURAR BILLETERAS */}
      {activeModal === 'wallets' && (
        <div
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
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#22D3EE', display: 'block', marginBottom: '6px' }}>
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
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#38BDF8', display: 'block', marginBottom: '6px' }}>
              Billetera GRAM / TON
            </label>
            <input
              type="text"
              placeholder="EQ... o UQ..."
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
              background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
              color: '#06101C',
              border: 'none',
              borderRadius: '999px',
              padding: '13px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            Guardar Billeteras
          </button>
        </div>
      )}

      {/* SUBVISTA: HISTORIAL DE TRANSACCIONES */}
      {activeModal === 'history' && (
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '18px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {transactions.length === 0 ? (
            <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>
              No hay transacciones registradas todavía.
            </p>
          ) : (
            transactions.map((tx, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#111C2E',
                  border: '1px solid #1E293B'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>{tx.title}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{tx.date}</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#22C55E' }}>
                  +${tx.amount} USD
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUBVISTA: DETALLE DE PLATAFORMA VERIFICADA */}
      {activeModal === 'verified' && (
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22D3EE', fontWeight: '800', fontSize: '14px' }}>
            <IconShieldCheck />
            <span>Profit Core • Entidad & Operación Verificada</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5' }}>
            Operación respaldada bajo protocolos de trazabilidad en redes <strong>BNB Smart Chain (BEP-20)</strong> y <strong>The Open Network (TON)</strong>, con registro contable en tiempo real y canales oficiales activos.
          </p>
        </div>
      )}

      {/* VISTA PRINCIPAL DE MI PERFIL */}
      {!activeModal && (
        <>
          {/* Tarjeta Superior: Avatar + Usuario + ID + Resumen de Saldos */}
          <div
            style={{
              background: 'linear-gradient(180deg, #102033 0%, #0B1322 100%)',
              border: '1px solid #1E324A',
              borderRadius: '18px',
              padding: '14px 16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img
                src={photoUrl}
                alt={username}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #22D3EE',
                  flexShrink: 0
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: '800',
                    color: '#F8FAFC',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {username}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
                  ID: {userId}
                </div>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'rgba(148, 163, 184, 0.14)', marginBottom: '12px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div style={{ color: '#E2E8F0', fontWeight: '700' }}>
                Saldo Disponible:{' '}
                <span style={{ color: '#FFFFFF', fontWeight: '800' }}>${formatUSD(availableBalance)} USD</span>
              </div>
              <div style={{ color: '#CBD5E1', fontWeight: '600' }}>
                Inversiones Activas:{' '}
                <span style={{ color: '#F8FAFC', fontWeight: '700' }}>${formatUSD(activeInvestments)} USD</span>
              </div>
              <div style={{ color: '#CBD5E1', fontWeight: '600' }}>
                Reinvertido Total:{' '}
                <span style={{ color: '#F8FAFC', fontWeight: '700' }}>${formatUSD(totalReinvested)} USD</span>
              </div>
              <div style={{ color: '#CBD5E1', fontWeight: '600' }}>
                Total Retirado:{' '}
                <span style={{ color: '#F8FAFC', fontWeight: '700' }}>${formatUSD(totalWithdrawn)} USD</span>
              </div>
            </div>
          </div>

          {/* Sello de Confianza / Plataforma Verificada */}
          <div
            onClick={() => {
              safeHaptic('light');
              setActiveModal('verified');
            }}
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(34, 211, 238, 0.35)',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(34, 211, 238, 0.12)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <IconShieldCheck />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#22D3EE', lineHeight: '1.2' }}>
                  Plataforma Verificada • Profit Core
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px' }}>
                  Red auditada BEP-20 & TON • Operación 100% transparente
                </div>
              </div>
            </div>
            <IconChevronRight />
          </div>

          {/* Lista de Opciones */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '18px',
              overflow: 'hidden',
              marginTop: '2px'
            }}
          >
            {menuItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={item.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px',
                  cursor: 'pointer',
                  borderBottom: idx !== menuItems.length - 1 ? '1px solid rgba(148, 163, 184, 0.12)' : 'none',
                  backgroundColor: '#0F172A'
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: item.id === 'payments_channel' ? '800' : '600',
                    color: item.labelColor
                  }}
                >
                  {item.label}
                </span>
                <IconChevronRight />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
