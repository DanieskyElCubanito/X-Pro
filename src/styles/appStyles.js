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

  // --- ESTADOS DE MISIONES ---
  // Controla si el usuario ya tocó "Abrir App" en esta sesión
  const [openedApps, setOpenedApps] = useState({ tickbit: false, gmail: false });

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
          if (data.channels.c1 === false || data.channels.c2 === false) {
            needsToJoin = true;
          }
        } 

        setMustJoin(needsToJoin || data.mustJoin === true); 
        setStatus('member');

        if (data.user.is_human) {
           setIsHuman(true);
        }
      } else {
        setErrorMessage(data.message || "Tu cuenta no pudo ser verificada.");
        setStatus('error');
      }
    } catch (err) {
      console.error("Error verificando:", err);
      const serverMessage = err.response?.data?.message || err.message || "Error de conexión.";
      setErrorMessage(serverMessage);
      setStatus('error');
    }
  };

  const handleCheckChannels = async () => {
    const tid = toast.loading("Verificando canales...");
    try {
      const res = await botApi.checkChannels(userData.id);
      if (res.allJoined) {
        setMustJoin(false);
        toast.success("¡Perfecto! Ya puedes entrar", { id: tid });
      } else {
        setChannelStatus({ c1: res.channel1, c2: res.channel2 });
        toast.error("Aún no te has unido a todos los canales", { id: tid });
      }
    } catch (e) {
      toast.error("Error al verificar. Intenta de nuevo.", { id: tid });
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

  const handleBonus = async () => {
    if (!userData?.id) return toast.error("Usuario no cargado");
    const tid = toast.loading("Reclamando bono...");
    try {
      const res = await botApi.claimBonus(userData.id);
      if (res.success) {
        setUserData(prev => ({ ...prev, balance: res.newBalance }));
        toast.success("¡Bono recibido! +0.001 TON", { id: tid });
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Error de conexión";
      toast.error(`Fallo: ${msg}`, { id: tid });
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress.trim()) return toast.error("Ingresa tu dirección TON");
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount < 0.01) return toast.error("El mínimo es 0.01 TON");
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
      const msg = e.response?.data?.error || e.message || "Error en la red";
      toast.error(`Fallo: ${msg}`, { id: tid });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleShare = () => {
    const inviteLink = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = "¡Gana TON gratis con esta App! 💎";
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    WebApp.openTelegramLink(fullUrl);
  };

  // --- LÓGICA DE MISIONES ---
  const handleOpenApp = (missionId, url) => {
    WebApp.openTelegramLink(url);
    // Marcamos que ya abrió el enlace para habilitar el botón de reclamar
    setOpenedApps(prev => ({ ...prev, [missionId]: true }));
  };

  const handleClaimMission = async (missionId) => {
    if (!openedApps[missionId]) {
      return toast.error("Debes abrir la app primero para poder reclamar.");
    }

    const tid = toast.loading("Verificando misión...");
    try {
      const res = await botApi.claimMission(userData.id, missionId);
      if (res.success) {
        setUserData(prev => ({ 
          ...prev, 
          balance: res.newBalance,
          // Agregamos la misión a las completadas localmente
          missions_completed: [...(prev.missions_completed || []), missionId] 
        }));
        toast.success("¡Misión completada! +0.001 TON", { id: tid });
      }
    } catch (e) {
      const msg = e.response?.data?.error || "Error al verificar la misión";
      toast.error(msg, { id: tid });
    }
  };

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;

  if (status === 'error') {
    return (
      <div style={s.center}>
        <h2 style={{color: '#ffcc00'}}>⚠️ Error de acceso</h2>
        <p style={{color: '#fff'}}>{errorMessage}</p>
        <button 
          style={{...s.btnOutline, marginTop: '20px', fontSize: '12px'}} 
          onClick={() => window.location.reload()}
        >
          🔄 REINTENTAR
        </button>
      </div>
    );
  }

  if (mustJoin) {
    return (
      <div style={{...s.container, padding: '40px 20px', textAlign: 'center'}}>
        <Toaster position="top-center" />
        <h2 style={{color: '#0088cc', marginBottom: '10px'}}>¡Casi listo! 🚀</h2>
        <p style={{fontSize: '14px', color: '#888', marginBottom: '30px'}}>
          Para activar tu cuenta y empezar a ganar, únete a nuestros canales oficiales:
        </p>

        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          {!channelStatus.c1 && (
            <div style={{...s.card, border: '1px solid #0088cc'}}>
              <p style={{margin: '0 0 10px 0', fontWeight: 'bold'}}>Crypto ₿itcoin</p>
              <button style={s.btnGreen} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>
                UNIRME CANAL 1
              </button>
            </div>
          )}
          {!channelStatus.c2 && (
            <div style={{...s.card, border: '1px solid #0088cc'}}>
              <p style={{margin: '0 0 10px 0', fontWeight: 'bold'}}>👑𝘾𝙧𝙮𝙥𝙩𝙤 𝙞𝙣𝙫𝙚𝙨𝙩𝙢𝙚𝙣𝙩𝙨👑</p>
              <button style={s.btnGreen} onClick={() => WebApp.openTelegramLink('https://t.me/CryptoInvestmentsWebs')}>
                UNIRME CANAL 2
              </button>
            </div>
          )}
        </div>

        <button 
          style={{...s.btnOutline, marginTop: '40px', width: '100%', color: '#28a745', borderColor: '#28a745'}} 
          onClick={handleCheckChannels}
        >
          🔄 YA ME UNÍ, VERIFICAR
        </button>
      </div>
    );
  }

  if (!isHuman && status === 'member') {
    return (
      <div style={{...s.container, padding: '50px 20px', textAlign: 'center'}}>
        <Toaster position="top-center" />
        <h2 style={{color: '#0088cc'}}>¡Verificación Rápida! ⚡</h2>
        <p style={{color: '#888', fontSize: '15px', marginBottom: '30px'}}>
          Demuestra que eres humano tocando <b>{captchaTarget?.name}</b>:
        </p>

        <div style={{display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '30px'}}>
          {captchaOptions.map((item, index) => (
            <button 
              key={index}
              onClick={async () => {
                if (item.icon === captchaTarget?.icon) {
                  const tid = toast.loading("Validando seguridad...");
                  try {
                    const res = await botApi.verifyHuman(userData.id, 'app-verified-fast');
                    if (res.success) {
                      setIsHuman(true);
                      toast.success("¡Acceso concedido!", { id: tid });
                    }
                  } catch (e) {
                    toast.error("Validación fallida.", { id: tid });
                  }
                } else {
                  toast.error("Incorrecto, intenta de nuevo.");
                  initCaptcha(); 
                }
              }}
              style={{
                fontSize: '40px', padding: '15px', borderRadius: '15px', 
                background: '#1a1a1a', border: '2px solid #333', cursor: 'pointer',
                transition: 'transform 0.1s'
              }}
            >
              {item.icon}
            </button>
          ))}
        </div>

        <p style={{fontSize: '12px', color: '#555', marginTop: '40px'}}>
          Esta verificación solo aparece la primera vez que inicies.
        </p>
      </div>
    );
  }

  // Comprobamos qué misiones ya están guardadas en la base de datos
  const isTickbitCompleted = userData?.missions_completed?.includes('tickbit');
  const isGmailCompleted = userData?.missions_completed?.includes('gmail');

  return (
    <div style={s.container}>
      <Toaster position="top-center" reverseOrder={false} />

      <div style={s.main}>
        <div style={s.profileHeader}>
          <img 
            src={WebApp.initDataUnsafe?.user?.photo_url || 'https://via.placeholder.com/100'} 
            style={s.profileAvatar} 
            alt="avatar"
          />
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
                  <div style={{fontSize:'12px', background:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:'10px', display:'inline-block'}}>
                    Nivel: Usuario Elite ⚡
                  </div>
                </div>

                <div style={s.actionGrid}>
                  <div style={s.actionCard} onClick={() => setView('withdraw')}>
                    <span style={{fontSize:'26px', marginBottom:'5px'}}>💸</span>
                    RETIRO
                  </div>
                  <div style={s.actionCard} onClick={handleBonus}>
                    <span style={{fontSize:'26px', marginBottom:'5px'}}>🎁</span>
                    BONO
                  </div>
                  <div style={s.actionCard} onClick={() => setView('history')}>
                    <span style={{fontSize:'26px', marginBottom:'5px'}}>📜</span>
                    HISTORIAL
                  </div>
                </div>

                {/* --- SECCIÓN DE MISIONES --- */}
                <div style={{ marginTop: '25px', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '15px' }}>📋 Misiones Disponibles</h3>

                  {/* MISIÓN 1: TickBit */}
                  <div style={{...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#004466', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                        🤖
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>Start TickBit Bot</p>
                        <p style={{ margin: 0, color: '#00ccff', fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>⚡ +0.001 TON</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {isTickbitCompleted ? (
                        <button style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', opacity: 0.5, cursor: 'not-allowed'}} disabled>
                          Completada
                        </button>
                      ) : (
                        <>
                          <button 
                            style={{...s.btnOutline, padding: '6px 12px', fontSize: '12px', borderColor: '#00ccff', color: '#00ccff', backgroundColor: 'transparent'}}
                            onClick={() => handleOpenApp('tickbit', 'https://t.me/TickBitEarn_bot?start=ref_7517815832')}
                          >
                            Abrir App
                          </button>
                          <button 
                            style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', backgroundColor: openedApps.tickbit ? '#0088cc' : '#334455', color: '#fff', border: 'none', opacity: openedApps.tickbit ? 1 : 0.6}}
                            onClick={() => handleClaimMission('tickbit')}
                          >
                            Reclamar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* MISIÓN 2: Gmail Farmer */}
                  <div style={{...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#004466', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                        ✉️
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>Start Gmail Farmer</p>
                        <p style={{ margin: 0, color: '#00ccff', fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>⚡ +0.001 TON</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {isGmailCompleted ? (
                        <button style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', opacity: 0.5, cursor: 'not-allowed'}} disabled>
                          Completada
                        </button>
                      ) : (
                        <>
                          <button 
                            style={{...s.btnOutline, padding: '6px 12px', fontSize: '12px', borderColor: '#00ccff', color: '#00ccff', backgroundColor: 'transparent'}}
                            onClick={() => handleOpenApp('gmail', 'https://t.me/GmailFarmerBot?start=7517815832')}
                          >
                            Abrir App
                          </button>
                          <button 
                            style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', backgroundColor: openedApps.gmail ? '#0088cc' : '#334455', color: '#fff', border: 'none', opacity: openedApps.gmail ? 1 : 0.6}}
                            onClick={() => handleClaimMission('gmail')}
                          >
                            Reclamar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </>
            ) : view === 'withdraw' ? (
              <div className="fade-in">
                 <h2 style={{textAlign:'center', marginBottom:'20px'}}>Retirar Balance</h2>
                 <p style={s.helpText}>Mínimo de retiro: 0.01 TON. Asegúrate de usar una red TON (UQ... o EQ...).</p>

                 <input 
                    style={s.input} 
                    placeholder="Dirección de Wallet TON" 
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    disabled={isWithdrawing}
                 />
                 <input 
                    style={s.input} 
                    type="number" 
                    placeholder="Monto" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={isWithdrawing}
                    min="0.01"
                 />
                 <button 
                    style={{...s.btnGreen, opacity: isWithdrawing ? 0.6 : 1}} 
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                 >
                    {isWithdrawing ? "PROCESANDO PAGO..." : "ENVIAR SOLICITUD"}
                 </button>
                 <button 
                    style={s.btnOutline} 
                    onClick={() => setView('main')}
                    disabled={isWithdrawing}
                 >
                    VOLVER AL INICIO
                 </button>
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
                          <a 
                            href={`https://tonscan.org/tx/${tx.tx_hash}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{color:'#0088cc', textDecoration:'none', display:'block', marginTop:'5px'}}
                          >
                            Ver en Explorer 🔗
                          </a>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div style={{...s.card, textAlign:'center', color:'#555'}}>
                      <p>No tienes retiros registrados aún.</p>
                   </div>
                 )}
                 <button style={{...s.btnOutline, marginTop: '20px'}} onClick={() => setView('main')}>VOLVER</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'share' && <ShareTab stats={stats} handleShare={handleShare} />}
      </div>

      <div style={s.bottomNav}>
        <div onClick={() => { setActiveTab('home'); setView('main'); }} style={activeTab === 'home' ? s.navItemActive : s.navItem}>
           <span style={{fontSize:'20px'}}>🏠</span><span>HOME</span>
        </div>
        <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>
           <span style={{fontSize:'20px'}}>👥</span><span>AMIGOS</span>
        </div>
      </div>
    </div>
  );
}

export default App;


puedes separar y poner los estilos en el código de estilos para no tener todo junto 
export const s = {
  // --- [ ESTADOS DE CARGA Y ERRORES ] ---
  center: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
    color: '#fff',
    textAlign: 'center'
  },
  loader: {
    width: '40px',
    height: '40px',
    border: '4px solid #222',
    borderTop: '4px solid #0088cc',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite', // Requiere el CSS de abajo
    marginBottom: '15px'
  },
  errorText: {
    color: '#ff4444',
    fontSize: '14px',
    marginTop: '10px',
    lineHeight: '1.4'
  },

  // --- [ CONTENEDORES GENERALES ] ---
  container: { 
    backgroundColor: '#050505', 
    color: '#ffffff', 
    minHeight: '100vh', 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif',
    display: 'flex', 
    flexDirection: 'column'
  },

  main: { 
    padding: '16px', 
    maxWidth: '500px', 
    margin: '0 auto', 
    width: '100%', 
    boxSizing: 'border-box', 
    paddingBottom: '120px' 
  }, 

  // --- [ PERFIL DE USUARIO ] ---
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    marginBottom: '20px'
  },
  profileAvatar: {
    width: '55px',
    height: '55px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #0088cc',
    marginRight: '15px'
  },
  profileName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0
  },
  profileId: {
    fontSize: '12px',
    color: '#888',
    margin: 0
  },

  // --- [ TARJETAS Y PANELES ] ---
  card: { 
    backgroundColor: '#121212', 
    padding: '20px', 
    borderRadius: '24px', 
    border: '1px solid #1f1f1f', 
    marginBottom: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
  },
  cardBalance: { 
    background: 'linear-gradient(145deg, #0088cc 0%, #005588 100%)', 
    padding: '35px 20px', 
    borderRadius: '28px', 
    textAlign: 'center', 
    marginBottom: '24px',
    boxShadow: '0 12px 24px rgba(0,136,204,0.3)'
  },

  // --- [ ACCIONES RÁPIDAS ] ---
  actionGrid: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    marginTop: '20px'
  },
  actionCard: {
    flex: 1, 
    backgroundColor: '#1a1a1a', 
    borderRadius: '18px',
    padding: '15px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '1px solid #333',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600'
  },

  // --- [ DISEÑO DE RED (AFILIADOS) ] ---
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '20px'
  },
  statCol: {
    backgroundColor: '#1a1a1a',
    padding: '12px 5px',
    borderRadius: '18px',
    textAlign: 'center',
    border: '1px solid #252525'
  },
  statLabel: { fontSize: '10px', color: '#888', fontWeight: 'bold', margin: '0 0 5px 0', textTransform: 'uppercase' },
  statValue: { fontSize: '18px', fontWeight: '800', margin: '0', color: '#fff' },
  statCom: { fontSize: '10px', margin: '5px 0 0 0', color: '#0088cc', fontWeight: '600' },

  row: { display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '20px' },
  box: { 
    flex: 1, 
    padding: '10px', 
    backgroundColor: '#161616', 
    borderRadius: '14px', 
    fontSize: '10px', 
    textAlign: 'center', 
    color: '#666',
    border: '1px dashed #333'
  },
  totalCard: {
    background: 'linear-gradient(90deg, #121212 0%, #1a1a1a 100%)',
    padding: '15px 20px',
    borderRadius: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #28a74544'
  },

  // --- [ BOTONES ] ---
  btnGreen: { 
    width: '100%', 
    padding: '18px', 
    backgroundColor: '#28a745', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '18px', 
    fontWeight: '800', 
    fontSize: '16px',
    boxShadow: '0 8px 20px rgba(40,167,69,0.2)',
    cursor: 'pointer'
  },
  btnWhite: { 
    width: '100%', 
    padding: '16px', 
    backgroundColor: '#fff', 
    color: '#000', 
    borderRadius: '16px', 
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer'
  },
  btnOutline: { 
    width: '100%', 
    padding: '14px', 
    backgroundColor: 'transparent', 
    color: '#888', 
    border: '1px solid #333', 
    borderRadius: '16px', 
    fontWeight: '600',
    fontSize: '14px',
    marginTop: '10px',
    cursor: 'pointer'
  },

  // --- [ NAVEGACIÓN ] ---
  bottomNav: { 
    position: 'fixed', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(5, 5, 5, 0.8)', 
    backdropFilter: 'blur(15px)', 
    display: 'flex', 
    justifyContent: 'space-around', 
    padding: '12px 10px 30px 10px', 
    borderTop: '1px solid #1f1f1f', 
    zIndex: 100 
  },
  navItem: { color: '#555', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '11px', width: '33%', gap: '5px', cursor: 'pointer' },
  navItemActive: { color: '#0088cc', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '11px', width: '33%', gap: '5px', cursor: 'pointer' },

  // --- [ RETIRO E INPUTS ] ---
  input: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '15px'
  },
  helpText: {
    fontSize: '11px',
    color: '#fff', 
    background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.2) 0%, rgba(40, 167, 69, 0.1) 100%)', 
    padding: '12px',
    borderRadius: '16px',
    border: '1px solid rgba(0, 136, 204, 0.3)', 
    marginBottom: '15px',
    lineHeight: '1.5'
  }
};