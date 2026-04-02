import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

/**
 * IA PROFIT TON BOT - FRONTEND CORE
 * Versión: 2.5.0
 * Seguridad: Cloudflare Turnstile + Anti-Multiaccount
 */

function App() {
  /* --- ESTADOS DE AUTENTICACIÓN Y CARGA --- */
  const [status, setStatus] = useState('loading');
  const [userData, setUserData] = useState(null);
  const [errorInfo, setErrorInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* --- ESTADOS DE ESTADÍSTICAS DE RED --- */
  const [stats, setStats] = useState({ 
    n1: 0, n2: 0, n3: 0, 
    c1: "0.00", c2: "0.00", c3: "0.00" 
  });

  /* --- ESTADOS DE RETIRO Y SEGURIDAD --- */
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [walletAddr, setWalletAddr] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);

  /* --- ESTADOS DE HISTORIAL --- */
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* --- [FUNCIONES DE VERIFICACIÓN] --- */
  
  const verifyUser = (user, startParam) => {
    // Registro de actividad inicial
    axios.post('/api/verify', { user, start_param: startParam })
      .then(res => {
        if (res.data.success) {
          if (res.data.user.is_banned) {
            setStatus('error');
            setErrorInfo('SISTEMA DE SEGURIDAD: Tu cuenta ha sido suspendida permanentemente por detección de fraude o multicuentas.');
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
        setErrorInfo(err.response?.data?.error || 'Error de conexión con el nodo central.');
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
        setErrorInfo('Esta aplicación solo puede ser ejecutada desde Telegram.');
        return;
      }
      verifyUser(user, startParam);
    } catch (e) {
      setStatus('error');
      setErrorInfo('Fallo crítico en el SDK de Telegram: ' + e.message);
    }
  }, []);

  /* --- [LÓGICA DE CLOUDFLARE] --- */

  useEffect(() => {
    if (isWithdrawing && window.turnstile) {
      setTimeout(() => {
        if (turnstileRef.current) {
          window.turnstile.render(turnstileRef.current, {
            sitekey: '0x4AAAAAACqyiOXggbsrQdnA',
            callback: (token) => setTurnstileToken(token),
            'expired-callback': () => setTurnstileToken(null),
            'error-callback': () => WebApp.showAlert('Error en verificación de seguridad.')
          });
        }
      }, 100);
    }
  }, [isWithdrawing]);

  /* --- [ACCIONES DEL USUARIO] --- */

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
          WebApp.showAlert('❌ Suscripción no detectada. Únete al canal oficial.');
        }
      }).catch(() => {
        setStatus('guest');
        WebApp.showAlert('Servidor ocupado, reintenta en un momento.');
      });
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`/api/history?userId=${userData.id}`);
      setHistory(res.data.history || []);
      setShowHistory(true);
    } catch (e) {
      WebApp.showAlert('Error al sincronizar historial.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShare = () => {
    const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = `💰 ¡Gana TON en automático con IA Profit! Referidos de 3 niveles activados. 🚀`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
    WebApp.HapticFeedback.impactOccurred('medium');
  };

  /* --- [PROCESAMIENTO DE RETIRO] --- */

  const executeWithdraw = async () => {
    if (!walletAddr || walletAddr.trim().length < 20) {
      WebApp.showAlert('⚠️ Ingresa una dirección TON válida.');
      return;
    }
    if (!turnstileToken) {
      WebApp.showAlert('⚠️ Completa el captcha de seguridad.');
      return;
    }

    setIsSubmitting(true);
    WebApp.MainButton.setText("VERIFICANDO SEGURIDAD...");
    WebApp.MainButton.show();

    try {
      const res = await axios.post('/api/withdraw', { 
        userId: userData.id, 
        address: walletAddr.trim(),
        captchaToken: turnstileToken
      });

      if (res.data.success) {
        WebApp.HapticFeedback.notificationOccurred('success');
        WebApp.showAlert('✅ Retiro procesado con éxito. El comprobante llegará al canal de pagos.');
        window.location.reload();
      } else {
        WebApp.HapticFeedback.notificationOccurred('error');
        WebApp.showAlert('❌ ERROR: ' + res.data.error);
        if (res.data.error.includes("suspendida")) window.location.reload();
      }
    } catch (e) {
      WebApp.showAlert('❌ Error de conexión con la red TON.');
    } finally {
      WebApp.MainButton.hide();
      setIsSubmitting(false);
      setIsWithdrawing(false);
    }
  };

  /* --- [COMPONENTES DE INTERFAZ] --- */

  if (status === 'loading') return (
    <div style={s.center}>
      <div style={s.loader}></div>
      <p style={{marginTop: '20px', letterSpacing: '1px'}}>Sincronizando con la Blockchain...</p>
    </div>
  );

  if (status === 'error') return (
    <div style={s.center}>
      <h2 style={{color: '#ff4444', fontSize: '28px'}}>SISTEMA BLOQUEADO</h2>
      <div style={s.errorBox}>{errorInfo}</div>
      <button style={s.btnWhite} onClick={() => window.location.reload()}>REINTENTAR ACCESO</button>
    </div>
  );

  return (
    <div style={s.container}>
      {/* Botón Flotante de Historial */}
      {status === 'member' && (
        <button onClick={loadHistory} style={s.btnHistoryIcon} disabled={loadingHistory}>
          {loadingHistory ? '...' : '📜'}
        </button>
      )}

      {/* Modal de Historial (Diseño Clásico Rojo) */}
      {showHistory && (
        <div style={s.modalOverlay}>
          <div style={s.historyCard}>
            <div style={s.modalHeader}>
              <h3 style={{margin:0, color:'#ff4444', letterSpacing: '1px'}}>HISTORIAL DE PAGOS</h3>
              <button onClick={() => setShowHistory(false)} style={s.btnClose}>CERRAR</button>
            </div>
            <div style={s.historyList}>
              {history.length === 0 ? (
                <p style={{textAlign: 'center', opacity: 0.5, padding: '20px'}}>No se registran movimientos.</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} style={s.historyItem}>
                    <div style={{textAlign:'left'}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color: '#fff'}}>{new Date(h.created_at).toLocaleDateString()}</div>
                      <div style={{fontSize:'10px', color:'#777'}}>{new Date(h.created_at).toLocaleTimeString()}</div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{color:'#ff4444', fontWeight:'bold'}}>-{h.amount} TON</div>
                      <div style={{fontSize: '9px', color: '#28a745'}}>COMPLETADO</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {status === 'guest' ? (
        /* VISTA PARA NO MIEMBROS */
        <div style={s.main}>
          <div style={s.card}>
            <div style={s.iconCircle}>🔔</div>
            <h2 style={{fontSize: '24px', margin: '15px 0'}}>Canal Requerido</h2>
            <p style={{color: '#aaa', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5'}}>
              Para prevenir el spam y activar el sistema de recompensas, debes unirte a nuestra comunidad oficial.
            </p>
            <button style={s.btnBlue} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>
              1. UNIRME AL CANAL
            </button>
            <button style={{...s.btnOutline, marginTop: '12px'}} onClick={handleCheckSubscription}>
              2. VERIFICAR SUSCRIPCIÓN
            </button>
          </div>
        </div>
      ) : (
        /* VISTA PRINCIPAL DEL DASHBOARD */
        <div style={s.main}>
           <div style={s.cardBalance}>
              {!isWithdrawing ? (
                <>
                  <p style={{margin: 0, opacity: 0.8, fontSize: '13px', fontWeight: 'bold'}}>SALDO TOTAL DISPONIBLE</p>
                  <h1 style={{fontSize: '48px', margin: '10px 0', fontWeight: '900'}}>{userData?.balance?.toFixed(3) || '0.000'} <span style={{fontSize: '18px', fontWeight: '300'}}>TON</span></h1>
                  <button style={s.btnWhite} onClick={handleStartWithdraw}>SOLICITAR RETIRO</button>
                  <div style={s.badge}>Pago mínimo: 0.1 TON</div>
                </>
              ) : (
                <>
                  <p style={{margin: 0, fontWeight: 'bold', marginBottom: '15px'}}>CONFIGURACIÓN DE RETIRO</p>
                  <input 
                    type="text" 
                    placeholder="Dirección de billetera TON" 
                    value={walletAddr}
                    onChange={(e) => setWalletAddr(e.target.value)}
                    style={s.inputStyle}
                  />
                  {/* Widget Cloudflare */}
                  <div ref={turnstileRef} style={{marginTop: '15px', display: 'flex', justifyContent: 'center'}}></div>
                  
                  <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                    <button style={s.btnCancel} onClick={() => setIsWithdrawing(false)}>CANCELAR</button>
                    <button 
                      style={{...s.btnConfirm, opacity: (turnstileToken && !isSubmitting) ? 1 : 0.5}} 
                      onClick={executeWithdraw}
                      disabled={!turnstileToken || isSubmitting}
                    >
                      {isSubmitting ? 'PROCESANDO...' : 'CONFIRMAR'}
                    </button>
                  </div>
                </>
              )}
           </div>

           {/* MÓDULO DE REFERIDOS */}
           <div style={s.card}>
              <h4 style={{marginTop: 0, textAlign: 'left', color: '#0088cc'}}>SISTEMA DE AFILIADOS</h4>
              <div style={s.row}>
                <div style={s.box}>NIVEL 1<br/><b style={{color: '#fff', fontSize: '14px'}}>0.03 TON</b></div>
                <div style={s.box}>NIVEL 2<br/><b style={{color: '#fff', fontSize: '14px'}}>0.02 TON</b></div>
                <div style={s.box}>NIVEL 3<br/><b style={{color: '#fff', fontSize: '14px'}}>0.01 TON</b></div>
              </div>
              <button style={s.btnGreen} onClick={handleShare}>🚀 COPIAR LINK E INVITAR</button>
           </div>

           {/* MÓDULO DE ESTADÍSTICAS DETALLADAS */}
           <div style={{...s.card, marginTop: '20px', border: '1px solid #222'}}>
              <h4 style={{marginBottom: '15px', color: '#aaa', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase'}}>Rendimiento de tu Red</h4>
              <div style={s.statsGrid}>
                <div style={s.statCol}>
                  <p style={s.statLabel}>DIRECTOS</p>
                  <p style={s.statValue}>{stats.n1}</p>
                  <p style={s.statCom}>+{stats.c1} TON</p>
                </div>
                <div style={s.statCol}>
                  <p style={s.statLabel}>NIVEL 2</p>
                  <p style={s.statValue}>{stats.n2}</p>
                  <p style={s.statCom}>+{stats.c2} TON</p>
                </div>
                <div style={s.statCol}>
                  <p style={s.statLabel}>NIVEL 3</p>
                  <p style={s.statValue}>{stats.n3}</p>
                  <p style={s.statCom}>+{stats.c3} TON</p>
                </div>
              </div>
              <div style={s.totalRow}>
                <p style={{fontSize: '11px', color: '#666'}}>GANANCIA TOTAL GENERADA:</p>
                <p style={{fontSize: '16px', fontWeight: 'bold', color: '#28a745'}}>
                  {(parseFloat(stats.c1) + parseFloat(stats.c2) + parseFloat(stats.c3)).toFixed(3)} TON
                </p>
              </div>
           </div>
           
           <p style={{textAlign: 'center', fontSize: '10px', color: '#444', marginTop: '30px'}}>
             Powered by TON Blockchain & AI Profit Engine v2.5
           </p>
        </div>
      )}
    </div>
  );
}

/* --- [HOJA DE ESTILOS PROFESIONAL] --- */

const s = {
  container: { backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' },
  center: { backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
  loader: { width: '40px', height: '40px', border: '3px solid #333', borderTop: '3px solid #0088cc', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  main: { display: 'flex', flexDirection: 'column', maxWidth: '500px', margin: '0 auto' },
  cardBalance: { background: 'linear-gradient(135deg, #0088cc 0%, #005588 100%)', padding: '30px 20px', borderRadius: '24px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 10px 20px rgba(0,136,204,0.2)' },
  card: { backgroundColor: '#111', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid #1a1a1a' },
  badge: { fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', marginTop: '10px' },
  iconCircle: { width: '60px', height: '60px', backgroundColor: '#1a1a1a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '24px' },
  btnBlue: { width: '100%', padding: '16px', backgroundColor: '#0088cc', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: 'bold', fontSize: '16px' },
  btnOutline: { width: '100%', padding: '16px', backgroundColor: 'transparent', border: '2px solid #333', borderRadius: '14px', color: '#fff', fontWeight: 'bold' },
  btnWhite: { width: '100%', padding: '14px', backgroundColor: '#fff', color: '#0088cc', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' },
  btnGreen: { width: '100%', padding: '16px', backgroundColor: '#28a745', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: 'bold' },
  row: { display: 'flex', justifyContent: 'space-around', margin: '20px 0' },
  box: { fontSize: '10px', color: '#666', textAlign: 'center' },
  statsGrid: { display: 'flex', justifyContent: 'space-between', marginTop: '5px' },
  statCol: { flex: 1, textAlign: 'center' },
  statLabel: { fontSize: '10px', color: '#555', marginBottom: '8px' },
  statValue: { fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' },
  statCom: { fontSize: '12px', color: '#28a745', fontWeight: 'bold' },
  totalRow: { marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  inputStyle: { width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #005588', textAlign: 'center', backgroundColor: '#fff', color: '#000', fontWeight: 'bold', fontSize: '14px' },
  btnCancel: { flex: 1, padding: '14px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' },
  btnConfirm: { flex: 1, padding: '14px', backgroundColor: '#fff', color: '#0088cc', border: 'none', borderRadius: '12px', fontWeight: 'bold' },
  btnHistoryIcon: { position: 'absolute', top: '20px', right: '20px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '50%', width: '45px', height: '45px', fontSize: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  historyCard: { backgroundColor: '#0a0a0a', border: '2px solid #ff4444', borderRadius: '20px', width: '100%', maxWidth: '380px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  historyList: { flex: 1, overflowY: 'auto', padding: '10px' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #1a1a1a' },
  btnClose: { background: 'none', border: '1px solid #ff4444', color: '#ff4444', borderRadius: '8px', padding: '5px 10px', fontSize: '10px', fontWeight: 'bold' },
  errorBox: { backgroundColor: '#1a0000', color: '#ff8888', padding: '15px', borderRadius: '12px', border: '1px solid #ff4444', margin: '20px', fontSize: '14px' }
};

export default App;
