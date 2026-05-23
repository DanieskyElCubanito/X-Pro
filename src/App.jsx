import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { FingerprintJS } from '@fingerprintjs/fingerprintjs';
import toast, { Toaster } from 'react-hot-toast'; 
import { s } from './styles/appStyles';
import { botApi } from './api/botApi';

// Subcomponentes importados
import ProfileHeader from './components/ProfileHeader';
import HomeTab from './components/HomeTab';
import WithdrawView from './components/WithdrawView';
import HistoryView from './components/HistoryView';
import MissionsTab from './components/MissionsTab';
import ShareTab from './components/ShareTab';
import BottomNav from './components/BottomNav';
import ChannelJoin from './components/ChannelJoin';
import CaptchaVerification from './components/CaptchaVerification';

function App() {
  // Estados de navegación y usuario
  const [status, setStatus] = useState('loading'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [view, setView] = useState('main');
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ n1: 0, c1: "0.000", n2: 0, c2: "0.000", n3: 0, c3: "0.000" });

  // Estados de seguridad y validación
  const [mustJoin, setMustJoin] = useState(false);
  const [channelStatus, setChannelStatus] = useState({ c1: true, c2: true });
  const [isHuman, setIsHuman] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados de retiros e historial
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('0.25');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [history, setHistory] = useState([]); 
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Estados de misiones
  const [openedApps, setOpenedApps] = useState({ 'Nex Legends': false, gmail: false });
  const initialized = useRef(false);

  // --- LÓGICA DE VERIFICACIÓN Y HUELLA DIGITAL ---
  const verifyUser = async (user, startParam) => {
    try {
      // 1. Generamos la huella digital local del dispositivo
      const fp = await fpPromise.load();
      const result = await fp.get();
      const deviceId = result.visitorId;

      // 2. Enviamos el user, el referido y la huella digital al backend
      const data = await botApi.verifyUser(user, startParam, deviceId);
      
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
        setErrorMessage(data.message || "Tu cuenta no pudo ser verificada.");
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "Error de conexión.");
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

  // --- LÓGICA DE HISTORIAL ---
  const fetchHistory = async () => {
    if (!userData?.id) return;
    setLoadingHistory(true);
    try {
      const res = await botApi.getHistory(userData.id);
      if (res.success) setHistory(res.history);
    } catch (e) {
      console.error("Error cargando historial");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (view === 'history') fetchHistory();
  }, [view]);

  // --- LÓGICA DE RETIROS ---
  const handleWithdraw = async () => {
    if (!withdrawAddress.trim()) return toast.error("Ingresa tu dirección TON");
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 0.25) return toast.error("El mínimo es 0.25 TON");
    if (amount > (userData?.balance || 0)) return toast.error("Saldo insuficiente");

    const tid = toast.loading("Procesando en la Blockchain...");
    setIsWithdrawing(true);
    try {
      const res = await botApi.withdraw(userData.id, withdrawAddress.trim(), amount);
      if (res.success) {
        setUserData(prev => ({ ...prev, balance: prev.balance - amount }));
        toast.success("¡Retiro exitoso y enviado!", { id: tid });
        setWithdrawAddress(''); 
        setTimeout(() => setView('main'), 2000); 
      }
    } catch (e) {
      toast.error(`Fallo: ${e.response?.data?.error || e.message}`, { id: tid });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // --- LÓGICA DE MISIONES Y COMPARTIR ---
  const handleShare = () => {
    const inviteLink = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = "¡Gana TON gratis con esta App! 💎";
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
          balance: res.newBalance,
          missions_completed: [...(prev.missions_completed || []), missionId] 
        }));
        toast.success("¡Misión completada! +0.001 TON", { id: tid });
      }
    } catch (e) {
      toast.error(e.message || "Error al verificar", { id: tid });
    }
  };

  // --- RENDERIZADO CONDICIONAL ---
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

  // Intercepciones de flujo
  if (mustJoin) return <ChannelJoin channelStatus={channelStatus} setChannelStatus={setChannelStatus} userData={userData} setMustJoin={setMustJoin} />;
  if (!isHuman && status === 'member') return <CaptchaVerification userData={userData} setIsHuman={setIsHuman} />;

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div style={s.container}>
      <Toaster position="top-center" reverseOrder={false} />

      <div style={s.main}>
        <ProfileHeader userData={userData} />

        {activeTab === 'home' && (
          <div className="fade-in">
            {view === 'main' && <HomeTab userData={userData} setView={setView} setUserData={setUserData} />}
            {view === 'withdraw' && (
              <WithdrawView 
                withdrawAddress={withdrawAddress} setWithdrawAddress={setWithdrawAddress}
                withdrawAmount={withdrawAmount} setWithdrawAmount={setWithdrawAmount}
                isWithdrawing={isWithdrawing} handleWithdraw={handleWithdraw} setView={setView} 
              />
            )}
            {view === 'history' && <HistoryView history={history} loadingHistory={loadingHistory} setView={setView} />}
          </div>
        )}

        {activeTab === 'missions' && (
          <MissionsTab 
            userData={userData} openedApps={openedApps} 
            handleOpenApp={handleOpenApp} handleClaimMission={handleClaimMission} 
          />
        )}

        {activeTab === 'share' && (
          <ShareTab stats={stats} handleShare={handleShare} userId={userData?.id} totalReferralEarnings={userData?.ganancias_referidos} />
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} setView={setView} />
    </div>
  );
}

export default App;