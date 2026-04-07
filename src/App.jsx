import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

/**
 * IA PROFIT TON BOT - FRONTEND CORE
 * Dev: @DannyElCallejero | Versión: 3.6 - MISIONES DE ANUNCIOS
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
  
  /* --- [ ESTADOS DE HISTORIAL, ADS Y MISIONES ] --- */
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  
  // Variables para las Misiones (Frontend)
  const [adsWatchedCount, setAdsWatchedCount] = useState(0); 
  const [claimedMissions, setClaimedMissions] = useState([]);

  const missionsData = [
    { id: 1, target: 1, reward: 0.00001 },
    { id: 2, target: 5, reward: 0.00005 },
    { id: 3, target: 10, reward: 0.00010 },
    { id: 4, target: 15, reward: 0.00015 },
    { id: 5, target: 20, reward: 0.00020 },
    { id: 6, target: 25, reward: 0.00025 },
  ];

  /* --- [ LÓGICA DE INICIO Y SESIÓN ] --- */
  const verifyUser = (user, startParam) => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userLang = navigator.language || navigator.userLanguage;

    axios.post('/api/verify', { 
      user, 
      start_param: startParam,
      tz: userTimezone,
      ln: userLang
    })
      .then(res => {
        if (res.data.success) {
          setUserData(res.data.user);
          setStats(res.data.stats);
          
          // --- ESTO ES LO NUEVO: Carga el progreso del día ---
          if (res.data.dailyStats) {
            setAdsWatchedCount(res.data.dailyStats.adsWatched || 0);
            setClaimedMissions(res.data.dailyStats.claimedMissions || []);
          }
          
          setStatus('member');
        } else {
          // ... resto de tu lógica de errores (BANNED, PROXY, etc)
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
        console.error(err);
        setStatus('error');
        setErrorInfo('Servidor fuera de línea.');
      });
  };
  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('#000000');
      WebApp.setBackgroundColor('#000000');
      
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

  /* --- [ LÓGICA DE ANUNCIOS GIGAPUB ] --- */
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
        // El anuncio ya no da dinero directo, solo suma al contador de misiones
        setAdsWatchedCount(prev => prev + 1);
        WebApp.HapticFeedback.notificationOccurred('success');
        WebApp.showAlert('✅ ¡Anuncio visto! Tu progreso ha aumentado.');
        setIsAdLoading(false);
      })
      .catch(e => {
        console.log("Anuncio cerrado");
        setIsAdLoading(false);
      });
  };

  /* --- [ LÓGICA DE RECLAMAR MISIONES ] --- */
const handleClaimMission = async (mission) => {
    try {
        const res = await axios.post('/api/claim-mission', {
            userId: userData.id,
            missionId: mission.id
        });

        if (res.data.success) {
            // 1. Hacemos que el teléfono vibre (feedback)
            WebApp.HapticFeedback.notificationOccurred('success');
            
            // 2. Actualizamos el balance visualmente
            setUserData(prev => ({ 
                ...prev, 
                balance: parseFloat(prev.balance) + parseFloat(res.data.reward) 
            }));

            // 3. AGREGAMOS LA MISIÓN AL ARRAY DE RECLAMADAS (Esto cambia el botón)
            setClaimedMissions(prev => [...prev, mission.id]);

            WebApp.showAlert(`✅ ¡Reclamaste ${res.data.reward} TON!`);
        } else {
            WebApp.showAlert("Error: " + res.data.error);
        }
    } catch (e) {
        WebApp.showAlert("❌ Error al procesar el reclamo");
    }
};

  /* --- [ LÓGICA DE RETIROS FINANCIEROS ] --- */
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
            'expired-callback': () => setTurnstileToken(null),
          });
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isWithdrawing, activeTab]);

  const executeWithdraw = async () => {
    const amountFloat = parseFloat(withdrawAmount);

    if (!walletAddr || walletAddr.trim().length < 40) { 
      WebApp.showAlert('⚠️ Dirección TON inválida.'); return; 
    }
    if (isNaN(amountFloat) || amountFloat < 0.01) {
      WebApp.showAlert('⚠️ Ingresa una cantidad válida (Mín: 0.01 TON).'); return;
    }
    if (amountFloat > userData.balance) {
      WebApp.showAlert('⚠️ No tienes saldo suficiente.'); return;
    }
    if (!turnstileToken) {
      WebApp.showAlert('⚠️ Completa el captcha de seguridad.'); return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/withdraw', { 
        userId: userData.id, 
        address: walletAddr.trim(),
        amount: amountFloat,
        captchaToken: turnstileToken
      });

      if (res.data.success) {
        WebApp.HapticFeedback.notificationOccurred('success');
        WebApp.showAlert('✅ Retiro procesado con éxito.');
        window.location.reload();
      } else {
        WebApp.HapticFeedback.notificationOccurred('error');
        WebApp.showAlert('❌ ERROR: ' + res.data.error);
        setIsSubmitting(false);
      }
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message;
      WebApp.showAlert('❌ DETALLE DEL ERROR: ' + errorMsg);
      setIsSubmitting(false);
    }
  }; 

  /* --- [ UTILIDADES SECUNDARIAS ] --- */
  const handleCheckSubscription = () => {
    const user = WebApp.initDataUnsafe?.user;
    const startParam = WebApp.initDataUnsafe?.start_param;
    setStatus('loading');
    verifyUser(user, startParam);
  };

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

  const handleShare = () => {
    const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = `💰 ¡Gana TON con IA Profit! 🚀`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };

  /* --- [ RENDERIZADO VISUAL ] --- */

  if (status === 'loading') return (
    <div style={s.center}><div style={s.loader}></div><p style={{marginTop:'20px'}}>Cargando...</p></div>
  );

  if (status === 'error') return (
    <div style={s.center}>
      <h2 style={{color:'#ff4444'}}>BLOQUEADO</h2>
      <div style={s.errorBox}>{errorInfo}</div>
      <button style={s.btnWhite} onClick={() => window.location.reload()}>REINTENTAR</button>
    </div>
  );

  return (
    <div style={s.container}>
      {/* BOTÓN DE HISTORIAL */}
      {status === 'member' && (
        <button onClick={loadHistory} style={s.btnHistoryIcon} disabled={loadingHistory}>
          {loadingHistory ? '...' : '📜'}
        </button>
      )}

      {/* MODAL DE HISTORIAL */}
      {showHistory && (
        <div style={s.modalOverlay}>
          <div style={s.historyCard}>
            <div style={s.modalHeader}>
              <h3 style={{margin:0, color:'#ff4444'}}>HISTORIAL</h3>
              <button onClick={() => setShowHistory(false)} style={s.btnClose}>CERRAR</button>
            </div>
            <div style={s.historyList}>
              {history.length === 0 ? <p style={{textAlign:'center', padding:'20px'}}>Sin movimientos.</p> :
                history.map((h, i) => (
                  <div key={i} style={s.historyItem}>
                    <div style={{textAlign:'left'}}>
                      <div style={{fontSize:'12px', color:'#fff'}}>{new Date(h.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{color:'#ff4444', fontWeight:'bold'}}>-{h.amount} TON</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* PANTALLA GUEST */}
      {status === 'guest' ? (
        <div style={s.main}>
          <div style={s.card}>
            <div style={s.iconCircle}>🔔</div>
            <h2>Canal Requerido</h2>
            <button style={s.btnBlue} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>1. UNIRME</button>
            <button style={{...s.btnOutline, marginTop:'12px'}} onClick={handleCheckSubscription}>2. VERIFICAR</button>
          </div>
        </div>
      ) : (
        /* PANTALLA MIEMBRO */
        <div style={s.main}>
           
           {/* --- PESTAÑA: HOME --- */}
           {activeTab === 'home' && (
             <div className="tab-content fade-in">
               <div style={s.cardBalance}>
                  {!isWithdrawing ? (
                    <>
                      <p style={{fontSize:'13px', fontWeight:'bold'}}>SALDO DISPONIBLE</p>
                      <h1 style={{fontSize:'48px', margin:'10px 0'}}>{userData?.balance?.toFixed(5) || '0.000'} <span style={{fontSize:'18px'}}>TON</span></h1>
                      <button style={s.btnWhite} onClick={handleStartWithdraw}>SOLICITAR RETIRO</button>
                      <div style={s.badge}>Min: 0.01 TON | Límite: 0.2 TON/Día</div>
                    </>
                  ) : (
                    <div style={{width: '100%'}}>
                      <p style={{fontWeight:'bold', marginBottom:'15px'}}>RETIRO DE FONDOS</p>
                      <input type="number" placeholder="Monto a retirar (Min: 0.01)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} style={{...s.inputStyle, marginBottom:'10px'}}/>
                      <input type="text" placeholder="Tu Dirección TON" value={walletAddr} onChange={(e) => setWalletAddr(e.target.value)} style={s.inputStyle}/>
                      
                      <div ref={turnstileRef} style={{marginTop:'15px', display:'flex', justifyContent:'center', minHeight:'65px'}}></div>
                      
                      <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                        <button style={s.btnCancel} onClick={() => setIsWithdrawing(false)}>CANCELAR</button>
                        <button style={{...s.btnConfirm, opacity: isSubmitting ? 0.5 : 1, backgroundColor: !turnstileToken && !isSubmitting ? '#555' : '#fff'}} onClick={executeWithdraw} disabled={isSubmitting}>
                          {isSubmitting ? '...' : 'CONFIRMAR'}
                        </button>
                      </div>
                    </div>
                  )}
               </div>
             </div>
           )}

           {/* --- PESTAÑA: SHARE --- */}
           {activeTab === 'share' && (
             <div className="tab-content fade-in">
               <div style={s.card}>
                  <h4 style={{marginTop:0, color:'#0088cc'}}>SISTEMA DE AFILIADOS</h4>
                  <div style={s.row}>
                    <div style={s.box}>NIVEL 1<br/><b style={{color:'#fff'}}>0.003</b></div>
                    <div style={s.box}>NIVEL 2<br/><b style={{color:'#fff'}}>0.002</b></div>
                    <div style={s.box}>NIVEL 3<br/><b style={{color:'#fff'}}>0.001</b></div>
                  </div>
                  <button style={s.btnGreen} onClick={handleShare}>🚀 INVITAR AMIGOS</button>
               </div>

               <div style={{...s.card, marginTop:'20px'}}>
                  <h4 style={{color:'#aaa', textAlign:'left', fontSize:'12px', marginBottom:'15px'}}>TU RED DE TRABAJO</h4>
                  <div style={s.statsGrid}>
                    <div style={s.statCol}><p style={s.statLabel}>DIRECTOS</p><p style={s.statValue}>{stats.n1}</p><p style={s.statCom}>+{stats.c1} TON</p></div>
                    <div style={s.statCol}><p style={s.statLabel}>NIVEL 2</p><p style={s.statValue}>{stats.n2}</p><p style={s.statCom}>+{stats.c2} TON</p></div>
                    <div style={s.statCol}><p style={s.statLabel}>NIVEL 3</p><p style={s.statValue}>{stats.n3}</p><p style={s.statCom}>+{stats.c3} TON</p></div>
                  </div>
                  <div style={s.totalRow}>
                    <p style={{fontSize:'11px'}}>TOTAL GANADO:</p>
                    <p style={{fontSize:'16px', fontWeight:'bold', color:'#28a745'}}>{(parseFloat(stats.c1) + parseFloat(stats.c2) + parseFloat(stats.c3)).toFixed(3)} TON</p>
                  </div>
               </div>
             </div>
           )}

           {/* --- PESTAÑA: MISSIONS --- */}
           {activeTab === 'missions' && (
             <div className="tab-content fade-in">
               <div style={{...s.card, border:'1px solid #28a745', marginBottom:'20px'}}>
                  <h4 style={{marginTop:0, color:'#28a745'}}>📺 ANUNCIOS RECOMPENSADOS</h4>
                  <p style={{fontSize:'12px', color:'#aaa', marginBottom:'15px'}}>
                    Mira un video corto para ganar increíbles recompensas<br/>
                  </p>
                  <button style={{...s.btnGreen, backgroundColor: isAdLoading ? '#1a3a1a' : '#28a745', opacity: isAdLoading ? 0.7 : 1}} onClick={handleWatchAd} disabled={isAdLoading}>
                    {isAdLoading ? 'CARGANDO VIDEO...' : '🎥 VER VIDEO Y GANAR'}
                  </button>
               </div>

               {/* LISTA DE MISIONES */}
               <div style={{...s.card}}>
                  <h4 style={{marginTop:0, color:'#fff', textAlign:'left'}}>🎯 Misiones por Anuncios</h4>
                  <p style={{fontSize:'12px', color:'#aaa', textAlign:'left', marginBottom:'15px'}}>
                    Anuncios vistos actualmente: <b style={{color:'#0088cc'}}>{adsWatchedCount}</b>
                  </p>
                  
                  {missionsData.map((m) => {
                    const isClaimed = claimedMissions.includes(m.id);
                    const isUnlocked = adsWatchedCount >= m.target;
                    
                    return (
                      <div key={m.id} style={s.missionRow}>
                        <div style={{textAlign:'left', fontSize:'13px'}}>
                          📺 Ver {m.target} Anuncio{m.target > 1 ? 's' : ''} <br/>
                          <span style={{color:'#28a745', fontWeight:'bold'}}>🎁 {m.reward.toFixed(5)} TON</span>
                        </div>
                        <div>
                          {isClaimed ? (
                            <button style={s.btnMissionClaimed} disabled>✅ Reclamado</button>
                          ) : isUnlocked ? (
                            <button style={s.btnMissionClaim} onClick={() => handleClaimMission(m)}>✅ Reclamar</button>
                          ) : (
                            <button style={s.btnMissionLocked} disabled>🔒 Bloqueado</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
               </div>
             </div>
           )}
        </div>
      )}

      {/* --- BARRA INFERIOR --- */}
      {status === 'member' && (
        <div style={s.bottomNav}>
          <div onClick={() => setActiveTab('home')} style={activeTab === 'home' ? s.navItemActive : s.navItem}>
            <span style={{fontSize:'20px'}}>🏠</span><span>Home</span>
          </div>
          <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>
            <span style={{fontSize:'20px'}}>👥</span><span>Share</span>
          </div>
          <div onClick={() => setActiveTab('missions')} style={activeTab === 'missions' ? s.navItemActive : s.navItem}>
            <span style={{fontSize:'20px'}}>🚀</span><span>Missions</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- ESTILOS CSS --- */
const s = {
  container: { backgroundColor:'#000', color:'#fff', minHeight:'100vh', padding:'20px', fontFamily:'Inter, sans-serif' },
  center: { height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center' },
  loader: { width:'40px', height:'40px', border:'3px solid #333', borderTop:'3px solid #0088cc', borderRadius:'50%' },
  main: { display:'flex', flexDirection:'column', maxWidth:'500px', margin:'0 auto', width:'100%', paddingBottom: '80px', paddingTop: '40px' }, 
  cardBalance: { background:'linear-gradient(135deg, #0088cc 0%, #005588 100%)', padding:'30px 20px', borderRadius:'24px', textAlign:'center', marginBottom:'20px', display:'flex', flexDirection:'column', alignItems:'center', width:'100%', boxSizing:'border-box' },
  card: { backgroundColor:'#111', padding:'20px', borderRadius:'24px', textAlign:'center', border:'1px solid #1a1a1a', width:'100%', boxSizing:'border-box' },
  badge: { fontSize:'10px', backgroundColor:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:'20px', marginTop:'10px', display:'inline-block' },
  iconCircle: { width:'60px', height:'60px', backgroundColor:'#1a1a1a', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', fontSize:'24px' },
  btnBlue: { width:'100%', padding:'16px', backgroundColor:'#0088cc', border:'none', borderRadius:'14px', color:'#fff', fontWeight:'bold' },
  btnOutline: { width:'100%', padding:'16px', backgroundColor:'transparent', border:'2px solid #333', borderRadius:'14px', color:'#fff', fontWeight:'bold' },
  btnWhite: { width:'100%', padding:'14px', backgroundColor:'#fff', color:'#0088cc', border:'none', borderRadius:'14px', fontWeight:'900' },
  btnGreen: { width:'100%', padding:'16px', backgroundColor:'#28a745', border:'none', borderRadius:'14px', color:'#fff', fontWeight:'bold' },
  row: { display:'flex', justifyContent:'space-around', margin:'20px 0' },
  box: { fontSize:'10px', color:'#666', textAlign:'center' },
  statsGrid: { display:'flex', justifyContent:'space-between', marginTop:'10px' },
  statCol: { flex:1, textAlign:'center' },
  statLabel: { fontSize:'10px', color:'#555', marginBottom:'5px' },
  statValue: { fontSize:'18px', fontWeight:'bold', margin:'0' },
  statCom: { fontSize:'11px', color:'#28a745', fontWeight:'bold', marginTop:'5px' },
  totalRow: { marginTop:'20px', paddingTop:'15px', borderTop:'1px solid #1a1a1a', display:'flex', justifyContent:'space-between', alignItems:'center' },
  inputStyle: { width:'100%', padding:'15px', borderRadius:'12px', border:'none', textAlign:'center', backgroundColor:'#fff', color:'#000', fontWeight:'bold', boxSizing:'border-box' },
  btnCancel: { flex:1, padding:'14px', backgroundColor:'rgba(0,0,0,0.3)', color:'#fff', border:'none', borderRadius:'12px' },
  btnConfirm: { flex:1, padding:'14px', backgroundColor:'#fff', color:'#0088cc', border:'none', borderRadius:'12px', fontWeight:'bold' },
  btnHistoryIcon: { position:'absolute', top:'20px', right:'20px', backgroundColor:'#111', border:'1px solid #222', borderRadius:'50%', width:'45px', height:'45px', fontSize:'20px', zIndex:10, cursor:'pointer' },
  bottomNav: { position:'fixed', bottom:0, left:0, right:0, backgroundColor:'#0a0a0a', display:'flex', justifyContent:'space-around', padding:'12px 0 20px 0', borderTop:'1px solid #222', zIndex:100 },
  navItem: { color:'#555', display:'flex', flexDirection:'column', alignItems:'center', fontSize:'11px', fontWeight:'bold', cursor:'pointer', transition: 'color 0.2s', width: '33%' },
  navItemActive: { color:'#0088cc', display:'flex', flexDirection:'column', alignItems:'center', fontSize:'11px', fontWeight:'bold', cursor:'pointer', width: '33%' },
  modalOverlay: { position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px' },
  historyCard: { backgroundColor:'#111', width:'100%', maxWidth:'400px', borderRadius:'24px', border:'1px solid #333', display:'flex', flexDirection:'column', maxHeight:'80vh' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px', borderBottom:'1px solid #222' },
  btnClose: { backgroundColor:'transparent', color:'#aaa', border:'none', fontWeight:'bold', cursor:'pointer' },
  historyList: { padding:'20px', overflowY:'auto' },
  historyItem: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #222' },
  
  /* --- ESTILOS DE LAS MISIONES --- */
  missionRow: { 
    display:'flex', 
    justifyContent:'space-between', 
    alignItems:'center', 
    padding:'15px 0', 
    borderBottom:'1px solid #222' 
  },
  btnMissionLocked: { 
    backgroundColor:'#222', 
    color:'#666', 
    border:'1px solid #333', 
    padding:'8px 14px', 
    borderRadius:'10px', 
    fontSize:'11px', 
    fontWeight:'bold',
    minWidth:'100px'
  },
  btnMissionClaim: { 
    backgroundColor:'#0088cc', 
    color:'#fff', 
    border:'none', 
    padding:'8px 14px', 
    borderRadius:'10px', 
    fontSize:'11px', 
    fontWeight:'bold', 
    cursor:'pointer',
    minWidth:'100px'
  },
  btnMissionClaimed: { 
    backgroundColor:'transparent', 
    color:'#28a745', 
    border:'1px solid #28a745', 
    padding:'8px 14px', 
    borderRadius:'10px', 
    fontSize:'11px', 
    fontWeight:'bold',
    minWidth:'100px'
  }
};

export default App;