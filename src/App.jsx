import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

/**
 * IA PROFIT TON BOT - FRONTEND CORE
 * Versión: 2.5.1 - ESTABLE
 */

function App() {
  const [status, setStatus] = useState('loading');
  const [userData, setUserData] = useState(null);
  const [errorInfo, setErrorInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ n1: 0, n2: 0, n3: 0, c1: "0.00", c2: "0.00", c3: "0.00" });
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [walletAddr, setWalletAddr] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // FUNCIÓN CORREGIDA: Verifica al usuario
  const verifyUser = (user, startParam) => {
    axios.post('/api/verify', { user, start_param: startParam })
      .then(res => {
        if (res.data.success) {
          setUserData(res.data.user);
          setStats(res.data.stats);
          setStatus('member');
        } else {
          if(res.data.error === 'USER_BANNED') {
             setStatus('error');
             setErrorInfo('Cuenta suspendida por infracción de las normas.');
          } else {
             setStatus('guest');
          }
        }
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
        setErrorInfo('Servidor no disponible. Verifica tu conexión.');
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
        setErrorInfo('Inicia la aplicación desde el bot oficial de Telegram.');
        return;
      }
      verifyUser(user, startParam);
    } catch (e) {
      setStatus('error');
      setErrorInfo('Error SDK: ' + e.message);
    }
  }, []);

  // CORRECCIÓN: Definición de la función para abrir el menú de retiro
  const handleStartWithdraw = () => {
    if ((userData?.balance || 0) < 0.1) {
      WebApp.showAlert('⚠️ El mínimo de retiro es 0.1 TON');
      return;
    }
    setIsWithdrawing(true);
  };

  useEffect(() => {
    if (isWithdrawing && window.turnstile) {
      setTimeout(() => {
        if (turnstileRef.current) {
          window.turnstile.render(turnstileRef.current, {
            sitekey: '0x4AAAAAACqyiOXggbsrQdnA',
            callback: (token) => setTurnstileToken(token),
          });
        }
      }, 300);
    }
  }, [isWithdrawing]);

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
    } catch (e) {
      WebApp.showAlert('Error al cargar historial.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShare = () => {
    const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = `💰 ¡Gana TON con IA Profit! Referidos de 3 niveles. 🚀`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };

  const executeWithdraw = async () => {
    if (!walletAddr || walletAddr.length < 20) {
      WebApp.showAlert('⚠️ Dirección TON inválida.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/withdraw', { 
        userId: userData.id, 
        address: walletAddr.trim(),
        captchaToken: turnstileToken
      });

      if (res.data.success) {
        WebApp.showAlert('✅ Pago procesado. Revisa el canal de pagos.');
        window.location.reload();
      } else {
        WebApp.showAlert('❌ ERROR: ' + res.data.error);
        setIsSubmitting(false);
      }
    } catch (e) {
      WebApp.showAlert('❌ Error de red.');
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div><p>Cargando Dashboard...</p></div>;

  if (status === 'error') return <div style={s.center}><h2 style={{color: '#ff4444'}}>SISTEMA BLOQUEADO</h2><div style={s.errorBox}>{errorInfo}</div><button style={s.btnWhite} onClick={() => window.location.reload()}>REINTENTAR</button></div>;

  return (
    <div style={s.container}>
      {status === 'member' && <button onClick={loadHistory} style={s.btnHistoryIcon}>{loadingHistory ? '...' : '📜'}</button>}
      
      {showHistory && (
        <div style={s.modalOverlay}>
          <div style={s.historyCard}>
            <div style={s.modalHeader}><h3>HISTORIAL</h3><button onClick={() => setShowHistory(false)} style={s.btnClose}>X</button></div>
            <div style={s.historyList}>
              {history.map((h, i) => (
                <div key={i} style={s.historyItem}>
                  <span>{new Date(h.created_at).toLocaleDateString()}</span>
                  <span style={{color:'#ff4444'}}>-{h.amount} TON</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === 'guest' ? (
        <div style={s.main}>
          <div style={s.card}>
            <h2>Canal Requerido</h2>
            <p>Únete para activar tus ganancias.</p>
            <button style={s.btnBlue} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>1. UNIRME</button>
            <button style={{...s.btnOutline, marginTop: '10px'}} onClick={handleCheckSubscription}>2. VERIFICAR</button>
          </div>
        </div>
      ) : (
        <div style={s.main}>
           <div style={s.cardBalance}>
              {!isWithdrawing ? (
                <>
                  <p>SALDO DISPONIBLE</p>
                  <h1>{userData?.balance?.toFixed(3) || '0.000'} <span style={{fontSize: '18px'}}>TON</span></h1>
                  <button style={s.btnWhite} onClick={handleStartWithdraw}>RETIRAR FONDOS</button>
                </>
              ) : (
                <>
                  <input type="text" placeholder="Billetera TON" value={walletAddr} onChange={(e) => setWalletAddr(e.target.value)} style={s.inputStyle}/>
                  <div ref={turnstileRef} style={{marginTop: '15px'}}></div>
                  <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                    <button style={s.btnCancel} onClick={() => setIsWithdrawing(false)}>VOLVER</button>
                    <button style={s.btnConfirm} onClick={executeWithdraw} disabled={!turnstileToken || isSubmitting}>{isSubmitting ? '...' : 'CONFIRMAR'}</button>
                  </div>
                </>
              )}
           </div>
           {/* Estadísticas */}
           <div style={s.card}>
              <button style={s.btnGreen} onClick={handleShare}>🚀 INVITAR AMIGOS</button>
              <div style={s.statsGrid}>
                <div style={s.statCol}><p style={s.statLabel}>L1</p><p style={s.statValue}>{stats.n1}</p></div>
                <div style={s.statCol}><p style={s.statLabel}>L2</p><p style={s.statValue}>{stats.n2}</p></div>
                <div style={s.statCol}><p style={s.statLabel}>L3</p><p style={s.statValue}>{stats.n3}</p></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// ESTILOS (Mantener los que ya tienes, solo asegúrate de que existan estos básicos)
const s = {
  container: { backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' },
  center: { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  loader: { width: '30px', height: '30px', border: '3px solid #333', borderTop: '3px solid #0088cc', borderRadius: '50%' },
  main: { maxWidth: '500px', margin: '0 auto' },
  cardBalance: { background: '#0088cc', padding: '20px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px' },
  card: { backgroundColor: '#111', padding: '20px', borderRadius: '20px', textAlign: 'center' },
  btnBlue: { width: '100%', padding: '15px', backgroundColor: '#0088cc', color: '#fff', border: 'none', borderRadius: '12px' },
  btnOutline: { width: '100%', padding: '15px', backgroundColor: 'transparent', border: '1px solid #333', color: '#fff', borderRadius: '12px' },
  btnWhite: { width: '100%', padding: '15px', backgroundColor: '#fff', color: '#0088cc', border: 'none', borderRadius: '12px', fontWeight: 'bold' },
  btnGreen: { width: '100%', padding: '15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '12px', marginBottom: '15px' },
  statsGrid: { display: 'flex', justifyContent: 'space-between' },
  statCol: { textAlign: 'center' },
  statLabel: { fontSize: '12px', color: '#666' },
  statValue: { fontSize: '18px', fontWeight: 'bold' },
  inputStyle: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none' },
  btnCancel: { flex: 1, padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px' },
  btnConfirm: { flex: 1, padding: '10px', backgroundColor: '#fff', color: '#0088cc', border: 'none', borderRadius: '8px' },
  btnHistoryIcon: { position: 'absolute', top: '10px', right: '10px', padding: '10px', borderRadius: '50%', background: '#111', border: 'none' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  historyCard: { background: '#111', padding: '20px', borderRadius: '20px', width: '80%' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  historyList: { maxHeight: '200px', overflowY: 'auto' },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' },
  btnClose: { background: 'none', color: '#ff4444', border: 'none' },
  errorBox: { background: '#200', padding: '15px', borderRadius: '10px', border: '1px solid #f00', margin: '15px 0' }
};

export default App;
