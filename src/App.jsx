import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

function App() {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor('#1a1a1a');

    const tgUser = WebApp.initDataUnsafe.user;
    const startParam = WebApp.initDataUnsafe.start_param;

    if (tgUser) {
      // Llamada al backend para verificar canal, registrar y obtener balance/niveles
      axios.post('/api/verify', { user: tgUser, start_param: startParam })
        .then(res => {
          if (res.data.success) {
            setUser(res.data.user); // El backend debe devolver el objeto user con balance
            setStatus('member');
          } else {
            setStatus('guest');
          }
        })
        .catch((err) => {
          setStatus('error');
          setErrorMsg(err.response?.data?.error || 'Error de conexión');
        });
    } else {
      setStatus('error');
      setErrorMsg('Abre la app desde Telegram');
    }
  }, []);

  // Configuración del enlace de referido
  const referralLink = `https://t.me/IAProfitTonBot/app?startapp=${user?.id || ''}`;

  const handleShare = () => {
    const text = `¡Únete a IA Profit Ton y gana recompensas en 3 niveles! 🚀`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`);
  };

  const handleWithdraw = async () => {
    if (!user || user.balance < 0.1) {
      WebApp.showAlert('Balance insuficiente. Necesitas 0.1 TON.');
      return;
    }
    
    // Pedimos la dirección de wallet TON al usuario
    WebApp.showPrompt('Introduce tu dirección de Wallet TON:', async (address) => {
      if (!address) return;
      
      try {
        const res = await axios.post('/api/withdraw', { userId: user.id, address });
        if (res.data.success) {
          WebApp.showAlert('¡Retiro de 0.1 TON solicitado con éxito!');
          window.location.reload(); // Recargamos para actualizar balance
        } else {
          WebApp.showAlert('Error: ' + res.data.error);
        }
      } catch (e) {
        WebApp.showAlert('Error al procesar el retiro.');
      }
    });
  };

  if (status === 'loading') return <div style={styles.container}>Cargando datos...</div>;
  
  if (status === 'error') return <div style={styles.container}>❌ Error: {errorMsg}</div>;

  return (
    <div style={styles.container}>
      {status === 'guest' ? (
        <div style={styles.card}>
          <h2>📢 Canal Requerido</h2>
          <p>Para usar la app y ganar TON, debes unirte a nuestro canal oficial.</p>
          <button style={styles.buttonMain} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>
            Unirme al Canal
          </button>
          <button style={{...styles.buttonSecondary, marginTop: '10px'}} onClick={() => window.location.reload()}>
            Ya me uní (Verificar)
          </button>
        </div>
      ) : (
        <div style={styles.main}>
          {/* Cabecera de Usuario */}
          <div style={styles.header}>
             <img src={user?.photo_url || 'https://via.placeholder.com/80'} style={styles.avatar} alt="avatar" />
             <h3>{user?.first_name || 'Usuario'}</h3>
             <span style={styles.badge}>ID: {user?.id}</span>
          </div>

          {/* Card de Balance */}
          <div style={styles.balanceCard}>
            <p style={{margin: 0, opacity: 0.8}}>Tu Balance Disponible</p>
            <h1 style={{margin: '10px 0', fontSize: '36px'}}>{user?.balance || '0.000'} TON</h1>
            <button style={styles.buttonWithdraw} onClick={handleWithdraw}>
              Retirar 0.1 TON
            </button>
            <p style={{fontSize: '11px', marginTop: '10px', opacity: 0.6}}>
              Retiro único de 0.1 TON | 1 vez por hora
            </p>
          </div>

          {/* Card de Referidos */}
          <div style={styles.card}>
            <h4 style={{margin: '0 0 10px 0'}}>SISTEMA DE AFILIADOS</h4>
            <div style={styles.row}>
              <div style={styles.statBox}><span>Nivel 1</span><strong>0.003</strong></div>
              <div style={styles.statBox}><span>Nivel 2</span><strong>0.002</strong></div>
              <div style={styles.statBox}><span>Nivel 3</span><strong>0.001</strong></div>
            </div>
            
            <div style={styles.linkBox}>
              <code style={styles.code}>{referralLink}</code>
            </div>

            <button style={styles.buttonSuccess} onClick={handleShare}>
              🚀 Invitar Amigos
            </button>
            <button style={styles.buttonSecondary} onClick={() => {
              navigator.clipboard.writeText(referralLink);
              WebApp.showAlert('¡Enlace copiado!');
            }}>
              📋 Copiar Enlace
            </button>
          </div>

          {/* Info de Niveles */}
          <div style={{marginTop: '20px', padding: '10px', opacity: 0.7, fontSize: '13px'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                <span>Afiliados Directos:</span>
                <span>Ver lista ➔</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' },
  main: { display: 'flex', flexDirection: 'column', gap: '15px' },
  header: { textAlign: 'center', marginBottom: '10px' },
  avatar: { width: '70px', height: '70px', borderRadius: '50%', border: '2px solid #0088cc' },
  badge: { backgroundColor: '#333', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', display: 'inline-block', marginTop: '5px' },
  balanceCard: { backgroundColor: '#0088cc', padding: '25px', borderRadius: '20px', textAlign: 'center', color: 'white' },
  buttonWithdraw: { width: '100%', padding: '12px', backgroundColor: 'white', color: '#0088cc', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' },
  card: { backgroundColor: '#252525', padding: '20px', borderRadius: '18px', textAlign: 'center' },
  row: { display: 'flex', justifyContent: 'space-around', margin: '15px 0' },
  statBox: { display: 'flex', flexDirection: 'column', fontSize: '12px' },
  linkBox: { backgroundColor: '#111', padding: '12px', borderRadius: '10px', margin: '15px 0' },
  code: { color: '#0088cc', fontSize: '11px', wordBreak: 'break-all' },
  buttonMain: { width: '100%', padding: '15px', backgroundColor: '#0088cc', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold' },
  buttonSuccess: { width: '100%', padding: '15px', backgroundColor: '#00c853', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', marginBottom: '10px' },
  buttonSecondary: { width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1px solid #444', borderRadius: '12px', color: '#aaa' }
};

export default App;
