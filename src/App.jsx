import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import toast, { Toaster } from 'react-hot-toast'; 
import { botApi } from './api/botApi';

// Subcomponentes importados
import ProfileHeader from './components/ProfileHeader';
import HomeTab from './components/HomeTab';
import PublishTab from './components/PublishTab';
import AdsTab from './components/AdsTab';
import ShareTab from './components/ShareTab';
import BottomNav from './components/BottomNav';
import ChannelJoin from './components/ChannelJoin';
import CaptchaVerification from './components/CaptchaVerification';

// Estilos globales Candy Cyberpunk para App
const candyTheme = {
  container: {
    backgroundColor: '#0a0314',
    backgroundImage: 'radial-gradient(circle at 50% 10%, #2b0b47 0%, #0a0314 80%)',
    minHeight: '100vh',
    color: '#ffffff',
    fontFamily: "'Fredoka', 'Quicksand', system-ui, -apple-system, sans-serif",
    paddingBottom: '90px',
    boxSizing: 'border-box'
  },
  main: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '16px 14px'
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0314',
    backgroundImage: 'radial-gradient(circle at center, #260b3f 0%, #0a0314 85%)',
    padding: '24px',
    textAlign: 'center'
  },
  loaderGlow: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: '4px solid rgba(255, 65, 180, 0.2)',
    borderTopColor: '#00f0ff',
    borderRightColor: '#ff1493',
    animation: 'spin 0.9s linear infinite',
    boxShadow: '0 0 25px rgba(0, 240, 255, 0.45)'
  },
  errorCard: {
    background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.9), rgba(20, 8, 38, 0.95))',
    border: '2px solid #ff41b4',
    borderRadius: '24px',
    padding: '28px 20px',
    maxWidth: '340px',
    boxShadow: '0 0 25px rgba(255, 65, 180, 0.35)'
  },
  btnRetry: {
    marginTop: '20px',
    padding: '12px 28px',
    background: 'linear-gradient(180deg, #00f0ff 0%, #0099ff 100%)',
    color: '#050214',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '900',
    fontSize: '14px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    boxShadow: '0 4px 0 #0066aa, 0 8px 18px rgba(0, 240, 255, 0.45)'
  },
  tabPlaceholder: {
    background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.85), rgba(20, 8, 38, 0.95))',
    border: '2px solid #8a2be2',
    borderRadius: '24px',
    padding: '30px 20px',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(138, 43, 226, 0.3)'
  }
};

function App() {
  const [status, setStatus] = useState('loading'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ n1: 0, c1: "0.000" });

  const [mustJoin, setMustJoin] = useState(false);
  const [channelStatus, setChannelStatus] = useState({ c1: true, c2: true });
  const [isHuman, setIsHuman] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const initialized = useRef(false);

  const verifyUser = async (teleUser, startParam) => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const generatedDeviceId = result.visitorId;

      const storedFirstUser = localStorage.getItem('xpro_linked_user');

      let previousAccount = null;
      if (!storedFirstUser) {
        localStorage.setItem('xpro_linked_user', String(teleUser.id));
      } else if (storedFirstUser !== String(teleUser.id)) {
        previousAccount = storedFirstUser;
      }

      const userPayload = {
        ...teleUser,
        deviceId: generatedDeviceId, 
        previousAccountDetected: previousAccount
      };

      const data = await botApi.verifyUser(userPayload, startParam);

      if (data && data.success && data.user) {
        setUserData(data.user);
        setStats(data.stats || { n1: 0, c1: "0.000" });

        let needsToJoin = false;
        if (data.channels) {
          setChannelStatus(data.channels);
          if (data.channels.c1 === false || data.channels.c2 === false) needsToJoin = true;
        } 

        setMustJoin(needsToJoin || data.mustJoin === true); 
        setStatus('member');
        if (data.user?.is_human) setIsHuman(true);
      } else {
        setErrorMessage(data?.message || data?.error || "Error al verificar la cuenta.");
        setStatus('error');
      }
    } catch (err) {
      const serverError = err.response?.data?.error || err.response?.data?.message || err.message;
      setErrorMessage(serverError || "Error de conexión de seguridad.");
      setStatus('error');
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    const initTimer = setTimeout(() => {
      try {
        WebApp.ready(); 
        WebApp.expand();
        const user = WebApp.initDataUnsafe?.user;
        const inviterId = WebApp.initDataUnsafe?.start_param;

        if (!user) {
          setErrorMessage("Debes abrir la app desde Telegram.");
          setStatus('error');
          return;
        }
        initialized.current = true;
        verifyUser(user, inviterId);
      } catch (e) {
        setErrorMessage("Error al iniciar el SDK de Telegram.");
        setStatus('error');
      }
    }, 150);
    return () => clearTimeout(initTimer);
  }, []);

  const handleShare = () => {
    const inviteLink = `https://t.me/ReffRobot/app?startapp=${userData?.id}`;
    const text = "🍬 ¡Entra al juego, publica en grupos y gana Puntos (PT) gratis! 🚀";
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`);
  };

  // PANTALLA DE CARGA (Loader Neón)
  if (status === 'loading') {
    return (
      <div style={candyTheme.center}>
        <style>{`
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `}</style>
        <div style={candyTheme.loaderGlow}></div>
        <p style={{ marginTop: '22px', fontSize: '15px', fontWeight: '900', color: '#ff66cc', letterSpacing: '1px' }}>
          CARGANDO MUNDO CANDY...
        </p>
      </div>
    );
  }

  // PANTALLA DE ERROR
  if (status === 'error') {
    return (
      <div style={candyTheme.center}>
        <div style={candyTheme.errorCard}>
          <div style={{ fontSize: '42px', marginBottom: '8px' }}>⚠️</div>
          <h2 style={{ color: '#ffe600', margin: '0 0 10px 0', fontSize: '20px', fontWeight: '900' }}>
            Acceso Interrumpido
          </h2>
          <p style={{ color: '#ff99dd', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
            {errorMessage}
          </p>
          <button style={candyTheme.btnRetry} onClick={() => window.location.reload()}>
            🔄 REINTENTAR
          </button>
        </div>
      </div>
    );
  }

  if (mustJoin) return <ChannelJoin channelStatus={channelStatus} setChannelStatus={setChannelStatus} userData={userData} setMustJoin={setMustJoin} />;
  if (!isHuman && status === 'member') return <CaptchaVerification userData={userData} setIsHuman={setIsHuman} />;

  return (
    <div style={candyTheme.container}>
      {/* Notificaciones Toaster con estilo Candy */}
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1d0833',
            color: '#fff',
            border: '2px solid #00f0ff',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
            fontWeight: '800',
            fontSize: '13px'
          }
        }} 
      />

      <div style={candyTheme.main}>
        <ProfileHeader userData={userData} />

        {/* 1. INICIO */}
        {activeTab === 'home' && (
          <div className="fade-in">
            <HomeTab userData={userData} setUserData={setUserData} />
          </div>
        )}

        {/* 2. TAREAS / ANUNCIOS */}
        {activeTab === 'tasks' && (
          <div className="fade-in">
            <AdsTab userData={userData} setUserData={setUserData} />
          </div>
        )}

        {/* 3. PUBLICAR */}
        {activeTab === 'publish' && (
          <div className="fade-in">
            <PublishTab userData={userData} setUserData={setUserData} />
          </div>
        )}

        {/* 4. TOP RANKING */}
        {activeTab === 'top' && (
          <div className="fade-in" style={candyTheme.tabPlaceholder}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '900', color: '#ffe600' }}>
              Torneo Semanal
            </h3>
            <p style={{ fontSize: '13px', color: '#ff99dd', margin: 0 }}>
              La tabla de clasificaciones cósmicas estará disponible muy pronto.
            </p>
          </div>
        )}

        {/* 5. REFERIDOS */}
        {activeTab === 'referrals' && (
          <div className="fade-in">
            <ShareTab 
              stats={stats} 
              handleShare={handleShare} 
              userId={userData?.id} 
              totalReferralEarnings={userData?.referral_earnings} 
            />
          </div>
        )}
      </div>

      {/* Barra de navegación inferior */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
