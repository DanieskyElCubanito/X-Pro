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

export default function App() {
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('home');
  const [portfolioMode, setPortfolioMode] = useState('deposit');
  const [userData, setUserData] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [transactions] = useState([
    { type: 'DEPOSIT', title: 'Depósito USDT', date: 'Hoy, 10:00 AM', amount: '50.00' },
    { type: 'YIELD', title: 'Rendimiento Diario', date: 'Ayer, 09:15 AM', amount: '2.50' }
  ]);

  const currentUserId = WebApp.initDataUnsafe?.user?.id || 8968109534;

  const verifyUser = useCallback(async (user) => {
    try {
      const data = await botApi.verifyUser(user);
      if (data && data.success) {
        setUserData({
          ...data.user,
          id: currentUserId,
          photo_url: WebApp.initDataUnsafe?.user?.photo_url || 'https://via.placeholder.com/100'
        });
        setActivePlans(data.plans || []);
        setStatus('member');
      } else {
        setUserData({ id: currentUserId, balance: 0 });
        setStatus('member');
      }
    } catch (err) {
      setUserData({ id: currentUserId, balance: 0 });
      setStatus('member');
    }
  }, [currentUserId]);

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      const user = WebApp.initDataUnsafe?.user || { id: 8968109534, username: 'TestUser' };
      verifyUser(user);
    } catch (e) {
      setStatus('error');
    }
  }, [verifyUser]);

  const handleNavigate = (tab, mode = 'deposit') => {
    if (tab === 'portfolio') {
      setPortfolioMode(mode);
    }
    setActiveTab(tab);
  };

  const handleReinvest = async (amountToReinvest) => {
    try {
      if (botApi?.reinvestBalance) {
        await botApi.reinvestBalance({ user_id: userData?.id, amount: amountToReinvest });
      }
      toast.success(`¡$${Number(amountToReinvest).toFixed(2)} USD reinvertidos al 5% diario!`, {
        style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
      });
      verifyUser(WebApp.initDataUnsafe?.user || { id: currentUserId, username: 'TestUser' });
    } catch (e) {
      toast.error('No se pudo completar la reinversión');
    }
  };

  if (status === 'loading') {
    return (
      <div style={s.center}>
        <div style={s.loader}></div>
      </div>
    );
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
                verifyUser(WebApp.initDataUnsafe?.user || { id: currentUserId, username: 'TestUser' })
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
