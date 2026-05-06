import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { s } from './styles/appStyles';
import { botApi } from './api/botApi';
import toast, { Toaster } from 'react-hot-toast'; 
import ShareTab from './components/ShareTab';
import { Turnstile } from '@marsidev/react-turnstile';

function App() {
  const [status, setStatus] = useState('loading'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ n1: 0, c1: "0.000", n2: 0, c2: "0.000", n3: 0, c3: "0.000" });
  const [view, setView] = useState('main');

  // --- ESTADOS DE CANALES ---
  const [mustJoin, setMustJoin] = useState(false);
  const [channelStatus, setChannelStatus] = useState({ c1: false, c2: false });

  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('0.1');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [history, setHistory] = useState([]); 
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const initialized = useRef(false);

  // --- LÓGICA DE VERIFICACIÓN TOTAL ---
  const verifyUser = async (user, startParam) => {
    try {
      // 1. Verificar registro/login
      const data = await botApi.verifyUser(user, startParam);

      if (data.success) {
        setUserData(data.user);
        setStats(data.stats);
        if (data.user.is_human) setIsHuman(true);

        // 2. Verificar canales inmediatamente después del login
        const resChannels = await botApi.checkChannels(data.user.id);
        
        if (resChannels.success) {
          setChannelStatus({ c1: resChannels.channel1, c2: resChannels.channel2 });
          // Si NO se ha unido a todos, activamos el bloqueo
          if (!resChannels.allJoined) {
            setMustJoin(true);
          }
        }

        setStatus('member');
      } else {
        setErrorMessage(data.message || "Tu cuenta no pudo ser verificada.");
        setStatus('error');
      }
    } catch (err) {
      console.error("Error verificando:", err);
      setErrorMessage("Error de conexión con el servidor.");
      setStatus('error');
    }
  };

  const handleCheckChannels = async () => {
    const tid = toast.loading("Verificando suscripciones...");
    try {
      const res = await botApi.checkChannels(userData.id);
      if (res.allJoined) {
        setMustJoin(false);
        toast.success("¡Suscripción verificada!", { id: tid });
      } else {
        setChannelStatus({ c1: res.channel1, c2: res.channel2 });
        toast.error("Aún faltan canales por seguir", { id: tid });
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
          setErrorMessage("Abre la app desde Telegram");
          setStatus('error');
          return;
        }

        initialized.current = true;
        verifyUser(user, inviterId);
      } catch (e) {
        setErrorMessage("Error de inicio");
        setStatus('error');
      }
    }, 150);
    return () => clearTimeout(initTimer);
  }, []);

  // ... (Resto de funciones handleBonus, handleWithdraw, handleShare iguales)

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
      toast.error("Error al reclamar el bono", { id: tid });
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
        toast.success("¡Retiro exitoso!", { id: tid });
        setWithdrawAddress(''); 
        setTimeout(() => setView('main'), 2000); 
      }
    } catch (e) {
      toast.error("Error en el retiro", { id: tid });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleShare = () => {
    const inviteLink = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = "¡Gana TON gratis con esta App! 💎";
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`);
  };

  /* --- RENDERIZADO --- */

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;

  if (status === 'error') {
    return (
      <div style={s.center}>
        <h2 style={{color: '#ffcc00'}}>⚠️ Error</h2>
        <p>{errorMessage}</p>
        <button style={s.btnOutline} onClick={() => window.location.reload()}>🔄 REINTENTAR</button>
      </div>
    );
  }

  // 1. PANTALLA DE BLOQUEO DE CANALES (Prioridad máxima después del login)
  if (mustJoin) {
    return (
      <div style={{...s.container, padding: '40px 20px', textAlign: 'center'}}>
        <Toaster position="top-center" />
        <h2 style={{color: '#0088cc', marginBottom: '10px'}}>¡Acceso Restringido! 🔒</h2>
        <p style={{fontSize: '14px', color: '#888', marginBottom: '30px'}}>
          Para activar tu minería y recibir pagos, únete a nuestros canales:
        </p>

        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          {!channelStatus.c1 && (
            <div style={{...s.card, border: '1px solid #0088cc', padding: '15px'}}>
              <p style={{margin: '0 0 10px 0', fontWeight: 'bold'}}>📢 Canal de Noticias</p>
              <button style={s.btnGreen} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>
                UNIRME AHORA
              </button>
            </div>
          )}
          {!channelStatus.c2 && (
            <div style={{...s.card, border: '1px solid #0088cc', padding: '15px'}}>
              <p style={{margin: '0 0 10px 0', fontWeight: 'bold'}}>💰 Canal de Pagos</p>
              <button style={s.btnGreen} onClick={() => WebApp.openTelegramLink('https://t.me/CryptoInvestmentsWebs')}>
                UNIRME AHORA
              </button>
            </div>
          )}
        </div>

        <button 
          style={{...s.btnOutline, marginTop: '40px', width: '100%', color: '#28a745', borderColor: '#28a745'}} 
          onClick={handleCheckChannels}
        >
          ✅ YA ME UNÍ, VERIFICAR
        </button>
      </div>
    );
  }

  // 2. PANTALLA DE CAPTCHA (Solo aparece si ya se unió a los canales)
  if (!isHuman) {
    return (
      <div style={{...s.container, padding: '50px 20px', textAlign: 'center'}}>
        <Toaster position="top-center" />
        <h2 style={{color: '#0088cc'}}>Verificación de Seguridad</h2>
        <p style={{color: '#888', marginBottom: '30px'}}>Confirma que no eres un robot:</p>
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Turnstile 
            siteKey="0x4AAAAAACqyiOXggbsrQdnA"
            onSuccess={async (token) => {
              const res = await botApi.verifyHuman(userData.id, token);
              if (res.success) setIsHuman(true);
            }}
          />
        </div>
      </div>
    );
  }

  // 3. INTERFAZ PRINCIPAL
  return (
    <div style={s.container}>
      <Toaster position="top-center" />
      <div style={s.main}>
        {/* Tu cabecera de perfil */}
        <div style={s.profileHeader}>
          <img src={WebApp.initDataUnsafe?.user?.photo_url || 'https://via.placeholder.com/100'} style={s.profileAvatar} />
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
                  <p style={{fontSize:'12px', fontWeight:'bold', opacity:0.8}}>SALDO DISPONIBLE</p>
                  <h1 style={{fontSize:'42px', margin:'10px 0'}}>
                    {Number(userData?.balance || 0).toFixed(5)} <span style={{fontSize:'16px'}}>TON</span>
                  </h1>
                </div>

                <div style={s.actionGrid}>
                  <div style={s.actionCard} onClick={() => setView('withdraw')}>💸 RETIRO</div>
                  <div style={s.actionCard} onClick={handleBonus}>🎁 BONO</div>
                </div>
              </>
            ) : (
              /* Vista de Retiro */
              <div className="fade-in">
                <button style={s.btnOutline} onClick={() => setView('main')}>← VOLVER</button>
                <h2 style={{textAlign:'center', marginTop:'20px'}}>Retirar Fondos</h2>
                <input style={s.input} placeholder="Dirección TON" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} />
                <input style={s.input} type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                <button style={s.btnGreen} onClick={handleWithdraw} disabled={isWithdrawing}>
                  {isWithdrawing ? "PROCESANDO..." : "CONFIRMAR RETIRO"}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'share' && <ShareTab stats={stats} handleShare={handleShare} />}
      </div>

      {/* Menú Inferior */}
      <div style={s.bottomNav}>
        <div onClick={() => { setActiveTab('home'); setView('main'); }} style={activeTab === 'home' ? s.navItemActive : s.navItem}>🏠 INICIO</div>
        <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>👥 AMIGOS</div>
      </div>
    </div>
  );
}

export default App;