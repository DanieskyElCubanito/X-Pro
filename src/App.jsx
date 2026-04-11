import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

/**
 * IA PROFIT TON BOT - FRONTEND CORE
 * Dev: @DannyElCallejero | Versión: 4.0 - SOLO ADS (SIN MISIONES)
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

  /* --- [ ESTADOS DE HISTORIAL Y ADS ] --- */
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [adsWatchedCount, setAdsWatchedCount] = useState(0); 

  /* --- [ LÓGICA DE INICIO Y SESIÓN ] --- */
  const verifyUser = (user, startParam) => {
    axios.post('/api/verify', { user, start_param: startParam })
      .then(res => {
        if (res.data.success) {
          setUserData(res.data.user);
          setStats(res.data.stats);
          if (res.data.dailyStats) {
            setAdsWatchedCount(res.data.dailyStats.adsWatched || 0);
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
      .then(async (result) => {
        // Determinamos la recompensa según la acción (clic o vista)
        const action = result?.clicked ? 'click' : 'view';
        const reward = action === 'click' ? 0.0005 : 0.0002;

        try {
          const res = await axios.post('/api/ad-reward', { userId: userData.id, action });
          if (res.data.success) {
            setUserData(prev => ({ ...prev, balance: prev.balance + reward }));
            setAdsWatchedCount(prev => prev + 1);
            WebApp.HapticFeedback.notificationOccurred('success');
            WebApp.showAlert(`✅ +${reward} TON acreditados (${action === 'click' ? 'Clic' : 'Vista'})`);
          } else if (res.data.error === 'LIMIT_REACHED') {
            WebApp.showAlert('⚠️ Has alcanzado el límite diario de 100 anuncios.');
          }
        } catch (e) {
          console.error("Error guardando recompensa");
        }
        setIsAdLoading(false);
      })
      .catch(() => {
        setIsAdLoading(false);
      });
  };

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
    if (isWithdrawing && window.turnstile) {
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
  }, [isWithdrawing]);

  const executeWithdraw = async () => {
    const amountFloat = parseFloat(withdrawAmount);
    if (!walletAddr || walletAddr.trim().length < 40) return WebApp.showAlert('⚠️ Dirección TON inválida.');
    if (isNaN(amountFloat) || amountFloat < 0.01) return WebApp.showAlert('⚠️ Mínimo: 0.01 TON.');
    if (amountFloat > userData.balance) return WebApp.showAlert('⚠️ Saldo insuficiente.');
    if (!turnstileToken) return WebApp.showAlert('⚠️ Completa el captcha.');

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
        WebApp.showAlert('❌ ERROR: ' + res.data.error);
        setIsSubmitting(false);
      }
    } catch (e) {
      WebApp.showAlert('❌ Error de conexión.');
      setIsSubmitting(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`/api/history?userId=${userData.id}`);
      setHistory(res.data.history || []);
      setShowHistory(true);
    } catch (e) { WebApp.showAlert('Error obteniendo historial.'); }
    finally { setLoadingHistory(false); }
  };

  const handleShare = () => {
    const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('💰 ¡Gana TON con IA Profit! 🚀')}`);
  };

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
      {status === 'member' && (        
        <button onClick={loadHistory} style={s.btnHistoryIcon}>📜</button>
      )}

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
                    <span>{new Date(h.created_at).toLocaleDateString()}</span>
                    <span style={{color:'#ff4444', fontWeight:'bold'}}>-{h.amount} TON</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {status === 'guest' ? (
        <div style={s.main}>
          <div style={s.card}>
            <div style={s.iconCircle}>🔔</div>
            <h2>Canal Requerido</h2>
            <button style={s.btnBlue} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>1. UNIRME</button>
            <button style={{...s.btnOutline, marginTop:'12px'}} onClick={() => verifyUser(WebApp.initDataUnsafe.user)}>2. VERIFICAR</button>
          </div>
        </div>
      ) : (
        <div style={s.main}>
           {activeTab === 'home' && (
             <div className="tab-content fade-in">
               <div style={s.cardBalance}>
                  {!isWithdrawing ? (
                    <>
                      <p style={{fontSize:'13px', fontWeight:'bold'}}>SALDO DISPONIBLE</p>
                      <h1 style={{fontSize:'48px', margin:'10px 0'}}>{userData?.balance?.toFixed(5) || '0.000'} <span style={{fontSize:'18px'}}>TON</span></h1>
                      <button style={{...s.btnBlue, backgroundColor:'#fff', color:'#0088cc', marginBottom:'15px'}} onClick={handleWatchAd} disabled={isAdLoading}>
                        {isAdLoading ? 'CARGANDO...' : '🎥 VER ANUNCIO Y GANAR'}
                      </button>
                      <button style={s.btnOutline} onClick={handleStartWithdraw}>SOLICITAR RETIRO</button>
                      <div style={s.badge}>Vistas hoy: {adsWatchedCount}/100</div>
                    </>
                  ) : (
                    <div style={{width: '100%'}}>
                      <input type="number" placeholder="Monto (Min: 0.01)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} style={{...s.inputStyle, marginBottom:'10px'}}/>
                      <input type="text" placeholder="Tu Dirección TON" value={walletAddr} onChange={(e) => setWalletAddr(e.target.value)} style={s.inputStyle}/>
                      <div ref={turnstileRef} style={{marginTop:'15px', display:'flex', justifyContent:'center', minHeight:'65px'}}></div>
                      <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                        <button style={s.btnCancel} onClick={() => setIsWithdrawing(false)}>ATRÁS</button>
                        <button style={s.btnConfirm} onClick={executeWithdraw} disabled={isSubmitting}>{isSubmitting ? '...' : 'RETIRAR'}</button>
                      </div>
                    </div>
                  )}
               </div>
               <div style={{...s.card, marginTop:'10px', backgroundColor:'transparent', border:'1px dashed #333'}}>
                  <p style={{fontSize:'12px', color:'#aaa'}}>Ganancia por Clic: <b>0.0005 TON</b><br/>Ganancia por Vista: <b>0.0002 TON</b></p>
               </div>
             </div>
           )}

           {activeTab === 'share' && (
             <div className="tab-content fade-in">
               <div style={s.card}>
                  <h4 style={{marginTop:0, color:'#0088cc'}}>SISTEMA DE AFILIADOS</h4>
                  <button style={s.btnGreen} onClick={handleShare}>🚀 INVITAR AMIGOS</button>
               </div>
               <div style={{...s.card, marginTop:'20px'}}>
                  <div style={s.statsGrid}>
                    <div style={s.statCol}><p style={s.statLabel}>L1</p><p style={s.statValue}>{stats.n1}</p></div>
                    <div style={s.statCol}><p style={s.statLabel}>L2</p><p style={s.statValue}>{stats.n2}</p></div>
                    <div style={s.statCol}><p style={s.statLabel}>L3</p><p style={s.statValue}>{stats.n3}</p></div>
                  </div>
               </div>
             </div>
           )}
        </div>
      )}

      {status === 'member' && (
        <div style={s.bottomNav}>
          <div onClick={() => setActiveTab('home')} style={activeTab === 'home' ? s.navItemActive : s.navItem}>
            <span>🏠</span><span>Home</span>
          </div>
          <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>
            <span>👥</span><span>Share</span>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { backgroundColor:'#000', color:'#fff', minHeight:'100vh', padding:'20px', fontFamily:'sans-serif' },
  center: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', flexDirection:'column' },
  loader: { width:'30px', height:'30px', border:'3px solid #222', borderTop:'3px solid #0088cc', borderRadius:'50%', animation:'spin 1s linear infinite' },
  main: { maxWidth:'500px', margin:'0 auto', paddingBottom: '80px', paddingTop:'20px' },
  cardBalance: { background:'linear-gradient(135deg, #0088cc, #004466)', padding:'25px', borderRadius:'24px', textAlign:'center', marginBottom:'15px' },
  card: { backgroundColor:'#111', padding:'20px', borderRadius:'24px', textAlign:'center', border:'1px solid #222' },
  btnBlue: { width:'100%', padding:'15px', borderRadius:'14px', border:'none', fontWeight:'bold', cursor:'pointer' },
  btnOutline: { width:'100%', padding:'15px', borderRadius:'14px', border:'1px solid #fff', background:'transparent', color:'#fff', fontWeight:'bold' },
  btnGreen: { width:'100%', padding:'15px', backgroundColor:'#28a745', border:'none', borderRadius:'14px', color:'#fff', fontWeight:'bold' },
  inputStyle: { width:'100%', padding:'12px', borderRadius:'10px', border:'none', boxSizing:'border-box' },
  bottomNav: { position:'fixed', bottom:0, left:0, right:0, backgroundColor:'#0a0a0a', display:'flex', padding:'15px 0', borderTop:'1px solid #222' },
  navItem: { flex:1, textAlign:'center', color:'#555', display:'flex', flexDirection:'column', fontSize:'12px' },
  navItemActive: { flex:1, textAlign:'center', color:'#0088cc', display:'flex', flexDirection:'column', fontSize:'12px' },
  modalOverlay: { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
  historyCard: { backgroundColor:'#111', width:'90%', borderRadius:'20px', border:'1px solid #333' },
  modalHeader: { padding:'15px', borderBottom:'1px solid #222', display:'flex', justifyContent:'space-between' },
  historyList: { padding:'15px', maxHeight:'300px', overflowY:'auto' },
  historyItem: { display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #222' },
  btnHistoryIcon: { position:'absolute', top:'20px', right:'20px', background:'#111', border:'none', fontSize:'20px', cursor:'pointer' },
  statsGrid: { display:'flex', justifyContent:'space-around' },
  statLabel: { fontSize:'12px', color:'#666' },
  statValue: { fontSize:'20px', fontWeight:'bold' },
  btnCancel: { flex:1, padding:'12px', background:'#333', color:'#fff', border:'none', borderRadius:'10px' },
  btnConfirm: { flex:1, padding:'12px', background:'#fff', color:'#0088cc', border:'none', borderRadius:'10px', fontWeight:'bold' }
};

export default App;