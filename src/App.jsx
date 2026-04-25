import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { s } from './styles/appStyles';
import { botApi } from './api/botApi'; // Asegúrate que el archivo se llame botApi.js
import toast, { Toaster } from 'react-hot-toast'; 
import ShareTab from './components/ShareTab';

function App() {
  const [status, setStatus] = useState('loading'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ n1: 0, c1: "0.000", n2: 0, c2: "0.000", n3: 0, c3: "0.000" });
  const [view, setView] = useState('main'); // 'main', 'withdraw', 'history'

  // Función para verificar usuario
  const verifyUser = async (user, startParam) => {
    try {
      const data = await botApi.verifyUser(user, startParam);
      if (data.success) {
        setUserData(data.user);
        setStats(data.stats);
        setStatus('member');
      }
    } catch (err) {
      console.error("Error verificando:", err);
      setStatus('error');
    }
  };

  useEffect(() => {
    WebApp.ready(); 
    WebApp.expand();
    const user = WebApp.initDataUnsafe?.user;
    
    // AQUÍ ES LA CLAVE: Capturamos el ID de quien lo invitó
    const inviterId = WebApp.initDataUnsafe?.start_param;

    if (!user) {
      setStatus('error');
      return;
    }
    
    // Pasamos el usuario Y el ID del invitador al backend
    verifyUser(user, inviterId);
  }, []);

  // Lógica del Bono con detector de errores real
  const handleBonus = async () => {
    if (!userData?.id) return toast.error("Usuario no cargado");

    const tid = toast.loading("Reclamando bono...");
    try {
      const res = await botApi.claimBonus(userData.id);
      if (res.success) {
        setUserData(prev => ({ ...prev, balance: res.newBalance }));
        toast.success("¡Bono recibido! +0.005 TON", { id: tid });
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Error de conexión";
      toast.error(`Fallo: ${msg}`, { id: tid });
    }
  };

  // Función para compartir link de referidos
  const handleShare = () => {
    const inviteLink = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = "¡Gana TON gratis con esta App! 💎";
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    WebApp.openTelegramLink(fullUrl);
  };

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;
  if (status === 'error') return <div style={s.center}><h2>⚠️ Error de acceso</h2><p>Abre la app desde Telegram</p></div>;

  return (
    <div style={s.container}>
      <Toaster position="top-center" reverseOrder={false} />

      <div style={s.main}>
        {/* CABECERA */}
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
              /* VISTA DE RETIRO */
              <div className="fade-in">
                 <h2 style={{textAlign:'center', marginBottom:'20px'}}>Retirar Balance</h2>
                 <p style={s.helpText}>Mínimo de retiro: 0.1 TON. Asegúrate de usar una red TON (UQ... o EQ...).</p>
                 <input style={s.input} placeholder="Dirección de Wallet TON" />
                 <input style={s.input} type="number" placeholder="Monto" defaultValue="0.1" />
                 <button style={s.btnGreen} onClick={() => toast.error("Saldo insuficiente")}>ENVIAR SOLICITUD</button>
                 <button style={s.btnOutline} onClick={() => setView('main')}>VOLVER AL INICIO</button>
              </div>
            ) : (
              /* VISTA DE HISTORIAL */
              <div className="fade-in">
                 <h2 style={{textAlign:'center', marginBottom:'20px'}}>Historial</h2>
                 <div style={{...s.card, textAlign:'center', color:'#555'}}>
                    <p>No hay transacciones recientes.</p>
                 </div>
                 <button style={s.btnOutline} onClick={() => setView('main')}>VOLVER</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'share' && <ShareTab stats={stats} handleShare={handleShare} />}
      </div>

      {/* BARRA DE NAVEGACIÓN */}
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