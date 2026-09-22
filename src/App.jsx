import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import toast, { Toaster } from 'react-hot-toast'; 
import { s } from './styles/appStyles.js'; 
import { botApi } from './api/botApi';

// Subcomponentes importados
import ProfileHeader from './components/ProfileHeader';
import HomeTab from './components/HomeTab';
import MissionsTab from './components/MissionsTab';
import ShareTab from './components/ShareTab';
import BottomNav from './components/BottomNav';
import ChannelJoin from './components/ChannelJoin';
import CaptchaVerification from './components/CaptchaVerification';

function App() {
  // Estados de navegación y usuario
  const [status, setStatus] = useState('loading'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ n1: 0, c1: "0.000", n2: 0, c2: "0.000", n3: 0, c3: "0.000" });

  // Estados de seguridad y validación
  const [mustJoin, setMustJoin] = useState(false);
  const [channelStatus, setChannelStatus] = useState({ c1: true, c2: true });
  const [isHuman, setIsHuman] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados de misiones
  const [openedApps, setOpenedApps] = useState({ 'Nex Legends': false, gmail: false });
  const initialized = useRef(false);

  // --- LÓGICA DE VERIFICACIÓN Y HUELLA DIGITAL ---
  const verifyUser = async (teleUser, startParam) => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const generatedDeviceId = result.visitorId;

      const storedUserId = localStorage.getItem('xpro_linked_user');
      const previousAccount = storedUserId && storedUserId !== String(teleUser.id) ? storedUserId : null;

      localStorage.setItem('xpro_linked_user', String(teleUser.id));

      const userPayload = {
        ...teleUser,
        deviceId: generatedDeviceId, 
        previousAccountDetected: previousAccount
      };

      const data = await botApi.verifyUser(userPayload, startParam);

      if (data.success) {
        setUserData(data.user);
        setStats(data.stats);

        let needsToJoin = false;
        if (data.channels) {
          setChannelStatus(data.channels);
          if (data.channels.c1 === false || data.channels.c2 === false) needsToJoin = true;
        } 

        setMustJoin(needsToJoin || data.mustJoin === true); 
        setStatus('member');
        if (data.user.is_human) setIsHuman(true);
      } else {
        setErrorMessage(data.message || data.error || "Tu cuenta ha sido restringida por seguridad.");
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

  // --- LÓGICA DE MISIONES Y COMPARTIR ---
  const handleShare = () => {
    const inviteLink = `https://t.me/Xokpro_Bot/app?startapp=${userData?.id}`;
    const text = "🚀 ¡Únete, completa misiones y acumula Puntos (PT)! 🪙";
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`);
  };

  const handleOpenApp = (missionId, url) => {
    WebApp.openTelegramLink(url);
    setOpenedApps(prev => ({ ...prev, [missionId]: true }));
  };

  const handleClaimMission = async (missionId) => {
    if (!openedApps[missionId]) return toast.error("Debes abrir la app primero.");
    const tid = toast.loading("Verificando misión...");
    try {
      const res = await botApi.claimMission(userData.id, missionId);
      if (res.success) {
        setUserData(prev => ({ 
          ...prev, 
          points: res.newPoints || prev.points,
          missions_completed: [...(prev.missions_completed || []), missionId] 
        }));
        toast.success("¡Misión completada!", { id: tid });
      }
    } catch (e) {
      toast.error(e.message || "Error al verificar", { id: tid });
    }
  };

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;
  if (status === 'error') {
    return (
      <div style={s.center}>
        <h2 style={{color: '#ffcc00'}}>⚠️ Error de acceso</h2>
        <p style={{color: '#fff'}}>{errorMessage}</p>
        <button style={{...s.btnOutline, marginTop: '20px', fontSize: '12px'}} onClick={() => window.location.reload()}>🔄 REINTENTAR</button>
      </div>
    );
  }

  if (mustJoin) return <ChannelJoin channelStatus={channelStatus} setChannelStatus={setChannelStatus} userData={userData} setMustJoin={setMustJoin} />;
  if (!isHuman && status === 'member') return <CaptchaVerification userData={userData} setIsHuman={setIsHuman} />;

  return (
    <div style={s.container}>
      <Toaster position="top-center" reverseOrder={false} />

      <div style={s.main}>
        <ProfileHeader userData={userData} />

        {activeTab === 'home' && (
          <div className="fade-in">
            <HomeTab userData={userData} setUserData={setUserData} />
          </div>
        )}

        {activeTab === 'missions' && (
          <MissionsTab 
            userData={userData} 
            openedApps={openedApps} 
            handleOpenApp={handleOpenApp} 
            handleClaimMission={handleClaimMission} 
          />
        )}

        {activeTab === 'share' && (
          <ShareTab 
            stats={stats} 
            handleShare={handleShare} 
            userId={userData?.id} 
            totalReferralEarnings={userData?.ganancias_referidos} 
          />
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
