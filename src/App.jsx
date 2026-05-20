import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { s } from './styles/appStyles';
import { botApi } from './api/botApi';
import toast, { Toaster } from 'react-hot-toast'; 

// Importación de subcomponentes limpios
import ShareTab from './components/ShareTab';
import DailyCheckIn from './components/DailyCheckIn';
import ChannelJoin from './components/ChannelJoin';
import CaptchaVerification from './components/CaptchaVerification';

function App() {
  const [status, setStatus] = useState('loading'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ n1: 0, c1: "0.000", n2: 0, c2: "0.000", n3: 0, c3: "0.000" });
  const [view, setView] = useState('main');

  const [mustJoin, setMustJoin] = useState(false);
  const [channelStatus, setChannelStatus] = useState({ c1: true, c2: true });

  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('0.25');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [history, setHistory] = useState([]); 
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [openedApps, setOpenedApps] = useState({ 'Nex Legends': false, gmail: false });
  const initialized = useRef(false);

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
  console.log("Error detallado:", e); // Esto te dirá qué está pasando realmente
  toast.error(e.message || "Error al verificar", { id: tid });
}
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

  // Intercepciones de flujo usando los nuevos subcomponentes
  if (mustJoin) return <ChannelJoin channelStatus={channelStatus} setChannelStatus={setChannelStatus} userData={userData} setMustJoin={setMustJoin} />;
  if (!isHuman && status === 'member') return <CaptchaVerification userData={userData} setIsHuman={setIsHuman} />;

  const isNexLegendsCompleted = userData?.missions_completed?.includes('Nex Legends');
  const isGmailCompleted = userData?.missions_completed?.includes('gmail');

  return (
    <div style={s.container}>
      <Toaster position="top-center" reverseOrder={false} />

      <div style={s.main}>
        <div style={s.profileHeader}>
          <img src={WebApp.initDataUnsafe?.user?.photo_url || 'https://via.placeholder.com/100'} style={s.profileAvatar} alt="avatar" />
          <div>
            <p style={s.profileName}>{userData?.username || 'Usuario'}</p>
            <p style={s.profileId}>ID: {userData?.id}</p>
          </div>
        </div>

        {activeTab === 'home' && (
          <div className="fade-in">
            {view === 'main' ? (
              <>
                <div style={s.cardBalance}>
                  <p style={{fontSize:'12px', fontWeight:'bold', letterSpacing:'1px', opacity:0.8}}>SALDO DISPONIBLE</p>
                  <h1 style={{fontSize:'42px', margin:'10px 0', fontWeight:'900'}}>
                    {Number(userData?.balance || 0).toFixed(4)} <span style={{fontSize:'18px'}}>TON</span>
                  </h1>
                  <div style={{fontSize:'12px', background:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:'10px', display:'inline-block'}}>Nivel: Usuario Elite ⚡</div>
                </div>

                <div style={{...s.actionGrid, gridTemplateColumns: '1fr 1fr'}}>
                  <div style={s.actionCard} onClick={() => setView('withdraw')}>
                    <span style={{fontSize:'26px', marginBottom:'5px'}}>💸</span>RETIRO
                  </div>
                  <div style={s.actionCard} onClick={() => setView('history')}>
                    <span style={{fontSize:'26px', marginBottom:'5px'}}>📜</span>HISTORIAL
                  </div>
                </div>

                {/* El componente importado */}
                <DailyCheckIn userData={userData} setUserData={setUserData} />
              </>
            ) : view === 'withdraw' ? (
              <div className="fade-in">
                 <h2 style={{textAlign:'center', marginBottom:'20px'}}>Retirar Balance</h2>
                 <p style={s.helpText}>Mínimo de retiro: 0.25 TON. Usa red TON nativa.</p>
                 <input style={s.input} placeholder="Dirección de Wallet TON" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} disabled={isWithdrawing} />
                 <input style={s.input} type="number" placeholder="Monto" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} disabled={isWithdrawing} min="0.25" />
                 <button style={{...s.btnGreen, opacity: isWithdrawing ? 0.6 : 1}} onClick={handleWithdraw} disabled={isWithdrawing}>{isWithdrawing ? "PROCESANDO PAGO..." : "ENVIAR SOLICITUD"}</button>
                 <button style={s.btnOutline} onClick={() => setView('main')} disabled={isWithdrawing}>VOLVER AL INICIO</button>
              </div>
            ) : (
              <div className="fade-in">
                 <h2 style={{textAlign:'center', marginBottom:'20px'}}>Historial de Retiros</h2>
                 {loadingHistory ? (
                   <p style={{textAlign:'center'}}>Cargando transacciones...</p>
                 ) : history.length > 0 ? (
                   <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                     {history.map((tx, index) => (
                       <div key={index} style={{...s.card, marginBottom: '10px', fontSize: '12px'}}>
                          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                            <span style={{color:'#28a745', fontWeight:'bold'}}>+ {tx.amount} TON</span>
                            <span style={{color:'#888'}}>{new Date(tx.created_at).toLocaleDateString()}</span>
                          </div>
                          <p style={{margin:0, color:'#555', wordBreak:'break-all'}}>Wallet: {tx.address}</p>
                          <a href={`https://tonscan.org/tx/${tx.tx_hash}`} target="_blank" rel="noreferrer" style={{color:'#0088cc', textDecoration:'none', display:'block', marginTop:'5px'}}>Ver en Explorer 🔗</a>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div style={{...s.card, textAlign:'center', color:'#555'}}><p>No tienes retiros registrados.</p></div>
                 )}
                 <button style={{...s.btnOutline, marginTop: '20px'}} onClick={() => setView('main')}>VOLVER</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'missions' && (
          <div className="fade-in" style={{ marginTop: '10px', textAlign: 'left' }}>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              <h2 style={{ margin: 0, color: '#fff' }}>📋 Panel de Misiones</h2>
            </div>

            {/* Misión 1 */}
            <div style={{...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#004466', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>🤖</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>Start Nex Legends</p>
                  <p style={{ margin: 0, color: '#00ccff', fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>⚡ +0.001 TON</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isNexLegendsCompleted ? (
                  <button style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', opacity: 0.5}} disabled>Completada</button>
                ) : (
                  <>
                    <button style={{...s.btnOutline, padding: '6px 12px', fontSize: '12px', borderColor: '#00ccff', color: '#00ccff'}} onClick={() => handleOpenApp('Nex Legends', 'https://t.me/nexlegendsbot/hunt?startapp=7517815832')}>Abrir App</button>
                    <button style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', backgroundColor: openedApps['Nex Legends'] ? '#0088cc' : '#334455', opacity: openedApps['Nex Legends'] ? 1 : 0.6}} onClick={() => handleClaimMission('Nex Legends')}>Reclamar</button>
                  </>
                )}
              </div>
            </div>

            {/* Misión 2 */}
            <div style={{...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#004466', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>✉️</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>Start Gmail Farmer</p>
                  <p style={{ margin: 0, color: '#00ccff', fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>⚡ +0.001 TON</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isGmailCompleted ? (
                  <button style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', opacity: 0.5}} disabled>Completada</button>
                ) : (
                  <>
                    <button style={{...s.btnOutline, padding: '6px 12px', fontSize: '12px', borderColor: '#00ccff', color: '#00ccff'}} onClick={() => handleOpenApp('gmail', 'https://t.me/GmailFarmerBot?start=7517815832')}>Abrir App</button>
                    <button style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', backgroundColor: openedApps.gmail ? '#0088cc' : '#334455', opacity: openedApps.gmail ? 1 : 0.6}} onClick={() => handleClaimMission('gmail')}>Reclamar</button>
                  </>
                )}
              </div>
            </div>
          </div>
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

      <div style={s.bottomNav}>
        <div onClick={() => { setActiveTab('home'); setView('main'); }} style={activeTab === 'home' ? s.navItemActive : s.navItem}><span style={{fontSize:'20px'}}>🏠</span><span>HOME</span></div>
        <div onClick={() => setActiveTab('missions')} style={activeTab === 'missions' ? s.navItemActive : s.navItem}><span style={{fontSize:'20px'}}>📋</span><span>MISIONES</span></div>
        <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}><span style={{fontSize:'20px'}}>👥</span><span>AMIGOS</span></div>
      </div>
    </div>
  );
}

export default App;