import React, { useState } from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import { s } from '../styles/appStyles';

const IconUSDT = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#26A17B" />
    <path
      d="M13.2 10.6V8.8H16.8V6.5H7.2V8.8H10.8V10.6C8.1 10.8 6.1 11.4 6.1 12.1C6.1 12.8 8.1 13.4 10.8 13.6V18.2H13.2V13.6C15.9 13.4 17.9 12.8 17.9 12.1C17.9 11.4 15.9 10.8 13.2 10.6ZM12 12.9C9.4 12.9 7.5 12.5 7.5 12.1C7.5 11.7 9.4 11.3 12 11.3C14.6 11.3 16.5 11.7 16.5 12.1C16.5 12.5 14.6 12.9 12 12.9Z"
      fill="#FFFFFF"
    />
  </svg>
);

const IconTON = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#0098EA" />
    <path
      d="M15.8 7.5H8.2C7.3 7.5 6.8 8.5 7.3 9.2L11.4 16.3C11.7 16.8 12.3 16.8 12.6 16.3L16.7 9.2C17.2 8.5 16.7 7.5 15.8 7.5ZM11.3 13.8L8.9 9.5C8.8 9.3 8.9 9 9.2 9H11.3V13.8ZM15.1 9.5L12.7 13.8V9H14.8C15.1 9 15.2 9.3 15.1 9.5Z"
      fill="#FFFFFF"
    />
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function ProfileView({ userData, transactions = [], onNavigate, onBack }) {
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

  const [activeModal, setActiveModal] = useState(null); // null | 'wallets' | 'history' | 'security'
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

  const handleSaveWallets = () => {
    safeHaptic('heavy');
    toast.success('Billeteras guardadas en tu perfil', {
      style: { background: '#22D3EE', color: '#06101C', fontWeight: 'bold' }
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
      id: 'bonus',
      label: 'Bono de Registro (+10%)',
      labelColor: '#22D3EE',
      bold: true,
      onClick: () => {
        safeHaptic('medium');
        toast.success('¡Tu +10% de bono está activo en tu primer depósito!', {
          style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
        });
      }
    },
    {
      id: 'history',
      label: 'Historial de transacciones',
      labelColor: '#CBD5E1',
      bold: false,
      onClick: () => {
        safeHaptic('light');
        setActiveModal('history');
      }
    },
    {
      id: 'wallets',
      label: 'Configurar billeteras (USDT/TON)',
      labelColor: '#CBD5E1',
      bold: false,
      onClick: () => {
        safeHaptic('light');
        setActiveModal('wallets');
      }
    },
    {
      id: 'security',
      label: 'Seguridad',
      labelColor: '#CBD5E1',
      bold: false,
      onClick: () => {
        safeHaptic('light');
        setActiveModal('security');
      }
    },
    {
      id: 'support',
      label: 'Soporte y Comunidad',
      labelColor: '#CBD5E1',
      bold: false,
      onClick: () => {
        safeHaptic('light');
        try {
          WebApp.openTelegramLink('https://t.me/CryptoWeb3Pay');
        } catch (e) {
          toast('Abre nuestro canal oficial en Telegram', {
            style: { background: '#111C2E', color: '#F1F5F9', border: '1px solid #243247' }
          });
        }
      }
    },
    {
      id: 'lang',
      label: `Idioma: ${lang}`,
      labelColor: '#CBD5E1',
      bold: false,
      onClick: handleToggleLang
    }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
      {/* Encabezado Superior */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => {
            safeHaptic('light');
            if (activeModal) {
              setActiveModal(null);
            } else if (onBack) {
              onBack();
            }
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
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#F8FAFC' }}>
          {activeModal === 'wallets'
            ? 'Configurar Billeteras'
            : activeModal === 'history'
            ? 'Historial'
            : activeModal === 'security'
            ? 'Seguridad'
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

      {/* SUBVISTA: SEGURIDAD */}
      {activeModal === 'security' && (
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
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#22D3EE' }}>
            Sesión Verificada por Telegram
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', lineHeight: '1.45' }}>
            Tu cuenta está vinculada de forma segura a tu ID de Telegram (<strong>{userId}</strong>). Todas las operaciones sensibles y retiros requieren validación directa.
          </p>
        </div>
      )}

      {/* VISTA PRINCIPAL DE MI PERFIL (Como la imagen) */}
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

          {/* Botón Retirar Saldo + Badges Cripto */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <button
              onClick={() => {
                safeHaptic('medium');
                if (onNavigate) onNavigate('portfolio', 'withdraw');
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
                color: '#06101C',
                border: 'none',
                borderRadius: '999px',
                padding: '13px 18px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 0 18px rgba(34, 211, 238, 0.3)'
              }}
            >
              Retirar Saldo <span style={{ fontWeight: '700' }}>(Mín. $1 USD)</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', fontWeight: '700', color: '#CBD5E1' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <IconUSDT /> USDT (BEP20)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <IconTON /> GRAM/TON
              </span>
            </div>
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
                    fontWeight: item.bold ? '800' : '600',
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
