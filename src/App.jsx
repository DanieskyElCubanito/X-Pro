import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';
import crypto from 'crypto-js'; // Asegúrate de tener esta lib o usa la que prefieras

function App() {
  /* --- [ ESTADOS GENERALES ] --- */
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [errorInfo, setErrorInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ 
    n1: 0, n2: 0, n3: 0, 
    c1: "0.000", c2: "0.000", c3: "0.000" 
  });

  /* --- [ ESTADOS DE RETIRO Y SEGURIDAD ] --- */
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [walletAddr, setWalletAddr] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);

  /* --- [ HISTORIAL Y ADS ] --- */
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);

  /* --- [ PROGRESO DE MISIÓN ÚNICA ] --- */
  const [adsWatchedCount, setAdsWatchedCount] = useState(0); 
  const [claimedMissions, setClaimedMissions] = useState([]);
  const DAILY_MISSION_ID = 'daily_100';

  const verifyUser = (user, startParam) => {
    axios.post('/api/verify', { user, start_param: startParam })
      .then(res => {
        if (res.data.success) {
          setUserData(res.data.user);
          setStats(res.data.stats);
          if (res.data.dailyStats) {
            setAdsWatchedCount(res.data.dailyStats.adsWatched || 0);
            setClaimedMissions(res.data.dailyStats.claimedMissions || []);
          }
          setStatus('member');
        } else {
          if (res.data.error === 'USER_BANNED') {
            setStatus('error');
            setErrorInfo(res.data.message || 'Cuenta suspendida.');
          } else if (res.data.error === 'PROXY_DETECTED') {
            setStatus('error');
            setErrorInfo(res.data.message);
          } else if (res.data.error === 'NOT_MEMBER') {
            setStatus('guest');
          } else {
            setStatus('error');
            setErrorInfo('Error inesperado.');
          }
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorInfo('Servidor fuera de línea.');
      });
  };

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor('#000000');
    const user = WebApp.initDataUnsafe?.user;
    const startParam = WebApp.initDataUnsafe?.start_param;
    if (!user) {
      setStatus('error');
      setErrorInfo('Ejecuta la App desde Telegram.');
      return;
    }
    verifyUser(user, startParam);
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`/api/history?userId=${userData.id}`);
      setHistory(res.data.history || []);
      setShowHistory(true);
      WebApp.HapticFeedback.impactOccurred('light');
    } catch (e) { WebApp.showAlert('Error obteniendo historial.'); }
    finally { setLoadingHistory(false); }
  };

  /* --- [ RENDER HOME ] --- */
  const renderHome = () => (
    <div className="tab-content fade-in">
      <div style={s.cardBalance}>
        {!isWithdrawing ? (
          <>
            <p style={{fontSize:'13px', fontWeight:'bold', letterSpacing:'1px', opacity:0.8}}>SALDO DISPONIBLE</p>
            <h1 style={{fontSize:'52px', margin:'15px 0', fontWeight:'900'}}>
              {userData?.balance?.toFixed(5) || '0.000'} <span style={{fontSize:'20px'}}>TON</span>
            </h1>
            <button style={s.btnWhite} onClick={() => {
              if ((userData?.balance || 0) < 0.01) return WebApp.showAlert('⚠️ Mínimo 0.01 TON');
              setIsWithdrawing(true);
            }}>SOLICITAR RETIRO</button>
            <div style={s.badge}>Mínimo: 0.01 TON | Límite: 0.2 TON/Día</div>
          </>
        ) : (
          <div style={{width: '100%'}}>
            <p style={{fontWeight:'bold', marginBottom:'15px', fontSize:'18px'}}>RETIRO SEGURO</p>
            <input type="number" placeholder="Monto (Min: 0.01)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} style={{...s.inputStyle, marginBottom:'10px'}}/>
            <input type="text" placeholder="Dirección TON" value={walletAddr} onChange={(e) => setWalletAddr(e.target.value)} style={s.inputStyle}/>
            <div ref={turnstileRef} style={{marginTop:'15px', display:'flex', justifyContent:'center', minHeight:'65px'}}></div>
            <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
              <button style={s.btnCancel} onClick={() => setIsWithdrawing(false)}>CANCELAR</button>
              <button style={{...s.btnConfirm, backgroundColor: !turnstileToken ? '#555' : '#fff'}} onClick={async () => {
                setIsSubmitting(true);
                try {
                  const res = await axios.post('/api/withdraw', { userId: userData.id, address: walletAddr, amount: parseFloat(withdrawAmount), captchaToken: turnstileToken });
                  if (res.data.success) window.location.reload();
                  else WebApp.showAlert('Error: ' + res.data.error);
                } catch(e) { WebApp.showAlert('Fallo de conexión'); }
                finally { setIsSubmitting(false); }
              }} disabled={!turnstileToken || isSubmitting}>CONFIRMAR</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* CONTINÚA EN PARTE 2... */
/* --- [ RENDER SHARE ] --- */
  const renderShare = () => (
    <div className="tab-content fade-in">
      <div style={s.card}>
        <h4 style={{marginTop:0, color:'#0088cc', fontSize:'18px'}}>SISTEMA DE AFILIADOS</h4>
        <div style={s.row}>
          <div style={s.box}>NIVEL 1<br/><b style={{color:'#fff', fontSize:'14px'}}>0.003 TON</b></div>
          <div style={s.box}>NIVEL 2<br/><b style={{color:'#fff', fontSize:'14px'}}>0.002 TON</b></div>
          <div style={s.box}>NIVEL 3<br/><b style={{color:'#fff', fontSize:'14px'}}>0.001 TON</b></div>
        </div>
        <button style={s.btnGreen} onClick={() => {
          const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
          WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=¡Gana TON con esta App!`);
        }}>🚀 INVITAR AMIGOS</button>
      </div>

      <div style={{...s.card, marginTop:'20px'}}>
        <h4 style={{color:'#aaa', textAlign:'left', fontSize:'12px', marginBottom:'15px', letterSpacing:'1px'}}>ESTADÍSTICAS DE RED</h4>
        <div style={s.statsGrid}>
          <div style={s.statCol}><p style={s.statLabel}>DIRECTOS</p><p style={s.statValue}>{stats.n1}</p><p style={s.statCom}>+{stats.c1} TON</p></div>
          <div style={s.statCol}><p style={s.statLabel}>NIVEL 2</p><p style={s.statValue}>{stats.n2}</p><p style={s.statCom}>+{stats.c2} TON</p></div>
          <div style={s.statCol}><p style={s.statLabel}>NIVEL 3</p><p style={s.statValue}>{stats.n3}</p><p style={s.statCom}>+{stats.c3} TON</p></div>
        </div>
        <div style={s.totalRow}>
          <p style={{fontSize:'11px', color:'#777'}}>TOTAL ACUMULADO:</p>
          <p style={{fontSize:'18px', fontWeight:'bold', color:'#28a745'}}>
            {(parseFloat(stats.c1) + parseFloat(stats.c2) + parseFloat(stats.c3)).toFixed(4)} TON
          </p>
        </div>
      </div>
    </div>
  );

  /* --- [ RENDER MISSIONS ] --- */
  const renderMissions = () => (
    <div className="tab-content fade-in">
      <div style={s.missionCard}>
        <h3 style={{color: '#0088cc', marginBottom:'10px'}}>🎯 Desafío Diario</h3>
        <p style={{fontSize: '14px', color: '#888'}}>Mira 100 anuncios hoy y gana el bonus.</p>
        
        <div style={s.progressContainer}>
          <div style={{...s.progressBar, width: `${Math.min(adsWatchedCount, 100)}%`}}></div>
        </div>
        
        <div style={{display:'flex', justifyContent:'space-between', margin: '15px 0'}}>
          <span style={{fontSize:'13px'}}>Progreso: <b>{adsWatchedCount}/100</b></span>
          <span style={{fontSize:'13px', color:'#28a745'}}>Premio: <b>0.0010 TON</b></span>
        </div>

        <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
          <button style={s.btnAdMain} onClick={() => {
            if (isAdLoading) return;
            setIsAdLoading(true);
            window.showGiga().then(() => {
              setAdsWatchedCount(prev => prev + 1);
              setIsAdLoading(false);
            }).catch(() => setIsAdLoading(false));
          }} disabled={isAdLoading}>
            {isAdLoading ? 'CARGANDO...' : '🎥 VER ANUNCIO (+1)'}
          </button>

          {claimedMissions.includes(DAILY_MISSION_ID) ? (
            <button style={s.btnClaimed} disabled>✅ RECOMPENSA COBRADA</button>
          ) : adsWatchedCount >= 100 ? (
            <button style={s.btnClaimNow} onClick={async () => {
              const res = await axios.post('/api/claim-mission', { userId: userData.id, missionId: DAILY_MISSION_ID });
              if (res.data.success) {
                setUserData(p => ({...p, balance: p.balance + 0.0010}));
                setClaimedMissions(p => [...p, DAILY_MISSION_ID]);
                WebApp.showAlert('✅ Premio cobrado.');
              }
            }}>🎁 COBRAR 0.0010 TON</button>
          ) : (
            <button style={s.btnLocked} disabled>🔒 MIRA {100 - adsWatchedCount} MÁS</button>
          )}
        </div>
      </div>
    </div>
  );

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;

  return (
    <div style={s.container}>
      {/* HISTORIAL MODAL & BOTÓN RECUPERADO */}
      <button onClick={loadHistory} style={s.btnHistoryIcon}>📜</button>
      
      {showHistory && (
        <div style={s.modalOverlay}>
          <div style={s.historyCard}>
            <div style={s.modalHeader}><h3>HISTORIAL</h3><button onClick={() => setShowHistory(false)}>X</button></div>
            <div style={s.historyList}>
              {history.length === 0 ? <p>Sin movimientos.</p> : history.map((h, i) => (
                <div key={i} style={s.historyItem}>
                  <span>{new Date(h.created_at).toLocaleDateString()}</span>
                  <b style={{color:'#ff4444'}}>-{h.amount} TON</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={s.main}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'share' && renderShare()}
        {activeTab === 'missions' && renderMissions()}
      </div>

      <div style={s.bottomNav}>
        <div onClick={() => setActiveTab('home')} style={activeTab === 'home' ? s.navItemActive : s.navItem}>🏠 Home</div>
        <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>👥 Share</div>
        <div onClick={() => setActiveTab('missions')} style={activeTab === 'missions' ? s.navItemActive : s.navItem}>🚀 Missions</div>
      </div>
    </div>
  );
}

const s = {
  container: { backgroundColor:'#000', color:'#fff', minHeight:'100vh', padding:'20px', fontFamily:'Inter, sans-serif' },
  center: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center' },
  loader: { width:'35px', height:'35px', border:'3px solid #111', borderTop:'3px solid #0088cc', borderRadius:'50%' },
  main: { maxWidth:'500px', margin:'0 auto', paddingBottom: '90px', paddingTop: '30px' },
  cardBalance: { background:'linear-gradient(135deg, #0088cc 0%, #004477 100%)', padding:'40px 20px', borderRadius:'32px', textAlign:'center', boxShadow:'0 15px 35px rgba(0,136,204,0.2)' },
  card: { backgroundColor:'#0a0a0a', padding:'25px', borderRadius:'28px', border:'1px solid #1a1a1a', textAlign:'center' },
  btnWhite: { width:'100%', padding:'16px', backgroundColor:'#fff', color:'#0088cc', border:'none', borderRadius:'16px', fontWeight:'900', fontSize:'15px' },
  btnGreen: { width:'100%', padding:'16px', backgroundColor:'#28a745', color:'#fff', border:'none', borderRadius:'16px', fontWeight:'bold' },
  btnHistoryIcon: { position:'absolute', top:'20px', right:'20px', backgroundColor:'#111', border:'1px solid #222', borderRadius:'50%', width:'48px', height:'48px', zIndex:10 },
  bottomNav: { position:'fixed', bottom:0, left:0, right:0, backgroundColor:'#050505', display:'flex', justifyContent:'space-around', padding:'18px 0', borderTop:'1px solid #151515' },
  navItem: { color:'#444', fontSize:'11px', fontWeight:'bold', textAlign:'center' },
  navItemActive: { color:'#0088cc', fontSize:'11px', fontWeight:'bold', textAlign:'center' },
  statsGrid: { display:'flex', justifyContent:'space-between', gap:'10px' },
  statCol: { flex:1, backgroundColor:'#111', padding:'15px 5px', borderRadius:'18px' },
  statLabel: { fontSize:'9px', color:'#555', marginBottom:'5px' },
  statValue: { fontSize:'20px', fontWeight:'bold', margin:0 },
  statCom: { fontSize:'10px', color:'#28a745', marginTop:'4px' },
  totalRow: { marginTop:'20px', paddingTop:'15px', borderTop:'1px solid #1a1a1a', display:'flex', justifyContent:'space-between', alignItems:'center' },
  missionCard: { backgroundColor:'#0a0a0a', padding:'30px', borderRadius:'32px', border:'1px solid #1a1a1a', textAlign:'center' },
  progressContainer: { width:'100%', height:'12px', backgroundColor:'#1a1a1a', borderRadius:'10px', overflow:'hidden' },
  progressBar: { height:'100%', backgroundColor:'#0088cc', transition:'width 0.4s ease' },
  btnAdMain: { backgroundColor:'#fff', color:'#000', padding:'16px', borderRadius:'16px', fontWeight:'bold', border:'none' },
  btnClaimNow: { backgroundColor:'#28a745', color:'#fff', padding:'16px', borderRadius:'16px', fontWeight:'bold', border:'none' },
  btnClaimed: { backgroundColor:'transparent', color:'#28a745', border:'1px solid #28a745', padding:'16px', borderRadius:'16px' },
  btnLocked: { backgroundColor:'#111', color:'#333', padding:'16px', borderRadius:'16px', border:'none' },
  modalOverlay: { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.9)', zIndex:1000, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px' },
  historyCard: { backgroundColor:'#0a0a0a', width:'100%', borderRadius:'28px', border:'1px solid #222', maxHeight:'70vh', overflow:'hidden' },
  modalHeader: { padding:'20px', borderBottom:'1px solid #1a1a1a', display:'flex', justifyContent:'space-between' },
  historyList: { padding:'20px', overflowY:'auto' },
  historyItem: { display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #111' },
  inputStyle: { width:'100%', padding:'16px', backgroundColor:'#111', border:'1px solid #222', color:'#fff', borderRadius:'14px', textAlign:'center' },
  btnCancel: { flex:1, padding:'16px', backgroundColor:'rgba(255,255,255,0.05)', borderRadius:'14px', border:'none', color:'#fff' },
  btnConfirm: { flex:1, padding:'16px', borderRadius:'14px', border:'none', color:'#0088cc', fontWeight:'bold' },
  badge: { fontSize:'10px', color:'#fff', opacity:0.5, marginTop:'12px' },
  box: { flex:1, textAlign:'center', backgroundColor:'#111', padding:'12px 5px', borderRadius:'15px' }
};

export default App;