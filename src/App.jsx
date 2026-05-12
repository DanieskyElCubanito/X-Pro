import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { s } from './styles/appStyles';
import { botApi } from './api/botApi';
import toast, { Toaster } from 'react-hot-toast'; 
import ShareTab from './components/ShareTab';

function App() {
  const [status, setStatus] = useState('loading'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ n1: 0, c1: "0.000", n2: 0, c2: "0.000", n3: 0, c3: "0.000" });
  const [view, setView] = useState('main');

  const [mustJoin, setMustJoin] = useState(false);
  const [channelStatus, setChannelStatus] = useState({ c1: true, c2: true });

  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('0.01');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [history, setHistory] = useState([]); 
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // --- ESTADOS DE MISIONES Y DAILY ---
  const [openedApps, setOpenedApps] = useState({ tickbit: false, gmail: false });
  const [hasSharedDaily, setHasSharedDaily] = useState(false);

  const [captchaTarget, setCaptchaTarget] = useState(null);
  const [captchaOptions, setCaptchaOptions] = useState([]);
  const initialized = useRef(false);

  const initCaptcha = () => {
    const items = [
      { icon: '🍎', name: 'la Manzana' }, { icon: '🚗', name: 'el Auto' },
      { icon: '🐶', name: 'el Perro' }, { icon: '🚀', name: 'el Cohete' },
      { icon: '🍕', name: 'la Pizza' }, { icon: '⚽', name: 'el Balón' }
    ];
    const shuffled = items.sort(() => 0.5 - Math.random());
    const selectedOptions = shuffled.slice(0, 4);
    setCaptchaOptions(selectedOptions);
    setCaptchaTarget(selectedOptions[Math.floor(Math.random() * selectedOptions.length)]);
  };

  useEffect(() => {
    if (!isHuman && status === 'member' && !captchaTarget) {
      initCaptcha();
    }
  }, [isHuman, status, captchaTarget]);

  const verifyUser = async (user, startParam) => {
    try {
      const data = await botApi.verifyUser(user, startParam);
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
        setErrorMessage(data.message || "Error de verificación.");
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage("Error de conexión.");
      setStatus('error');
    }
  };

  const handleCheckChannels = async () => {
    const tid = toast.loading("Verificando...");
    try {
      const res = await botApi.checkChannels(userData.id);
      if (res.allJoined) {
        setMustJoin(false);
        toast.success("¡Acceso concedido!", { id: tid });
      } else {
        setChannelStatus({ c1: res.channel1, c2: res.channel2 });
        toast.error("Aún faltan canales", { id: tid });
      }
    } catch (e) {
      toast.error("Error al verificar", { id: tid });
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
          setErrorMessage("Abre desde Telegram.");
          setStatus('error');
          return;
        }
        initialized.current = true;
        verifyUser(user, inviterId);
      } catch (e) {
        setStatus('error');
      }
    }, 150);
    return () => clearTimeout(initTimer);
  }, []);

  const handleBonus = async () => {
    const tid = toast.loading("Reclamando...");
    try {
      const res = await botApi.claimBonus(userData.id);
      if (res.success) {
        setUserData(prev => ({ ...prev, balance: res.newBalance }));
        toast.success("¡Bono recibido!", { id: tid });
      }
    } catch (e) {
      toast.error("Error al reclamar", { id: tid });
    }
  };

  const handleShare = () => {
    const inviteLink = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = "¡Gana TON gratis con esta App! 💎";
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    WebApp.openTelegramLink(fullUrl);
    setHasSharedDaily(true); // Habilitamos el botón de reclamar daily
  };

  const handleClaimDaily = async () => {
    if (!hasSharedDaily) return toast.error("Comparte primero el enlace");
    const tid = toast.loading("Procesando daily...");
    try {
      const res = await botApi.claimMission(userData.id, 'daily_check');
      if (res.success) {
        setUserData(prev => ({ ...prev, balance: res.newBalance, daily_claimed: true }));
        toast.success("¡Daily Check completado! +0.001 TON", { id: tid });
      }
    } catch (e) {
      toast.error(e.response?.data?.error || "Error", { id: tid });
    }
  };

  const handleOpenApp = (id, url) => {
    WebApp.openTelegramLink(url);
    setOpenedApps(prev => ({ ...prev, [id]: true }));
  };

  const handleClaimMission = async (id) => {
    if (!openedApps[id]) return toast.error("Debes abrir la app primero");
    const tid = toast.loading("Verificando...");
    try {
      const res = await botApi.claimMission(userData.id, id);
      if (res.success) {
        setUserData(prev => ({ 
          ...prev, 
          balance: res.newBalance,
          missions_completed: [...(prev.missions_completed || []), id] 
        }));
        toast.success("¡Misión completada! +0.001 TON", { id: tid });
      }
    } catch (e) {
      toast.error(e.response?.data?.error || "Error", { id: tid });
    }
  };

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;

  return (
    <div style={s.container}>
      <Toaster position="top-center" />
      <div style={s.main}>
        
        {/* HEADER */}
        <div style={s.profileHeader}>
          <img src={WebApp.initDataUnsafe?.user?.photo_url || 'https://via.placeholder.com/100'} style={s.profileAvatar} alt="avatar" />
          <div>
            <p style={s.profileName}>{userData?.username || 'Usuario'}</p>
            <p style={s.profileId}>ID: {userData?.id}</p>
          </div>
        </div>

        {/* TAB: HOME */}
        {activeTab === 'home' && (
          <div className="fade-in">
            <div style={s.cardBalance}>
              <p style={{fontSize:'12px', fontWeight:'bold', opacity:0.8}}>SALDO DISPONIBLE</p>
              <h1 style={{fontSize:'42px', margin:'10px 0', fontWeight:'900'}}>
                {Number(userData?.balance || 0).toFixed(4)} <span style={{fontSize:'18px'}}>TON</span>
              </h1>
            </div>

            <div style={s.actionGrid}>
              <div style={s.actionCard} onClick={() => setView('withdraw')}>💸 RETIRO</div>
              <div style={s.actionCard} onClick={handleBonus}>🎁 BONO</div>
              <div style={s.actionCard} onClick={() => setView('history')}>📜 LOGS</div>
            </div>

            {/* CHECK DAILY */}
            <div style={{...s.card, marginTop:'20px', border:'1px solid #ffcc00', backgroundColor:'rgba(255,204,0,0.05)'}}>
              <h4 style={{margin:'0 0 10px 0', color:'#ffcc00'}}>🌟 Check Daily</h4>
              <p style={{fontSize:'12px', color:'#888', marginBottom:'15px'}}>Comparte con un amigo o grupo para reclamar.</p>
              {userData?.daily_claimed ? (
                <button style={{...s.btnGreen, opacity:0.5}} disabled>COMPLETADO HOY</button>
              ) : (
                <div style={{display:'flex', gap:'10px'}}>
                  <button style={{...s.btnOutline, flex:1, fontSize:'12px'}} onClick={handleShare}>1. COMPARTIR</button>
                  <button 
                    style={{...s.btnGreen, flex:1, fontSize:'12px', opacity: hasSharedDaily ? 1 : 0.5}} 
                    onClick={handleClaimDaily}
                  >
                    2. RECLAMAR
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MISIONES */}
        {activeTab === 'missions' && (
          <div className="fade-in">
            <h3 style={{marginBottom:'20px', textAlign:'center'}}>Misiones Disponibles</h3>
            
            {/* MISIÓN 1: TICKBIT */}
            <div style={{...s.card, marginBottom:'15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <p style={{margin:0, fontWeight:'bold'}}>TickBit App</p>
                <p style={{margin:0, fontSize:'12px', color:'#00ccff'}}>+0.001 TON</p>
              </div>
              <div style={{display:'flex', gap:'5px'}}>
                {userData?.missions_completed?.includes('tickbit') ? (
                  <span style={{color:'#28a745'}}>✅</span>
                ) : (
                  <>
                    <button style={{...s.btnOutline, padding:'5px 10px', fontSize:'11px'}} onClick={() => handleOpenApp('tickbit', 'https://t.me/TickBitEarn_bot?start=ref_7517815832')}>ABRIR</button>
                    <button style={{...s.btnGreen, padding:'5px 10px', fontSize:'11px', opacity: openedApps.tickbit ? 1 : 0.5}} onClick={() => handleClaimMission('tickbit')}>RECLAMAR</button>
                  </>
                )}
              </div>
            </div>

            {/* MISIÓN 2: GMAIL FARMER */}
            <div style={{...s.card, marginBottom:'15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <p style={{margin:0, fontWeight:'bold'}}>Gmail Farmer</p>
                <p style={{margin:0, fontSize:'12px', color:'#00ccff'}}>+0.001 TON</p>
              </div>
              <div style={{display:'flex', gap:'5px'}}>
                {userData?.missions_completed?.includes('gmail') ? (
                  <span style={{color:'#28a745'}}>✅</span>
                ) : (
                  <>
                    <button style={{...s.btnOutline, padding:'5px 10px', fontSize:'11px'}} onClick={() => handleOpenApp('gmail', 'https://t.me/GmailFarmerBot?start=7517815832')}>ABRIR</button>
                    <button style={{...s.btnGreen, padding:'5px 10px', fontSize:'11px', opacity: openedApps.gmail ? 1 : 0.5}} onClick={() => handleClaimMission('gmail')}>RECLAMAR</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: AMIGOS */}
        {activeTab === 'share' && <ShareTab stats={stats} handleShare={handleShare} />}
      </div>

      {/* NAVEGACIÓN INFERIOR */}
      <div style={s.bottomNav}>
        <div onClick={() => setActiveTab('home')} style={activeTab === 'home' ? s.navItemActive : s.navItem}>
           <span>🏠</span><span style={{fontSize:'10px'}}>HOME</span>
        </div>
        <div onClick={() => setActiveTab('missions')} style={activeTab === 'missions' ? s.navItemActive : s.navItem}>
           <span>🎯</span><span style={{fontSize:'10px'}}>MISIONES</span>
        </div>
        <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>
           <span>👥</span><span style={{fontSize:'10px'}}>AMIGOS</span>
        </div>
      </div>
    </div>
  );
}

export default App;