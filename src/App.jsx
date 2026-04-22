import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { s } from './styles/appStyles';
import { botApi } from './api'; 
import toast, { Toaster } from 'react-hot-toast'; 

// Componentes modulares
import MissionsTab from './components/MissionsTab';
import ShareTab from './components/ShareTab';

function App() {
  /* --- [ ESTADOS GENERALES ] --- */
  const [status, setStatus] = useState('loading'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [errorInfo, setErrorInfo] = useState('');
  const [stats, setStats] = useState({ n1: 0, n2: 0, n3: 0, c1: "0.000", c2: "0.000", c3: "0.000" });

  /* --- [ ESTADOS DE RETIRO ] --- */
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState(0.1);
  const [isSending, setIsSending] = useState(false);

  /* --- [ ESTADOS DE ADS ] --- */
  const [adsWatchedCount, setAdsWatchedCount] = useState(0); 
  const [isAdLoading, setIsAdLoading] = useState(false);

  const WITHDRAW_LIMITS = { min: 0.1, maxDaily: 1.0 };

  /* --- [ LÓGICA DE INICIO ] --- */
  const verifyUser = async (user, startParam) => {
    console.log("Intentando verificar usuario:", user); 
    try {
      const data = await botApi.verifyUser(user, startParam);
      if (data.success) {
        setUserData(data.user);
        setStats(data.stats);

        const savedAds = data.user?.ads_watched ?? 0;
        setAdsWatchedCount(Number(savedAds));

        setStatus('member');
      } else {
        const isGuest = data.error === 'NOT_MEMBER' || data.error === 'PROXY_DETECTED';
        setStatus(isGuest ? 'guest' : 'error');
        setErrorInfo(data.message || 'Acceso no autorizado.');
      }
    } catch (err) {
      console.error("Error detallado:", err);
      
      // Forzamos a que el error se convierta en texto real
      const serverError = err.response?.data;
      const errorMsg = typeof serverError === 'object' 
        ? JSON.stringify(serverError) 
        : (err.response?.data?.error || err.message);
      
      setStatus('error');
      setErrorInfo(`[Error ${err.response?.status || 'Red'}] ${errorMsg}`);
    }
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    
    // Intentar obtener el usuario de Telegram
    const user = WebApp.initDataUnsafe?.user;
    
    if (!user) {
      // Si entras por navegador normal, esto fallará.
      setStatus('error');
      setErrorInfo('Por favor, abre la app desde Telegram (User no detectado).');
      return;
    }
    
    verifyUser(user, WebApp.initDataUnsafe?.start_param);
  }, []);

  /* --- [ MANEJADORES ] --- */
  const handleWatchAd = () => {
    if (isAdLoading || typeof window.showGiga !== 'function') {
        if (typeof window.showGiga !== 'function') toast.error("Anuncios no disponibles");
        return;
    }

    setIsAdLoading(true);
    window.showGiga().then(async () => {
      try {
        const res = await botApi.adReward(userData.id);
        if (res.success) {
            setAdsWatchedCount(res.newAdsCount); 
            setUserData(prev => ({ ...prev, balance: res.newBalance }));
            WebApp.HapticFeedback.notificationOccurred('success');
            toast.success("¡Anuncio cobrado con éxito!");
        } else {
            toast.error(res.error || "Error al procesar el premio");
        }
      } catch (e) {
        toast.error("Error de conexión");
      } finally {
        setIsAdLoading(false);
      }
    }).catch((err) => {
      setIsAdLoading(false);
    });
  };

  const processWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAddress.startsWith('U') && !withdrawAddress.startsWith('E')) {
      return toast.error("Dirección TON inválida");
    }
    if (isNaN(amount) || amount < WITHDRAW_LIMITS.min) {
      return toast.error(`Mínimo ${WITHDRAW_LIMITS.min} TON`);
    }
    if (amount > (userData?.balance || 0)) {
      return toast.error("Saldo insuficiente");
    }

    setIsSending(true);
    const toastId = toast.loading("Procesando retiro...");
    try {
      const data = await botApi.withdraw(userData.id, withdrawAddress, amount);
      if (data.success) {
        setUserData(prev => ({ ...prev, balance: prev.balance - amount }));
        setIsWithdrawing(false);
        toast.success("Retiro enviado", { id: toastId });
      } else {
        toast.error(data.error || 'Error', { id: toastId });
      }
    } catch (e) {
      toast.error("Error de conexión", { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  const handleShare = () => {
    const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=¡Gana TON gratis!`);
  };

  /* --- [ RENDERIZADO ] --- */

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;

  if (status === 'error' || status === 'guest') {
    return (
      <div style={s.center}>
        <h2 style={{color: '#ff4444', fontSize: '20px'}}>{status === 'guest' ? 'ACCESO BLOQUEADO' : 'ERROR DE CONEXIÓN'}</h2>
        <p style={{...s.errorText, marginBottom: '20px', padding: '0 20px', fontSize: '14px'}}>{errorInfo}</p>
        <button style={s.btnWhite} onClick={() => window.location.reload()}>REINTENTAR</button>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1a1a1a', color: '#fff', borderRadius: '12px', border: '1px solid #333' }
      }} />

      <div style={s.main}>
        {isWithdrawing ? (
          <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <span style={{ fontSize: '40px' }}>💸</span>
              <h3 style={{ color: '#fff', margin: '15px 0' }}>Solicitar Retiro</h3>
            </div>

            <div style={s.withdrawContainer}>
              <div style={s.inputGroup}>
                <label style={s.label}>Dirección TON:</label>
                <input style={s.input} value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="UQ..." />
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Monto:</label>
                <input style={s.input} type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
              </div>
              <button style={s.btnGreen} onClick={processWithdraw} disabled={isSending}>
                {isSending ? 'PROCESANDO...' : 'CONFIRMAR'}
              </button>
              <button style={s.btnOutline} onClick={() => setIsWithdrawing(false)}>CANCELAR</button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <div className="fade-in">
                <div style={s.cardBalance}>
                   <p style={{fontSize:'12px', fontWeight:'bold'}}>SALDO DISPONIBLE</p>
                   <h1 style={{fontSize:'38px', margin:'10px 0'}}>
                     {Number(userData?.balance || 0).toFixed(5)} <span style={{fontSize:'16px'}}>TON</span>
                   </h1>
                   <button style={s.btnWhite} onClick={() => setIsWithdrawing(true)}>RETIRO</button>
                </div>
              </div>
            )}
            {activeTab === 'share' && <ShareTab stats={stats} handleShare={handleShare} />}
            {activeTab === 'missions' && (
              <MissionsTab adsWatchedCount={adsWatchedCount} isAdLoading={isAdLoading} handleWatchAd={handleWatchAd} />
            )}
          </>
        )}
      </div>

      {!isWithdrawing && (
        <div style={s.bottomNav}>
          <div onClick={() => setActiveTab('home')} style={activeTab === 'home' ? s.navItemActive : s.navItem}>
             <span>🏠</span><span>Home</span>
          </div>
          <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>
             <span>👥</span><span>Red</span>
          </div>
          <div onClick={() => setActiveTab('missions')} style={activeTab === 'missions' ? s.navItemActive : s.navItem}>
             <span>🎥</span><span>Ads</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
