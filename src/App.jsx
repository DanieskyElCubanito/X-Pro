import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

function App() {
  const [status, setStatus] = useState('loading');
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ n1: 0, n2: 0, n3: 0, c1: 0, c2: 0, c3: 0 });
  const [errorInfo, setErrorInfo] = useState('');

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [walletAddr, setWalletAddr] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  
  // Estado para el Token de Cloudflare
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);

  const verifyUser = (user, startParam) => {
    axios.post('/api/verify', { user, start_param: startParam })
      .then(res => {
        if (res.data.success) {
          // Si el usuario está baneado en la DB, lo sacamos
          if (res.data.user.is_banned) {
            setStatus('error');
            setErrorInfo('Tu cuenta ha sido suspendida por incumplir las reglas de multicuentas.');
            return;
          }
          setUserData(res.data.user);
          setStats(res.data.stats);
          setStatus('member');
        } else {
          setStatus('guest');
        }
      })
      .catch(err => {
        setStatus('error');
        setErrorInfo(err.response?.data?.error || err.message);
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
        setErrorInfo('No se detectó usuario de Telegram.');
        return;
      }
      verifyUser(user, startParam);
    } catch (e) {
      setStatus('error');
      setErrorInfo('Fallo crítico: ' + e.message);
    }
  }, []);

  // Lógica para renderizar el widget de Cloudflare cuando se abre el retiro
  useEffect(() => {
    if (isWithdrawing && window.turnstile) {
      window.turnstile.render(turnstileRef.current, {
        sitekey: '0x4AAAAAACqyiOXggbsrQdnA',
        callback: (token) => setTurnstileToken(token),
      });
    }
  }, [isWithdrawing]);

  const handleCheckSubscription = () => {
    const user = WebApp.initDataUnsafe?.user;
    const startParam = WebApp.initDataUnsafe?.start_param;
    setStatus('loading');
    axios.post('/api/verify', { user, start_param: startParam })
      .then(res => {
        if (res.data.success) {
          setUserData(res.data.user);
          setStats(res.data.stats);
          setStatus('member');
          WebApp.HapticFeedback.notificationOccurred('success');
        } else {
          setStatus('guest');
          WebApp.showAlert('❌ Suscríbete primero al canal.');
        }
      }).catch(() => setStatus('guest'));
  };

  const handleShare = () => {
    const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = `¡Gana TON en 3 niveles con IA Profit! 🚀`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(`/api/history?userId=${userData.id}`);
      setHistory(res.data.history || []);
      setShowHistory(true);
    } catch (e) {
      WebApp.showAlert('No se pudo cargar el historial');
    }
  };

  const handleStartWithdraw = () => {
    if (!userData || userData.balance < 0.1) {
      WebApp.showAlert('❌ Saldo insuficiente (Mínimo 0.1 TON)');
      return;
    }
    setTurnstileToken(null);
    setIsWithdrawing(true);
  };

  const executeWithdraw = async () => {
    if (!walletAddr || walletAddr.trim().length < 10) {
      WebApp.showAlert('⚠️ Wallet inválida.');
      return;
    }
    if (!turnstileToken) {
      WebApp.showAlert('⚠️ Completa la verificación de seguridad.');
      return;
    }

    WebApp.MainButton.setText("PROCESANDO...");
    WebApp.MainButton.show();

    try {
      const res = await axios.post('/api/withdraw', { 
        userId: userData.id, 
        address: walletAddr.trim(),
        captchaToken: turnstileToken // Enviamos el token al backend
      });

      if (res.data.success) {
        WebApp.showAlert('✅ ¡Pago enviado!');
        window.location.reload();
      } else {
        WebApp.showAlert('❌ ' + res.data.error);
        if (res.data.error.includes("suspendida")) window.location.reload();
      }
    } catch (e) {
      WebApp.showAlert('❌ Error de red.');
    } finally {
      WebApp.MainButton.hide();
      setIsWithdrawing(false);
    }
  };

  if (status === 'loading') return <div style={s.center}>🛰️ Conectando...</div>;
  if (status === 'error') return (
    <div style={s.center}>
      <h2 style={{color: '#ff4444'}}>⚠️ Acceso Denegado</h2>
      <p style={{padding: '0 20px'}}>{errorInfo}</p>
    </div>
  );

  return (
    <div style={s.container}>
      {status === 'member' && <button onClick={loadHistory} style={s.btnHistoryIcon}>📜</button>}

      {showHistory && (
        <div style={s.modalOverlay}>
          <div style={s.historyCard}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
              <h3 style={{margin:0, color:'#ff4444'}}>HISTORIAL</h3>
              <button onClick={() => setShowHistory(false)} style={s.btnClose}>X</button>
            </div>
            <div style={s.historyList}>
              {history.length === 0 ? <p style={{fontSize:'12px', opacity:0.5}}>Vacío.</p> : 
                history.map((h, i) => (
                  <div key={i} style={s.historyItem}>
                    <div style={{textAlign:'left'}}>
                      <div style={{fontSize:'12px', fontWeight:'bold'}}>{new Date(h.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{color:'#ff4444', fontWeight:'bold'}}>-{h.amount} TON</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {status === 'guest' ? (
        <div style={s.main}><div style={s.card}>
            <h2>📢 Canal Requerido</h2>
            <button style={s.btnBlue} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>1. UNIRME</button>
            <button style={{...s.btnOutline, marginTop: '10px'}} onClick={handleCheckSubscription}>2. VERIFICAR</button>
        </div></div>
      ) : (
        <div style={s.main}>
           <div style={s.cardBalance}>
              {!isWithdrawing ? (
                <>
                  <p style={{margin: 0, opacity: 0.8}}>Balance</p>
                  <h1 style={{fontSize: '40px', margin: '10px 0'}}>{userData?.balance?.toFixed(3)} TON</h1>
                  <button style={s.btnWhite} onClick={handleStartWithdraw}>RETIRAR</button>
                </>
              ) : (
                <>
                  <p style={{margin: 0, fontWeight: 'bold', marginBottom: '10px'}}>Retiro de Fondos</p>
                  <input 
                    type="text" 
                    placeholder="Tu Wallet TON" 
                    value={walletAddr}
                    onChange={(e) => setWalletAddr(e.target.value)}
                    style={s.inputStyle}
                  />
                  {/* Contenedor para Cloudflare Turnstile */}
                  <div ref={turnstileRef} style={{marginTop: '15px', display: 'flex', justifyContent: 'center'}}></div>
                  
                  <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                    <button style={s.btnCancel} onClick={() => setIsWithdrawing(false)}>CANCELAR</button>
                    <button 
                      style={{...s.btnConfirm, opacity: turnstileToken ? 1 : 0.5}} 
                      onClick={executeWithdraw}
                      disabled={!turnstileToken}
                    >CONFIRMAR</button>
                  </div>
                </>
              )}
           </div>

           <div style={s.card}>
              <h4>Referidos</h4>
              <div style={s.row}>
                <div style={s.box}>L1: 0.03</div><div style={s.box}>L2: 0.02</div><div style={s.box}>L3: 0.01</div>
              </div>
              <button style={s.btnGreen} onClick={handleShare}>🚀 Invitar</button>
           </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif', position: 'relative' },
  center: { backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  cardBalance: { backgroundColor: '#0088cc', padding: '25px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px' },
  card: { backgroundColor: '#1c1c1c', padding: '20px', borderRadius: '20px', textAlign: 'center' },
  btnBlue: { width: '100%', padding: '15px', backgroundColor: '#0088cc', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold' },
  btnOutline: { width: '100%', padding: '15px', backgroundColor: 'transparent', border: '2px solid #0088cc', borderRadius: '12px', color: '#0088cc', fontWeight: 'bold' },
  btnWhite: { width: '100%', padding: '12px', backgroundColor: '#fff', color: '#0088cc', border: 'none', borderRadius: '12px', fontWeight: 'bold' },
  btnGreen: { width: '100%', padding: '15px', backgroundColor: '#28a745', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold' },
  row: { display: 'flex', justifyContent: 'space-around', margin: '15px 0' },
  box: { fontSize: '12px', color: '#aaa' },
  main: { display: 'flex', flexDirection: 'column' },
  inputStyle: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', textAlign: 'center', color: '#000', fontWeight: 'bold' },
  btnCancel: { flex: 1, padding: '12px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px' },
  btnConfirm: { flex: 1, padding: '12px', backgroundColor: '#fff', color: '#0088cc', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  btnHistoryIcon: { position: 'absolute', top: '15px', right: '15px', backgroundColor: '#1c1c1c', border: '1px solid #333', borderRadius: '50%', width: '40px', height: '40px', fontSize: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  historyCard: { backgroundColor: '#121212', border: '2px solid #ff4444', borderRadius: '15px', width: '90%', maxWidth: '350px', padding: '20px' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #333' },
  btnClose: { background: 'none', border: 'none', color: '#ff4444', fontWeight: 'bold', fontSize: '18px' }
};

export default App;
