import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import ProfileHeader from './ProfileHeader';

const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 15" />
  </svg>
);

const formatCompactStat = (val, isCurrency = false) => {
  const num = Number(val || 0);
  const abs = Math.abs(num);
  const prefix = isCurrency ? '$' : '';
  if (abs >= 1_000_000) return `${prefix}${(num / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}${(num / 1_000).toFixed(1)}K`;
  return isCurrency ? `${prefix}${num.toFixed(2)}` : `${Math.round(num)}`;
};

const styles = {
  container: {
    color: '#F3F4F6',
    paddingBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  subNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 2px 10px 2px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
  },
  subNavBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94A3B8',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    padding: '4px 0',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    textTransform: 'uppercase'
  },
  card: {
    background: 'linear-gradient(180deg, rgba(20, 27, 38, 0.94) 0%, rgba(10, 14, 21, 0.98) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.13)',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
  },
  cardTitle: {
    margin: '0 0 14px 0',
    fontSize: '15px',
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: '0.1px'
  },
  grid2x2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px 18px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: '2px'
  },
  statValue: {
    fontSize: '21px',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: '-0.3px',
    lineHeight: 1.2
  },
  sectionTitle: {
    margin: '4px 2px 0 2px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#F1F5F9'
  },
  balLabel: {
    fontSize: '13px',
    color: '#CBD5E1',
    fontWeight: '600',
    marginBottom: '4px'
  },
  balAmount: {
    fontSize: '25px',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: '-0.4px',
    lineHeight: 1.2,
    marginBottom: '4px'
  },
  balSub: {
    fontSize: '12px',
    color: '#94A3B8',
    marginBottom: '14px'
  },
  outlineBtn: {
    width: '100%',
    padding: '10px 14px',
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '10px',
    color: '#F8FAFC',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12)'
  }
};

export default function HomeTab({ userData, setActiveTab, t, lang, setLang }) {
  const [activeModal, setActiveModal] = useState(null); // null | 'about' | 'terms' | 'history' | 'wallets'
  const [historyList, setHistoryList] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    users: 0,
    withdrawn: 0,
    deposited: 0,
    daysOnline: 1
  });

  const apiHeaders = {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': WebApp.initData || ''
  };

  useEffect(() => {
    let active = true;
    fetch('/api', {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ action: 'get-global-stats' })
    })
      .then((r) => r.json())
      .then((data) => {
        if (active && data?.success && data.stats) {
          setGlobalStats({
            users: Number(data.stats.users || 0),
            withdrawn: Number(data.stats.withdrawn || 0),
            deposited: Number(data.stats.deposited || 0),
            daysOnline: Number(data.stats.daysOnline || 1)
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleOpenHistory = async () => {
    setActiveModal('history');
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ action: 'get-history' })
      });
      const data = await res.json();
      if (data?.success) setHistoryList(data.history || []);
    } catch {
      toast.error('No se pudo cargar el historial.');
    }
  };

  const handleOpenSupport = () => {
    try {
      WebApp.openTelegramLink('https://t.me/TheDannyWeb3');
    } catch {
      window.open('https://t.me/TheDannyWeb3', '_blank');
    }
  };

  const handleGoWallet = (mode) => {
    try {
      localStorage.setItem('preferred_wallet_tab', mode);
    } catch {}
    if (typeof setActiveTab === 'function') setActiveTab('wallet');
  };

  // deposit_balance en USD -> Créditos (1 USD = 1,000 Créditos)
  const vaultUsd = Number(userData?.deposit_balance || 0);
  const creditsEquiv = vaultUsd * 1000;

  // balance en USD -> $TGM (1 USD = 1,000 $TGM)
  const withdrawableUsd = Number(userData?.balance || 0);
  const tgmBalance = Number((withdrawableUsd * 1000).toFixed(0));

  return (
    <div style={styles.container} className="fade-in">
      <ProfileHeader
        userData={userData}
        transactions={historyList}
        lang={lang}
        setLang={setLang}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        t={t}
      />

      {!activeModal && (
        <>
          {/* Barra secundaria: SOPORTE | ACERCA | TÉRMINOS | Historial */}
          <div style={styles.subNav}>
            <button type="button" onClick={handleOpenSupport} style={styles.subNavBtn}>
              {t?.('home_support') || 'SOPORTE'}
            </button>
            <button type="button" onClick={() => setActiveModal('about')} style={styles.subNavBtn}>
              {t?.('home_about') || 'ACERCA'}
            </button>
            <button type="button" onClick={() => setActiveModal('terms')} style={styles.subNavBtn}>
              {t?.('home_terms') || 'TÉRMINOS'}
            </button>
            <button type="button" onClick={handleOpenHistory} style={styles.subNavBtn}>
              <IconClock />
              <span>{t?.('home_history') || 'Historial'}</span>
            </button>
          </div>

          {/* Tarjeta Datos Globales */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>{t?.('home_global_data') || 'Datos Globales'}</h3>
            <div style={styles.grid2x2}>
              <div>
                <div style={styles.statLabel}>{t?.('home_stat_users') || 'Usuarios:'}</div>
                <div style={styles.statValue}>{globalStats.users}</div>
              </div>
              <div>
                <div style={styles.statLabel}>{t?.('home_stat_withdrawn') || 'Retirado:'}</div>
                <div style={styles.statValue}>{formatCompactStat(globalStats.withdrawn, false)}</div>
              </div>
              <div>
                <div style={styles.statLabel}>{t?.('home_stat_vault') || 'Fondos Bóveda:'}</div>
                <div style={styles.statValue}>{formatCompactStat(globalStats.deposited, true)}</div>
              </div>
              <div>
                <div style={styles.statLabel}>{t?.('home_stat_days') || 'Días en Línea:'}</div>
                <div style={styles.statValue}>{globalStats.daysOnline}</div>
              </div>
            </div>
          </div>

          {/* Sección Fondo de Campaña */}
          <h3 style={styles.sectionTitle}>{t?.('home_campaign_fund') || 'Fondo de Campaña'}</h3>

          {/* Tarjeta 1: USD (Fondos para Campañas) -> Depositar */}
          <div style={styles.card}>
            <div style={styles.balLabel}>
              {t?.('home_vault_usd_label') || 'USD (Fondos para Campañas)'}
            </div>
            <div style={styles.balAmount}>{vaultUsd.toFixed(2)} USD</div>
            <div style={styles.balSub}>
              Equivale a {creditsEquiv.toFixed(2)} CRÉDITOS
            </div>
            <button type="button" onClick={() => handleGoWallet('deposit')} style={styles.outlineBtn}>
              {t?.('home_btn_deposit') || 'Depositar'}
            </button>
          </div>

          {/* Tarjeta 2: Saldo Retirable ($TGM) -> Retirar */}
          <div style={styles.card}>
            <div style={styles.balLabel}>
              {t?.('home_withdrawable_label') || 'Saldo Retirable ($TGM)'}
            </div>
            <div style={styles.balAmount}>{tgmBalance.toLocaleString('en-US')} $TGM</div>
            <div style={styles.balSub}>1000 $TGM = 1 USD</div>
            <button type="button" onClick={() => handleGoWallet('withdraw')} style={styles.outlineBtn}>
              {t?.('home_btn_withdraw') || 'Retirar'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
