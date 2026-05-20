import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { s } from './styles/appStyles';
import { botApi } from './api/botApi';
import toast, { Toaster } from 'react-hot-toast'; 
import ShareTab from './components/ShareTab';

// ==========================================
// COMPONENTE: CHECK DAILY (Bono con Anuncios)
// ==========================================
function DailyCheckIn({ userData, setUserData }) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState("");
  const [canClaim, setCanClaim] = useState(true);

  useEffect(() => {
    if (!userData?.last_bonus) {
      setCanClaim(true);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const lastBonusTime = new Date(userData.last_bonus).getTime();
      const timePassed = now - lastBonusTime;
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (timePassed < twentyFourHours) {
        setCanClaim(false);
        const timeLeft = twentyFourHours - timePassed;
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        setCooldown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCanClaim(true);
        setCooldown("");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userData?.last_bonus]);

  const handleDailyCheck = async () => {
    if (!canClaim || loading) return;
    setLoading(true);

    try {
      // 1. Forzar al usuario a compartir su enlace en Telegram
      const userId = userData?.id || 'invitado';
      const shareUrl = `https://t.me/IAProfitTonBot/app?startapp=${userId}`;
      const shareText = encodeURIComponent("🚀 ¡Mira esta Mini App para ganar Toncoin diario con Inteligencia Artificial! Entra ya: 💎");
      const telegramShareLink = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;

      WebApp.openTelegramLink(telegramShareLink);

      // Pequeña pausa para simular el regreso a la app
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 2. Mostrar el anuncio obligatorio de GigaPub
      if (typeof window.showGiga === 'function') {
        const tid = toast.loading("Cargando recompensa...");
        window.showGiga()
          .then(async () => {
            // El anuncio terminó con éxito -> Ejecutamos el reclamo en el Backend
            const res = await botApi.claimBonus(userData.id);

            if (res.success) {
              toast.success("¡Bono diario reclamado con éxito! +0.001 TON", { id: tid });
              setUserData(prev => ({
                ...prev,
                balance: res.newBalance,
                last_bonus: new Date().toISOString()
              }));
            } else {
              toast.error("Error al procesar el bono.", { id: tid });
            }
          })
          .catch((err) => {
            toast.error("⚠️ Debes ver el anuncio completo para recibir la recompensa.", { id: tid });
            console.error("Error en GigaPub:", err);
          })
          .finally(() => setLoading(false));
      } else {
        toast.error("Error al cargar el sistema de anuncios.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error inesperado.");
      setLoading(false);
    }
  };

  return (
    <div style={{...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '28px' }}>🎁</div>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 'bold' }}>Check Daily</h4>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#888' }}>Comparte + Mira un Ad</p>
        </div>
      </div>
      <button 
        onClick={handleDailyCheck} 
        disabled={!canClaim || loading}
        style={{
          ...s.btnGreen,
          padding: '8px 16px',
          fontSize: '13px',
          width: 'auto',
          backgroundColor: canClaim ? '#0088cc' : '#334455',
          opacity: canClaim && !loading ? 1 : 0.6,
          cursor: canClaim && !loading ? 'pointer' : 'not-allowed',
          border: 'none'
        }}
      >
        {loading ? "Cargando..." : canClaim ? "+0.001 TON" : cooldown}
      </button>
    </div>
  );
}


// ==========================================
// APLICACIÓN PRINCIPAL
// ==========================================
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

  // --- ESTADOS DE MISIONES ---
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

        {/* =====================
            PESTAÑA: HOME 
            ===================== */}
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

                {/* Modificamos el Grid para quitar el bono antiguo y usar dos botones más grandes */}
                <div style={{...s.actionGrid, gridTemplateColumns: '1fr 1fr'}}>
                  <div style={s.actionCard} onClick={() => setView('withdraw')}>
                    <span style={{fontSize:'26px', marginBottom:'5px'}}>💸</span>
                    RETIRO
                  </div>
                  <div style={s.actionCard} onClick={() => setView('history')}>
                    <span style={{fontSize:'26px', marginBottom:'5px'}}>📜</span>
                    HISTORIAL
                  </div>
                </div>

                {/* Nueva tarjeta del Bono Diario (Check Daily) */}
                <DailyCheckIn userData={userData} setUserData={setUserData} />

              </>
            ) : view === 'withdraw' ? (
              <div className="fade-in">
                 <h2 style={{textAlign:'center', marginBottom:'20px'}}>Retirar Balance</h2>
                 <p style={s.helpText}>Mínimo de retiro: 0.25 TON. Asegúrate de usar una red TON (UQ... o EQ...).</p>

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
                    min="0.25"
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

        {/* =====================
            PESTAÑA: MISIONES 
            ===================== */}
        {activeTab === 'missions' && (
          <div className="fade-in" style={{ marginTop: '10px', textAlign: 'left' }}>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              <h2 style={{ margin: 0, color: '#fff' }}>📋 Panel de Misiones</h2>
              <p style={{ color: '#888', fontSize: '13px', marginTop: '5px' }}>
                Completa estas tareas para sumar TON extra a tu balance.
              </p>
            </div>

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
        )}

        {/* =====================
            PESTAÑA: AMIGOS (SHARE) 
            ===================== */}
        {activeTab === 'share' && <ShareTab stats={stats} handleShare={handleShare} />}
      </div>

      {/* =====================
          NAVEGACIÓN INFERIOR 
          ===================== */}
      <div style={s.bottomNav}>
        <div onClick={() => { setActiveTab('home'); setView('main'); }} style={activeTab === 'home' ? s.navItemActive : s.navItem}>
           <span style={{fontSize:'20px'}}>🏠</span><span>HOME</span>
        </div>
        <div onClick={() => setActiveTab('missions')} style={activeTab === 'missions' ? s.navItemActive : s.navItem}>
           <span style={{fontSize:'20px'}}>📋</span><span>MISIONES</span>
        </div>
        <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>
           <span style={{fontSize:'20px'}}>👥</span><span>AMIGOS</span>
        </div>
      </div>
    </div>
  );
}

export default App;