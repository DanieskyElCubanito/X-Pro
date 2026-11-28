import { useEffect, useState, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import toast, { Toaster } from 'react-hot-toast';
import { s } from './styles/appStyles';
import { botApi } from './api/botApi';

import HomeTab from './components/HomeTab';
import TeamTab from './components/TeamTab';
import ProfileHeader from './components/ProfileHeader';
import PortfolioView from './views/PortfolioView';

// Íconos SVG integrados directamente para la barra inferior
const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconTeam = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconProfile = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Pantalla de carga estilo cubo neón cian + auditoría activa
function LoadingSplash() {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'radial-gradient(circle at 50% 35%, #0F233A 0%, #070E1A 70%, #050912 100%)',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '48px 24px 28px 24px',
        boxSizing: 'border-box',
        textAlign: 'center'
      }}
    >
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.55)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 24px rgba(34, 211, 238, 0.9)); transform: scale(1.03); }
        }
        @keyframes loadProgress {
          0% { width: 18%; }
          50% { width: 68%; }
          100% { width: 92%; }
        }
      `}</style>

      <div />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '300px'
        }}
      >
        <div style={{ animation: 'pulseGlow 2.2s ease-in-out infinite', marginBottom: '26px' }}>
          <svg width="112" height="112" viewBox="0 0 120 120" fill="none">
            <polygon
              points="60,12 102,36 102,84 60,108 18,84 18,36"
              stroke="#22D3EE"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <line x1="60" y1="60" x2="60" y2="12" stroke="#22D3EE" strokeWidth="3.5" />
            <line x1="60" y1="60" x2="102" y2="84" stroke="#22D3EE" strokeWidth="3.5" />
            <line x1="60" y1="60" x2="18" y2="84" stroke="#22D3EE" strokeWidth="3.5" />
            <polygon
              points="60,34 82,47 82,73 60,86 38,73 38,47"
              stroke="#67E8F9"
              strokeWidth="2.5"
              strokeLinejoin="round"
              opacity="0.85"
            />
          </svg>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            backgroundColor: 'rgba(15, 35, 58, 0.9)',
            border: '1px solid rgba(34, 211, 238, 0.35)',
            borderRadius: '999px',
            padding: '7px 14px',
            marginBottom: '18px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
          }}
        >
          <span
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#22C55E',
              color: '#06101C',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '900'
            }}
          >
            ✓
          </span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#E2E8F0' }}>
            Verificado • Auditoría Activa
          </span>
        </div>

        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#0E1C2F',
            border: '1px solid rgba(34, 211, 238, 0.45)',
            borderRadius: '999px',
            overflow: 'hidden',
            padding: '1px',
            boxSizing: 'border-box',
            marginBottom: '12px'
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
              animation: 'loadProgress 2.4s ease-out forwards',
              boxShadow: '0 0 12px rgba(34, 211, 238, 0.7)'
            }}
          />
        </div>

        <div style={{ fontSize: '12px', fontWeight: '600', color: '#CBD5E1', letterSpacing: '0.2px' }}>
          Seguridad • Rapidez • Transparencia
        </div>
      </div>

      <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.45' }}>
        Infraestructura auditada • Emblema de
        <br />
        Confianza Global
      </div>
    </div>
  );
}

const formatTransactions = (rawList = []) =>
  rawList.map((tx) => ({
    type: tx.type,
    title: tx.title,
    date: tx.created_at
      ? new Date(tx.created_at).toLocaleString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
      : tx.date || '',
    amount: Number(tx.amount || 0).toFixed(2),
    status: tx.status || 'completed'
  }));

export default function App() {
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('home');
  const [portfolioMode, setPortfolioMode] = useState('deposit');
  const [userData, setUserData] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [currentLang, setCurrentLang] = useState('ES');
  const [transactions, setTransactions] = useState([]);

  const tgUser = WebApp.initDataUnsafe?.user;
  const currentUserId = tgUser?.id || 8968109534;
  const startParam = WebApp.initDataUnsafe?.start_param || null;

  const verifyUser = useCallback(
    async (user) => {
      const minSplashTime = new Promise((resolve) => setTimeout(resolve, 1800));

      try {
        const [data] = await Promise.all([
          botApi.verifyUser(user, startParam),
          minSplashTime
        ]);

        if (data && data.success) {
          setUserData({
            ...data.user,
            id: currentUserId,
            photo_url:
              tgUser?.photo_url ||
              data.user?.photo_url ||
              'https://i.pravatar.cc/120?img=12'
          });
          setActivePlans(data.plans || []);
          if (Array.isArray(data.transactions)) {
            setTransactions(formatTransactions(data.transactions));
          }
          setStatus('member');
        } else {
          setUserData({ id: currentUserId, balance: 0 });
          setStatus('member');
        }
      } catch (err) {
        await minSplashTime;
        setUserData({ id: currentUserId, balance: 0 });
        setStatus('member');
      }
    },
    [currentUserId, startParam, tgUser?.photo_url]
  );

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      const user = tgUser || { id: 8968109534, username: 'TestUser' };
      verifyUser(user);
    } catch (e) {
      setStatus('error');
    }
  }, [verifyUser, tgUser]);

  const handleNavigate = (tab, mode = 'deposit') => {
    if (tab === 'portfolio') {
      setPortfolioMode(mode);
    }
    setActiveTab(tab);
  };

  const handleReinvest = async (amountToReinvest) => {
    try {
      if (botApi?.reinvestBalance) {
        await botApi.reinvestBalance({ user_id: userData?.id || currentUserId, amount: amountToReinvest });
      }
      toast.success(`¡$${Number(amountToReinvest).toFixed(2)} USD reinvertidos al 5% diario!`, {
        style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
      });
      await verifyUser(tgUser || { id: currentUserId, username: 'TestUser' });
    } catch (e) {
      toast.error(e?.message || 'No se pudo completar la reinversión');
    }
  };

  if (status === 'loading') {
    return <LoadingSplash />;
  }

  return (
    <div style={s.container}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#111C2E',
            color: '#F1F5F9',
            border: '1px solid #243247'
          }
        }}
      />

      <div style={s.main}>
        {activeTab === 'home' && (
          <HomeTab
            userData={userData}
            activePlans={activePlans}
            onNavigate={handleNavigate}
            onReinvest={handleReinvest}
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
          />
        )}

        {activeTab === 'portfolio' && (
          <div>
            <button
              onClick={() => setActiveTab('home')}
              style={{
                background: 'none',
                border: 'none',
                color: '#22D3EE',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '0 0 12px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ← Volver a Inicio
            </button>
            <PortfolioView
              userData={userData}
              activePlans={activePlans}
              initialSection={portfolioMode}
              onUpdate={() =>
                verifyUser(tgUser || { id: currentUserId, username: 'TestUser' })
              }
            />
          </div>
        )}

        {activeTab === 'team' && (
          <TeamTab
            userData={userData}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileHeader
            userData={userData}
            transactions={transactions}
            onNavigate={handleNavigate}
            onBack={() => setActiveTab('home')}
          />
        )}
      </div>

      {/* ÚNICAMENTE 3 PESTAÑAS: Inicio, Equipo, Perfil */}
      <div style={s.bottomNav}>
        <div
          onClick={() => setActiveTab('home')}
          style={activeTab === 'home' || activeTab === 'portfolio' ? s.navItemActive : s.navItem}
        >
          <IconHome /> Inicio
        </div>

        <div
          onClick={() => setActiveTab('team')}
          style={activeTab === 'team' ? s.navItemActive : s.navItem}
        >
          <IconTeam /> Equipo
        </div>

        <div
          onClick={() => setActiveTab('profile')}
          style={activeTab === 'profile' ? s.navItemActive : s.navItem}
        >
          <IconProfile /> Perfil
        </div>
      </div>
    </div>
  );
}
