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
  const verifyUser = (user, startParam) => {
    axios.post('/api/verify', { user, start_param: startParam })
      .then(res => {
        if (res.data.success) {
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

  /* */
  const handleCheckSubscription = () => {
    const user = WebApp.initDataUnsafe?.user;
    const startParam = WebApp.initDataUnsafe?.start_param;
    setStatus('loading');
    verifyUser(user, startParam);
  };

  /* */
  const handleShare = () => {
    const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    const text = `¡Gana TON en 3 niveles con IA Profit! 🚀`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };

  /* */
  const handleWithdraw = () => {
    if (!userData || userData.balance < 0.1) {
      WebApp.showAlert('❌ Necesitas al menos 0.1 TON.');
      return;
    }

    // Usamos un pequeño delay para asegurar que el SDK procese el clic
    setTimeout(() => {
      WebApp.showPrompt('Pega tu dirección de Wallet TON:', async (addr) => {
        if (!addr || addr.trim().length < 10) {
          if(addr) WebApp.showAlert('⚠️ Dirección no válida.');
          return;
        }

        const walletAddr = addr.trim();

        // Configuramos el MainButton como confirmación final (Evita errores de UI)
        WebApp.MainButton.setText(`CONFIRMAR RETIRO A: ${walletAddr.substring(0,6)}...`);
        WebApp.MainButton.show();
        
        // Limpiamos cualquier evento anterior
        WebApp.MainButton.offClick(); 

        WebApp.MainButton.onClick(async () => {
          WebApp.MainButton.showProgress();
          try {
            const res = await axios.post('/api/withdraw', { 
              userId: userData.id, 
              address: walletAddr 
            });

            if (res.data.success) {
              WebApp.showAlert('✅ Pago enviado. Revisa @PagosEnCrypto');
              WebApp.MainButton.hide();
              window.location.reload();
            } else {
              WebApp.showAlert('❌ ' + res.data.error);
              WebApp.MainButton.hide();
            }
          } catch (e) {
            WebApp.showAlert('❌ Error al procesar retiro.');
            WebApp.MainButton.hide();
          }
        });
      });
    }, 100);
  };

  /* */
  if (status === 'loading') return <div style={s.center}>🛰️ Conectando...</div>;
  
  if (status === 'error') return (
    <div style={s.center}>
      <h2 style={{color: '#ff4444'}}>⚠️ Error</h2>
      <p>{errorInfo}</p>
      <button style={s.btnBlue} onClick={() => window.location.reload()}>Reintentar</button>
    </div>
  );

  return (
    <div style={s.container}>
      {status === 'guest' ? (
        <div style={s.main}>
          <div style={s.card}>
            <h2 style={{fontSize: '22px', marginBottom: '10px'}}>📢 ¡Únete al Canal!</h2>
            <p style={{color: '#aaa', fontSize: '14px', marginBottom: '20px'}}>Debes ser miembro de @CryptosBitcoins.</p>
            <button style={{...s.btnBlue, marginBottom: '12px'}} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>1. UNIRME</button>
            <button style={s.btnOutline} onClick={handleCheckSubscription}>2. CONTINUAR →</button>
          </div>
        </div>
      ) : (
        <div style={s.main}>
           <div style={s.cardBalance}>
              <p style={{margin: 0, opacity: 0.8}}>Balance Disponible</p>
              <h1 style={{fontSize: '40px', margin: '10px 0'}}>{userData?.balance?.toFixed(3) || '0.000'} <span style={{fontSize: '18px'}}>TON</span></h1>
              <button style={s.btnWhite} onClick={handleWithdraw}>RETIRAR 0.1 TON</button>
              <p style={{fontSize: '10px', marginTop: '10px', color: '#e0f4ff'}}>Límite: 1 cada 60 min</p>
           </div>

           <div style={s.card}>
              <h4 style={{marginTop: 0}}>Referidos</h4>
              <div style={s.row}>
                <div style={s.box}>Lvl 1<br/><b>$0.03</b></div>
                <div style={s.box}>Lvl 2<br/><b>$0.02</b></div>
                <div style={s.box}>Lvl 3<br/><b>$0.01</b></div>
              </div>
              <button style={s.btnGreen} onClick={handleShare}>🚀 Invitar</button>
           </div>

           <div style={{...s.card, marginTop: '20px', border: '1px solid #333'}}>
              <h4 style={{marginBottom: '15px', color: '#0088cc', textAlign: 'left'}}>Estadísticas</h4>
              <div style={s.statsGrid}>
                <div style={s.statCol}><p style={s.statLabel}>Lvl 1</p><p style={s.statValue}>{stats.n1}</p><p style={s.statCom}>{stats.c1} T</p></div>
                <div style={s.statCol}><p style={s.statLabel}>Lvl 2</p><p style={s.statValue}>{stats.n2}</p><p style={s.statCom}>{stats.c2} T</p></div>
                <div style={s.statCol}><p style={s.statLabel}>Lvl 3</p><p style={s.statValue}>{stats.n3}</p><p style={s.statCom}>{stats.c3} T</p></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' },
  center: { backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  cardBalance: { backgroundColor: '#0088cc', padding: '25px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px' },
  card: { backgroundColor: '#1c1c1c', padding: '20px', borderRadius: '20px', textAlign: 'center' },
  btnBlue: { width: '100%', padding: '15px', backgroundColor: '#0088cc', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold' },
  btnOutline: { width: '100%', padding: '15px', backgroundColor: 'transparent', border: '2px solid #0088cc', borderRadius: '12px', color: '#0088cc', fontWeight: 'bold' },
  btnWhite: { width: '100%', padding: '12px', backgroundColor: '#fff', color: '#0088cc', border: 'none', borderRadius: '12px', fontWeight: 'bold' },
  btnGreen: { width: '100%', padding: '15px', backgroundColor: '#28a745', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold' },
  row: { display: 'flex', justifyContent: 'space-around', margin: '15px 0' },
  box: { fontSize: '11px', color: '#aaa' },
  main: { display: 'flex', flexDirection: 'column' },
  statsGrid: { display: 'flex', justifyContent: 'space-between' },
  statCol: { flex: 1, textAlign: 'center' },
  statLabel: { fontSize: '11px', color: '#888' },
  statValue: { fontSize: '16px', fontWeight: 'bold' },
  statCom: { fontSize: '12px', color: '#28a745' }
};

export default App;
