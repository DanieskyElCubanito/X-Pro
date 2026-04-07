import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

/**
 * IA PROFIT TON BOT - FRONTEND CORE
 * Versión: 3.7 - MISIÓN DIARIA ÚNICA (100 ADS)
 */

function App() {
  /* --- [ ESTADOS GENERALES Y NAVEGACIÓN ] --- */
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [errorInfo, setErrorInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ 
    n1: 0, n2: 0, n3: 0, 
    c1: "0.000", c2: "0.000", c3: "0.000" 
  });

  /* --- [ ESTADOS DE RETIRO ] --- */
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [walletAddr, setWalletAddr] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);

  /* --- [ ESTADOS DE HISTORIAL Y PROGRESO ] --- */
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);

  // --- CONFIGURACIÓN DE MISIÓN ÚNICA ---
  const [adsWatchedCount, setAdsWatchedCount] = useState(0); 
  const [claimedMissions, setClaimedMissions] = useState([]); // Guardará ['daily_100'] si ya cobró
  const DAILY_MISSION = { id: 'daily_100', target: 100, reward: 0.0010 };

  /* --- [ LÓGICA DE INICIO Y SESIÓN ] --- */
  const verifyUser = (user, startParam) => {
    axios.post('/api/verify', { 
      user, 
      start_param: startParam
    })
      .then(res => {
        if (res.data.success) {
          setUserData(res.data.user);
          setStats(res.data.stats);

          // Carga el progreso del día enviado por el servidor
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
      .catch(err => {
        setStatus('error');
        setErrorInfo('Servidor fuera de línea.');
      });
  };

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      const user = WebApp.initDataUnsafe?.user;
      const startParam = WebApp.initDataUnsafe?.start_param;

      if (!user) {
        setStatus('error');
        setErrorInfo('Ejecuta la App desde Telegram.');
        return;
      }
      verifyUser(user, startParam);
    } catch (e) {
      setStatus('error');
      setErrorInfo('Fallo en SDK: ' + e.message);
    }
  }, []);

  /* --- [ LÓGICA DE ANUNCIOS ] --- */
  const handleWatchAd = () => {
    if (isAdLoading) return;
    setIsAdLoading(true);

    if (typeof window.showGiga !== 'function') {
      WebApp.showAlert('⚠️ El sistema de anuncios se está cargando...');
      setIsAdLoading(false);
      return;
    }

    window.showGiga()
      .then(() => {
        setAdsWatchedCount(prev => prev + 1);
        WebApp.HapticFeedback.notificationOccurred('success');
        setIsAdLoading(false);
      })
      .catch(e => {
        setIsAdLoading(false);
      });
  };

  /* --- [ LÓGICA DE RECLAMAR RECOMPENSA ] --- */
  const handleClaimMission = async () => {
    try {
        const res = await axios.post('/api/claim-mission', {
            userId: userData.id,
            missionId: DAILY_MISSION.id
        });

        if (res.data.success) {
            WebApp.HapticFeedback.notificationOccurred('success');
            setUserData(prev => ({ 
                ...prev, 
                balance: parseFloat(prev.balance) + DAILY_MISSION.reward 
            }));
            setClaimedMissions(prev => [...prev, DAILY_MISSION.id]);
            WebApp.showAlert(`✅ ¡Has reclamado ${DAILY_MISSION.reward} TON!`);
        } else {
            WebApp.showAlert("Error: " + res.data.error);
        }
    } catch (e) {
        WebApp.showAlert("❌ Error al procesar el reclamo");
    }
};

/* --- CONTINÚA EN LA PARTE 2 --- */
/* --- [ LÓGICA DE RETIROS ] --- */
  const handleStartWithdraw = () => {
    if ((userData?.balance || 0) < 0.01) {
      WebApp.showAlert('⚠️ Mínimo de retiro: 0.01 TON');
      return;
    }
    setWithdrawAmount(''); 
    setTurnstileToken(null);
    setIsWithdrawing(true);
  };

  useEffect(() => {
    if (isWithdrawing && window.turnstile && activeTab === 'home') {
      const timeout = setTimeout(() => {
        if (turnstileRef.current) {
          turnstileRef.current.innerHTML = ''; 
          window.turnstile.render(turnstileRef.current, {
            sitekey: '0x4AAAAAACqyiOXggbsrQdnA',
            callback: (token) => setTurnstileToken(token),
          });
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isWithdrawing, activeTab]);

  const executeWithdraw = async () => {
    const amountFloat = parseFloat(withdrawAmount);
    if (!walletAddr || walletAddr.trim().length < 40) { WebApp.showAlert('⚠️ Dirección TON inválida.'); return; }
    if (isNaN(amountFloat) || amountFloat < 0.01) { WebApp.showAlert('⚠️ Mínimo: 0.01 TON.'); return; }
    if (amountFloat > userData.balance) { WebApp.showAlert('⚠️ Saldo insuficiente.'); return; }
    if (!turnstileToken) { WebApp.showAlert('⚠️ Completa el captcha.'); return; }

    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/withdraw', { 
        userId: userData.id, 
        address: walletAddr.trim(),
        amount: amountFloat,
        captchaToken: turnstileToken
      });
      if (res.data.success) {
        WebApp.showAlert('✅ Retiro procesado.');
        window.location.reload();
      } else {
        WebApp.showAlert('❌ ERROR: ' + res.data.error);
        setIsSubmitting(false);
      }
    } catch (e) {
      setIsSubmitting(false);
    }
  }; 

  const handleShare = () => {
    const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=¡Gana TON con IA Profit!`);
  };

  /* --- [ RENDERIZADO ] --- */
  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;
  if (status === 'error') return (
    <div style={s.center}>
      <h2 style={{color:'#ff4444'}}>BLOQUEADO</h2>
      <div style={s.errorBox}>{errorInfo}</div>
      <button style={s.btnWhite} onClick={() => window.location.reload()}>REINTENTAR</button>
    </div>
  );

  return (
    <div style={s.container}>
      {/* BOTÓN HISTORIAL */}
      {status === 'member' && <button onClick={() => setShowHistory(true)} style={s.btnHistoryIcon}>📜</button>}

      {/* MODAL HISTORIAL */}
      {showHistory && (
        <div style={s.modalOverlay}>
          <div style={s.historyCard}>
            <div style={s.modalHeader}><h3>HISTORIAL</h3><button onClick={() => setShowHistory(false)}>X</button></div>
            <div style={s.historyList}>{history.length === 0 ? <p>Sin movimientos.</p> : history.map((h, i) => <div key={i} style={s.historyItem}><span>{h.amount} TON</span></div>)}</div>
          </div>
        </div>
      )}

      {status === 'guest' ? (
        <div style={s.main}><div style={s.card}><h2>Canal Requerido</h2><button style={s.btnBlue} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>UNIRME</button></div></div>
      ) : (
        <div style={s.main}>
           {activeTab === 'home' && (
             <div style={s.cardBalance}>
                {!isWithdrawing ? (
                  <>
                    <p>SALDO DISPONIBLE</p>
                    <h1>{userData?.balance?.toFixed(5) || '0.000'} TON</h1>
                    <button style={s.btnWhite} onClick={handleStartWithdraw}>RETIRAR</button>
                  </>
                ) : (
                  <div style={{width:'100%'}}>
                    <input type="number" placeholder="Monto" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} style={s.inputStyle}/>
                    <input type="text" placeholder="Dirección TON" value={walletAddr} onChange={(e) => setWalletAddr(e.target.value)} style={{...s.inputStyle, marginTop:'10px'}}/>
                    <div ref={turnstileRef} style={{marginTop:'15px'}}></div>
                    <button style={s.btnConfirm} onClick={executeWithdraw}>CONFIRMAR</button>
                  </div>
                )}
             </div>
           )}

           {activeTab === 'share' && (
             <div style={s.card}>
                <h4 style={{color:'#0088cc'}}>SISTEMA DE AFILIADOS</h4>
                <button style={s.btnGreen} onClick={handleShare}>🚀 INVITAR AMIGOS</button>
                <div style={s.statsGrid}>
                  <div style={s.statCol}><p>D: {stats.n1}</p></div>
                  <div style={s.statCol}><p>L2: {stats.n2}</p></div>
                  <div style={s.statCol}><p>L3: {stats.n3}</p></div>
                </div>
             </div>
           )}

           {activeTab === 'missions' && (
             <div className="tab-content fade-in">
               <div style={s.missionCard}>
                  <h3 style={{color: '#0088cc', margin:0}}>🎯 Desafío Diario</h3>
                  <p style={{fontSize: '13px', color: '#aaa'}}>Mira 100 anuncios hoy para ganar el bonus.</p>
                  
                  {/* Barra de Progreso */}
                  <div style={s.progressContainer}>
                    <div style={{...s.progressBar, width: `${Math.min(adsWatchedCount, 100)}%`}}></div>
                  </div>
                  
                  <div style={{display:'flex', justifyContent:'space-between', margin: '10px 0'}}>
                    <span style={{fontSize:'12px'}}>Progreso: <b>{adsWatchedCount}/100</b></span>
                    <span style={{fontSize:'12px', color:'#28a745'}}>Premio: <b>0.0010 TON</b></span>
                  </div>

                  <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <button style={s.btnAdMain} onClick={handleWatchAd} disabled={isAdLoading}>
                      {isAdLoading ? 'CARGANDO...' : '🎥 VER ANUNCIO (+1)'}
                    </button>

                    {claimedMissions.includes('daily_100') ? (
                      <button style={s.btnClaimed} disabled>✅ RECOMPENSA COBRADA</button>
                    ) : adsWatchedCount >= 100 ? (
                      <button style={s.btnClaimNow} onClick={handleClaimMission}>🎁 COBRAR 0.0010 TON</button>
                    ) : (
                      <button style={s.btnLocked} disabled>🔒 MIRA {100 - adsWatchedCount} MÁS</button>
                    )}
                  </div>
               </div>
             </div>
           )}
        </div>
      )}

      {status === 'member' && (
        <div style={s.bottomNav}>
          <div onClick={() => setActiveTab('home')} style={activeTab === 'home' ? s.navItemActive : s.navItem}>🏠 Home</div>
          <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>👥 Share</div>
          <div onClick={() => setActiveTab('missions')} style={activeTab === 'missions' ? s.navItemActive : s.navItem}>🚀 Missions</div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { backgroundColor:'#000', color:'#fff', minHeight:'100vh', padding:'20px', fontFamily:'Inter, sans-serif' },
  center: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center' },
  loader: { width:'30px', height:'30px', border:'3px solid #333', borderTop:'3px solid #0088cc', borderRadius:'50%' },
  main: { maxWidth:'500px', margin:'0 auto', paddingBottom: '80px', paddingTop: '20px' },
  cardBalance: { background:'linear-gradient(135deg, #0088cc 0%, #005588 100%)', padding:'30px', borderRadius:'24px', textAlign:'center', marginBottom:'20px' },
  card: { backgroundColor:'#111', padding:'20px', borderRadius:'24px', textAlign:'center', border:'1px solid #1a1a1a' },
  inputStyle: { width:'100%', padding:'15px', borderRadius:'12px', border:'none', textAlign:'center' },
  btnConfirm: { width:'100%', padding:'15px', marginTop:'15px', borderRadius:'12px', border:'none', fontWeight:'bold', backgroundColor:'#fff' },
  btnWhite: { width:'100%', padding:'14px', backgroundColor:'#fff', border:'none', borderRadius:'14px', fontWeight:'900' },
  btnBlue: { width:'100%', padding:'16px', backgroundColor:'#0088cc', color:'#fff', border:'none', borderRadius:'14px' },
  btnGreen: { width:'100%', padding:'16px', backgroundColor:'#28a745', color:'#fff', border:'none', borderRadius:'14px' },
  btnHistoryIcon: { position:'absolute', top:'20px', right:'20px', backgroundColor:'#111', border:'1px solid #222', borderRadius:'50%', width:'45px', height:'45px' },
  bottomNav: { position:'fixed', bottom:0, left:0, right:0, backgroundColor:'#0a0a0a', display:'flex', justifyContent:'space-around', padding:'15px 0', borderTop:'1px solid #222' },
  navItem: { color:'#555', fontSize:'11px', textAlign:'center' },
  navItemActive: { color:'#0088cc', fontSize:'11px', textAlign:'center' },
  
  /* ESTILOS PROFESIONALES DE MISIÓN */
  missionCard: { backgroundColor: '#111', padding: '25px', borderRadius: '24px', border: '1px solid #222', textAlign: 'center' },
  progressContainer: { width: '100%', height: '10px', backgroundColor: '#222', borderRadius: '10px', marginTop: '15px', overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#0088cc', transition: 'width 0.3s ease' },
  btnAdMain: { backgroundColor: '#fff', color: '#000', border: 'none', padding: '15px', borderRadius: '14px', fontWeight: 'bold' },
  btnClaimNow: { backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '15px', borderRadius: '14px', fontWeight: 'bold' },
  btnClaimed: { backgroundColor: 'transparent', color: '#28a745', border: '1px solid #28a745', padding: '15px', borderRadius: '14px', fontWeight: 'bold' },
  btnLocked: { backgroundColor: '#1a1a1a', color: '#444', border: 'none', padding: '15px', borderRadius: '14px', fontWeight: 'bold' }
};

export default App;