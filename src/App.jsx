 import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import toast, { Toaster } from 'react-hot-toast';  
 
// Archivos de la app (Asegúrate de renombrar/crear estos componentes)
import { botApi } from './api/botApi';
import { translations } from './translations'; 

import ProfileHeader from './components/ProfileHeader';
import HomeTab from './components/HomeTab';        // "Home"
import GoodsTab from './components/GoodsTab';      // "Goods" (Antes Ads/Publish)
import TeamTab from './components/TeamTab';        // "Team" (Antes ShareTab)
import EarnTab from './components/EarnTab';        // "Earn" (Antes AdsTab)
import UserTab from './components/UserTab';        // "User" (Perfil completo)
import BottomNav from './components/BottomNav';
import AdminDashboard from './components/AdminDashboard';

const neonTheme = {
  container: { 
    backgroundColor: '#05010d', 
    backgroundImage: 'radial-gradient(circle at 50% 10%, #1e053a 0%, #05010d 80%)', 
    minHeight: '100vh', height: 'var(--tg-viewport-height, 100vh)', 
    color: '#ffffff', fontFamily: "'Quicksand', system-ui, -apple-system, sans-serif", 
    display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden'
  },
  main: { 
    flex: 1, maxWidth: '520px', margin: '0 auto', width: '100%', 
    padding: '16px 16px 110px 16px', boxSizing: 'border-box', 
    overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    scrollBehavior: 'smooth'
  },
  center: { 
    minHeight: '100vh', display: 'flex', flexDirection: 'column', 
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#05010d', 
    backgroundImage: 'radial-gradient(circle at center, #1b0730 0%, #05010d 85%)', 
    padding: '24px', textAlign: 'center', boxSizing: 'border-box' 
  },
  loaderGlow: { 
    width: '60px', height: '60px', borderRadius: '50%', 
    border: '4px solid rgba(0, 240, 255, 0.1)', borderTopColor: '#00f0ff', 
    borderRightColor: '#ff1493', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite', 
    boxShadow: '0 0 30px rgba(0, 240, 255, 0.6), inset 0 0 20px rgba(255, 20, 147, 0.4)' 
  },
  errorCard: { 
    background: 'linear-gradient(145deg, rgba(20, 5, 40, 0.9), rgba(10, 2, 20, 0.95))', 
    border: '2px solid #ff1493', borderRadius: '24px', padding: '30px 20px', 
    maxWidth: '340px', boxShadow: '0 0 35px rgba(255, 20, 147, 0.4)',
    transform: 'translateY(0)', animation: 'float 3s ease-in-out infinite'
  },
  btnRetry: { 
    marginTop: '24px', padding: '14px 32px', background: 'linear-gradient(90deg, #ff1493, #8a2be2)', 
    color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px', 
    letterSpacing: '1px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(255, 20, 147, 0.5)',
    transition: 'transform 0.2s', textTransform: 'uppercase'
  }
};

function App() {
  const [status, setStatus] = useState('loading'); 
  const [activeTab, setActiveTab] = useState('home'); // Tabs: home, goods, team, earn, user, admin
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [lang, setLang] = useState(localStorage.getItem('click_lang') || 'es');
  const initialized = useRef(false);

  const t = (key) => translations[lang]?.[key] || key;

  // 🔥 LÓGICA DE VERIFICACIÓN LIMPIA (Sin FingerprintJS, solo Telegram ID)
  const verifyUser = async (teleUser, startParam) => {
    try {
      const res = await fetch('/api', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-user', user: teleUser, start_param: startParam })
      });
      const data = await res.json();

      if (data && data.success && data.user) {
        setUserData(data.user);
        setStatus('member');
      } else {
        setErrorMessage(data?.message || data?.error || t('access_denied'));
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage(t('connection_error') || "Error de conexión");
      setStatus('error');
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    const initTimer = setTimeout(() => {
      try {
        WebApp.ready(); WebApp.expand();
        WebApp.setHeaderColor('#05010d');
        WebApp.setBackgroundColor('#05010d');
        if (WebApp.disableVerticalSwipes) WebApp.disableVerticalSwipes();
        
        const user = WebApp.initDataUnsafe?.user;
        const initData = WebApp.initData;
        const inviterId = WebApp.initDataUnsafe?.start_param;

        if (!localStorage.getItem('click_lang') && user?.language_code) {
          const detectedLang = user.language_code.startsWith('es') ? 'es' : 'en';
          setLang(detectedLang);
          localStorage.setItem('click_lang', detectedLang);
        }

        // 🔥 En entorno de desarrollo (fuera de TG), creamos un usuario de prueba
        if (!user || !initData) { 
           console.warn("Ejecutando en navegador: Usando usuario de prueba.");
           const mockUser = { id: "999999", username: "DevTester", language_code: "es" };
           verifyUser(mockUser, null);
           initialized.current = true;
           return;
        }

        initialized.current = true;
        verifyUser(user, inviterId);
      } catch (e) { setErrorMessage("Error de SDK"); setStatus('error'); }
    }, 150);
    return () => clearTimeout(initTimer);
  }, []);

  if (status === 'loading') {
    return (
      <div style={neonTheme.center}>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }
          @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
          @keyframes pulseText { 0% { opacity: 0.6; text-shadow: 0 0 10px #00f0ff; } 50% { opacity: 1; text-shadow: 0 0 25px #00f0ff; } 100% { opacity: 0.6; text-shadow: 0 0 10px #00f0ff; } }
          .fade-in { animation: fadeIn 0.4s ease-out forwards; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <div style={neonTheme.loaderGlow}></div>
        <p style={{ marginTop: '28px', fontSize: '16px', fontWeight: '900', color: '#00f0ff', letterSpacing: '2px', textTransform: 'uppercase', animation: 'pulseText 2s infinite' }}>
          {t('loading') || "Cargando..."}
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={neonTheme.center}>
        <style>{`@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }`}</style>
        <div style={neonTheme.errorCard}>
          <div style={{ fontSize: '48px', marginBottom: '12px', filter: 'drop-shadow(0 0 15px #ff1493)' }}>⚠️</div>
          <h2 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase' }}>{t('access_interrupted') || "Error de Acceso"}</h2>
          <p style={{ color: '#ff99dd', fontSize: '14px', lineHeight: '1.6', margin: 0, fontWeight: 'bold' }}>{errorMessage}</p>
          <button style={neonTheme.btnRetry} onClick={() => window.location.reload()}>🔄 {t('retry') || "REINTENTAR"}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={neonTheme.container}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#120422', color: '#fff', border: '2px solid #00f0ff', boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)', fontWeight: '900', fontSize: '14px', borderRadius: '16px' } }} />
      
      <div style={neonTheme.main}>
        {/* CABECERA GLOBAL (Muestra saldo y perfil. Si quieres moverla dentro de la pestaña User, quítala de aquí) */}
        {(activeTab !== 'user' && activeTab !== 'admin') && (
          <div className="fade-in" style={{ marginBottom: '20px' }}>
            <ProfileHeader userData={userData} t={t} lang={lang} setLang={setLang} />
          </div>
        )}

        {/* PESTAÑAS (Gamificadas con fade-in) */}
        {activeTab === 'home' && <div className="fade-in"><HomeTab userData={userData} setUserData={setUserData} setActiveTab={setActiveTab} t={t} /></div>}
        {activeTab === 'goods' && <div className="fade-in"><GoodsTab userData={userData} setUserData={setUserData} t={t} /></div>}
        {activeTab === 'team' && <div className="fade-in"><TeamTab userData={userData} t={t} /></div>}
        {activeTab === 'earn' && <div className="fade-in"><EarnTab userData={userData} setUserData={setUserData} t={t} /></div>}
        {activeTab === 'user' && <div className="fade-in"><UserTab userData={userData} t={t} lang={lang} setLang={setLang} /></div>}
        {activeTab === 'admin' && <div className="fade-in"><AdminDashboard userData={userData} t={t} /></div>}
      </div>

      {/* NUEVA BARRA DE NAVEGACIÓN */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} userData={userData} t={t} />
    </div>
  );
}

export default App;
