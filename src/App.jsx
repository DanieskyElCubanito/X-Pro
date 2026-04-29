import { useEffect, useState } from 'react';
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

  // Estados para la validación de canales
  const [mustJoin, setMustJoin] = useState(false);
  const [channelStatus, setChannelStatus] = useState({ c1: true, c2: true });

  // Estados para el retiro
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('0.1');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // NUEVO: Estados para Historial
  const [history, setHistory] = useState([]); 
  const [loadingHistory, setLoadingHistory] = useState(false);

  // NUEVO: Estados para Captcha Anti-Bots
  const [isHuman, setIsHuman] = useState(false);
  const [captchaStep, setCaptchaStep] = useState([]);

  const generateCaptcha = () => {
    const nums = [1, 2, 3].sort(() => Math.random() - 0.5);
    setCaptchaStep(nums);
  };

  const verifyUser = async (user, startParam) => {
    try {
      const data = await botApi.verifyUser(user, startParam);
      if (data.success) {
        setUserData(data.user);
        setStats(data.stats);
        setChannelStatus(data.channels);
        setMustJoin(data.mustJoin); 
        setStatus('member');

        // Validamos si ya resolvió el captcha antes en la base de datos
        if (data.user.is_human) {
           setIsHuman(true);
        } else {
           generateCaptcha();
        }
      }
    } catch (err) {
      console.error("Error verificando:", err);
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
    WebApp.ready(); 
    WebApp.expand();
    const user = WebApp.initDataUnsafe?.user;
    const inviterId = WebApp.initDataUnsafe?.start_param;

    if (!user) {
      setStatus('error');
      return;
    }

    verifyUser(user, inviterId);
  }, []);

  // NUEVO: Función para cargar historial cuando se entra a la vista
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

    if (isNaN(amount) || amount < 0.1) return toast.error("El mínimo es 0.1 TON");
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

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;
  if (status === 'error') return <div style={s.center}><h2>⚠️ Error de acceso</h2><p>Abre la app desde Telegram</p></div>;

  // Pantalla de Canales
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

  // NUEVO: Pantalla de Captcha Anti-Bots
  if (!isHuman && status === 'member') {
    return (
      <div style={{...s.container, padding: '50px 20px', textAlign: 'center'}}>
        <Toaster position="top-center" />
        <h2 style={{color: '#0088cc'}}>¡Seguridad Anti-Bots! 🤖</h2>
        <p style={{color: '#888', fontSize: '14px', marginBottom: '30px'}}>
          Demuestra que eres humano tocando los números en orden (<b>1, 2, 3</b>):
        </p>
        
        <div style={{display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '30px'}}>
          {captchaStep.map((num, idx) => (
            <div 
              key={idx} 
              onClick={async () => {
                const currentExpected = captchaStep.filter(n => n === null).length + 1;
                if (num === currentExpected) {
                   const newStep = [...captchaStep];
                   newStep[idx] = null; 
                   setCaptchaStep(newStep);
                   
                   // Si resolvió todo el puzzle
                   if (newStep.every(n => n === null)) {
                      const tid = toast.loading("Verificando...");
                      try {
                        // Avisar al backend que es humano
                        await botApi.verifyHuman(userData.id);
                        setIsHuman(true);
                        toast.success("¡Verificado exitosamente!", { id: tid });
                      } catch (e) {
                        toast.error("Error conectando con el servidor", { id: tid });
                        generateCaptcha();
                      }
                   }
                } else {
                  toast.error("Orden incorrecto, intenta de nuevo");
                  generateCaptcha();
                }
              }}
              style={{
                width: '60px', height: '60px', background: '#0088cc', color: 'white',
                borderRadius: '12px', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer',
                visibility: num === null ? 'hidden' : 'visible',
                boxShadow: '0 4px 10px rgba(0, 136, 204, 0.3)'
              }}
            >
              {num}
            </div>
          ))}
        </div>
        <p style={{fontSize: '12px', color: '#555', marginTop: '40px'}}>Esta verificación solo aparecerá la primera vez que inicies sesión.</p>
      </div>
    );
  }

  // Interfaz Principal
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

                <div style={{...s.card, marginTop:'20px', borderStyle:'dashed', borderColor:'#333'}}>
                    <p style={{color:'#888', fontSize:'13px', textAlign:'center'}}>
                      Próximas misiones disponibles pronto...
                    </p>
                </div>
              </>
            ) : view === 'withdraw' ? (
              <div className="fade-in">
                 <h2 style={{textAlign:'center', marginBottom:'20px'}}>Retirar Balance</h2>
                 <p style={s.helpText}>Mínimo de retiro: 0.1 TON. Asegúrate de usar una red TON (UQ... o EQ...).</p>

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
                    min="0.1"
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