import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

/* */
function App() {
  const [status, setStatus] = useState('loading');
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ n1: 0, n2: 0, n3: 0, c1: 0, c2: 0, c3: 0 });
  const [errorInfo, setErrorInfo] = useState('');

  /* */
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

      axios.post('/api/verify', { user, start_param: startParam })
        .then(res => {
          if (res.data.success) {
            setUserData(res.data.user);
            setStats(res.data.stats); // Guardamos estadísticas del multinivel
            setStatus('member');
          } else {
            setStatus('guest');
          }
        })
        .catch(err => {
          setStatus('error');
          setErrorInfo(err.response?.data?.error || err.message);
        });
    } catch (e) {
      setStatus('error');
      setErrorInfo('Fallo crítico: ' + e.message);
    }
  }, []);

  /* */
  const handleShare = () => {
    const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = `¡Gana TON en 3 niveles con IA Profit! 🚀`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };

  const handleWithdraw = async () => {
    if (!userData || userData.balance < 0.1) {
      WebApp.showAlert('Necesitas al menos 0.1 TON');
      return;
    }
    
    WebApp.showPrompt('Pega tu dirección de Wallet TON:', async (addr) => {
      if (!addr) return;
      try {
        const res = await axios.post('/api/withdraw', { userId: userData.id, address: addr });
        if (res.data.success) {
          WebApp.showAlert('✅ Retiro enviado con éxito');
          window.location.reload();
        } else {
          WebApp.showAlert('❌ Error: ' + res.data.error);
        }
      } catch (e) {
        WebApp.showAlert('Error en la red de retiro');
      }
    });
  };

  /* */
  if (status === 'loading') return <div style={s.center}>🛰️ Conectando con IA Profit...</div>;
  
  if (status === 'error') return (
    <div style={s.center}>
      <h2 style={{color: '#ff4444'}}>⚠️ Error</h2>
      <p>{errorInfo}</p>
      <button onClick={() => window.location.reload()}>Reintentar</button>
    </div>
  );

  return (
    <div style={s.container}>
      {status === 'guest' ? (
        <div style={s.card}>
          <h2>📢 ¡Únete al Canal!</h2>
          <p>Debes estar en @CryptosBitcoins para participar.</p>
          <button style={s.btnBlue} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>Unirme</button>
        </div>
      ) : (
        <div style={s.main}>
           {/* Tarjeta de Balance */}
           <div style={s.cardBalance}>
              <p style={{margin: 0, opacity: 0.8}}>Balance Disponible</p>
              <h1 style={{fontSize: '40px', margin: '10px 0'}}>{userData?.balance || '0.00'} <span style={{fontSize: '18px'}}>TON</span></h1>
              <button style={s.btnWhite} onClick={handleWithdraw}>RETIRAR 0.1 TON</button>
           </div>

           {/* Tarjeta de Invitación */}
           <div style={s.card}>
              <h4 style={{marginTop: 0}}>Sistema de Referidos</h4>
              <div style={s.row}>
                <div style={s.box}>Lvl 1<br/><b style={{color: '#fff'}}>$0.03</b></div>
                <div style={s.box}>Lvl 2<br/><b style={{color: '#fff'}}>$0.02</b></div>
                <div style={s.box}>Lvl 3<br/><b style={{color: '#fff'}}>$0.01</b></div>
              </div>
              <button style={s.btnGreen} onClick={handleShare}>🚀 Invitar Amigos</button>
           </div>

           {/* Nueva Sección: Ganancias por Referencias (Llena el espacio vacío) */}
           <div style={{...s.card, marginTop: '20px', border: '1px solid #333'}}>
              <h4 style={{marginBottom: '15px', color: '#0088cc', textAlign: 'left'}}>Ganancias por referencias</h4>
              
              <div style={s.statsGrid}>
                <div style={s.statCol}>
                  <p style={s.statLabel}>Nivel 1</p>
                  <p style={s.statValue}>{stats.n1} <small style={{fontSize: '10px', color: '#666'}}>Users</small></p>
                  <p style={s.statCom}>{stats.c1} TON</p>
                </div>
                <div style={s.statCol}>
                  <p style={s.statLabel}>Nivel 2</p>
                  <p style={s.statValue}>{stats.n2} <small style={{fontSize: '10px', color: '#666'}}>Users</small></p>
                  <p style={s.statCom}>{stats.c2} TON</p>
                </div>
                <div style={s.statCol}>
                  <p style={s.statLabel}>Nivel 3</p>
                  <p style={s.statValue}>{stats.n3} <small style={{fontSize: '10px', color: '#666'}}>Users</small></p>
                  <p style={s.statCom}>{stats.c3} TON</p>
                </div>
              </div>
              
              <div style={s.totalRow}>
                <p style={{fontSize: '12px', color: '#888'}}>Total acumulado en red:</p>
                <p style={{fontSize: '14px', fontWeight: 'bold', color: '#28a745'}}>
                  {(parseFloat(stats.c1) + parseFloat(stats.c2) + parseFloat(stats.c3)).toFixed(2)} TON
                </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

/* */
const s = {
  container: { backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif', margin: 0 },
  center: { backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', margin: 0 },
  cardBalance: { backgroundColor: '#0088cc', padding: '25px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px' },
  card: { backgroundColor: '#1c1c1c', padding: '20px', borderRadius: '20px', textAlign: 'center' },
  btnBlue: { width: '100%', padding: '15px', backgroundColor: '#0088cc', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold' },
  btnWhite: { width: '100%', padding: '12px', backgroundColor: '#fff', color: '#0088cc', border: 'none', borderRadius: '12px', fontWeight: 'bold' },
  btnGreen: { width: '100%', padding: '15px', backgroundColor: '#28a745', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold' },
  row: { display: 'flex', justifyContent: 'space-around', margin: '15px 0' },
  box: { fontSize: '11px', color: '#aaa' },
  main: { display: 'flex', flexDirection: 'column' },
  // Estilos de la nueva cuadrícula
  statsGrid: { display: 'flex', justifyContent: 'space-between', marginTop: '10px' },
  statCol: { flex: 1, textAlign: 'center' },
  statLabel: { fontSize: '11px', color: '#888', margin: '0 0 5px 0' },
  statValue: { fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' },
  statCom: { fontSize: '12px', color: '#28a745', fontWeight: 'bold', margin: 0 },
  totalRow: { marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
};

export default App;
