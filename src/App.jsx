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
  const [stats, setStats] = useState({ n1: 0, c1: "0.000" });
  
  const [view, setView] = useState('main'); // 'main', 'withdraw', 'history'

  const verifyUser = async (user, startParam) => {
    try {
      const data = await botApi.verifyUser(user, startParam);
      if (data.success) {
        setUserData(data.user);
        setStats(data.stats);
        setStatus('member');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => {
    WebApp.ready(); WebApp.expand();
    const user = WebApp.initDataUnsafe?.user;
    if (!user) { setStatus('error'); return; }
    verifyUser(user, WebApp.initDataUnsafe?.start_param);
  }, []);

  const handleBonus = async () => {
    const tid = toast.loading("Reclamando bono...");
    try {
      const res = await botApi.claimBonus(userData.id);
      if (res.success) {
        setUserData(prev => ({ ...prev, balance: res.newBalance }));
        toast.success("¡Bono recibido! +0.005 TON", { id: tid });
      }
    } catch (e) {
      toast.error(e.response?.data?.error || "Error al cobrar", { id: tid });
    }
  };

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;

  return (
    <div style={s.container}>
      <Toaster position="top-center" />
      
      <div style={s.main}>
        {/* CABECERA DE PERFIL GAMIFICADA */}
        <div style={s.profileHeader}>
          <img 
            src={WebApp.initDataUnsafe?.user?.photo_url || 'https://via.placeholder.com/100'} 
            style={s.profileAvatar} 
            alt="avatar"
          />
          <div>
            <p style={s.profileName}>{userData?.username || 'Gamer'}</p>
            <p style={s.profileId}>ID: {userData?.id}</p>
          </div>
        </div>

        {activeTab === 'home' && (
          <div className="fade-in">
            {/* TARJETA DE BALANCE */}
            <div style={s.cardBalance}>
              <p style={{fontSize:'12px', fontWeight:'bold', letterSpacing:'1px', opacity:0.9}}>TOTAL TON</p>
              <h1 style={{fontSize:'42px', margin:'10px 0', textShadow: '0 4px 10px rgba(0,0,0,0.2)'}}>
                {Number(userData?.balance || 0).toFixed(4)}
              </h1>
              <div style={{fontSize:'14px', opacity:0.8}}>Nivel: Usuario Elite</div>
            </div>

            {/* BOTONES GAMIFICADOS (Action Grid) */}
            <div style={s.actionGrid}>
              <div style={s.actionCard} onClick={() => setView('withdraw')}>
                <span style={{fontSize:'24px', marginBottom:'8px'}}>💸</span>
                RETIRO
              </div>
              <div style={s.actionCard} onClick={handleBonus}>
                <span style={{fontSize:'24px', marginBottom:'8px'}}>🎁</span>
                BONO
              </div>
              <div style={s.actionCard} onClick={() => toast("Próximamente")}>
                <span style={{fontSize:'24px', marginBottom:'8px'}}>📜</span>
                HISTORIA
              </div>
            </div>
            
            <div style={{...s.card, marginTop:'20px', textAlign:'center'}}>
                <p style={{color:'#888', fontSize:'12px'}}>¡Invita amigos para subir de nivel!</p>
            </div>
          </div>
        )}

        {activeTab === 'share' && <ShareTab stats={stats} handleShare={() => {}} />}
      </div>

      {/* NAVEGACIÓN INFERIOR */}
      <div style={s.bottomNav}>
        <div onClick={()=>setActiveTab('home')} style={activeTab === 'home' ? s.navItemActive : s.navItem}>
           <span>🏠</span><span>HOME</span>
        </div>
        <div onClick={()=>setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>
           <span>👥</span><span>RED</span>
        </div>
      </div>

      {/* MODAL DE RETIRO (Simple) */}
      {view === 'withdraw' && (
        <div style={{...s.center, position:'fixed', zIndex:200, padding:'20px', background:'#000'}}>
             <h2>Retirar TON</h2>
             <input style={s.input} placeholder="Dirección TON" />
             <button style={s.btnGreen} onClick={() => setView('main')}>CONFIRMAR</button>
             <button style={s.btnOutline} onClick={() => setView('main')}>CANCELAR</button>
        </div>
      )}
    </div>
  );
}

export default App;