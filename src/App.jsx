import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

function App() {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    
    // Cambiar color de fondo de la app para que parezca nativa
    WebApp.setHeaderColor('#1a1a1a');

    const tgUser = WebApp.initDataUnsafe.user;
    const startParam = WebApp.initDataUnsafe.start_param;

    if (tgUser) {
      setUser(tgUser);
      axios.post('/api/verify', { user: tgUser, start_param: startParam })
        .then(res => {
          if (res.data.success) setStatus('member');
          else setStatus('guest');
        })
        .catch(() => setStatus('error'));
    }
  }, []);

  // Generar link de referido
  const referralLink = `https://t.me/IAProfitTonBot/app?startapp=${user?.id}`;

  const handleShare = () => {
    const text = `¡Únete a esta app y gana recompensas! 🚀`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`);
  };

  if (status === 'loading') return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      {status === 'guest' ? (
        <div style={styles.card}>
          <h2>📢 ¡Falta un paso!</h2>
          <p>Para acceder, debes estar unido a nuestro canal oficial.</p>
          <button style={styles.buttonMain} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>
            Unirme ahora
          </button>
        </div>
      ) : (
        <div style={styles.main}>
          <div style={styles.header}>
             <img src={user?.photo_url || 'https://via.placeholder.com/80'} style={styles.avatar} />
             <h3>Hola, {user?.first_name} 👋</h3>
             <span style={styles.badge}>Usuario Verificado</span>
          </div>

          <div style={styles.card}>
            <h4>SISTEMA DE REFERIDOS</h4>
            <p style={{fontSize: '14px', color: '#aaa'}}>Comparte tu enlace y gana por cada amigo invitado.</p>
            
            <div style={styles.linkBox}>
              <code style={styles.code}>{referralLink}</code>
            </div>

            <button style={styles.buttonSuccess} onClick={handleShare}>
              🚀 Compartir con amigos
            </button>
            
            <button style={styles.buttonSecondary} onClick={() => {
              navigator.clipboard.writeText(referralLink);
              WebApp.showAlert('¡Enlace copiado!');
            }}>
              📋 Copiar Enlace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos rápidos para que se vea profesional
const styles = {
  container: { backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' },
  header: { textAlign: 'center', marginBottom: '30px' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #0088cc', marginBottom: '10px' },
  badge: { backgroundColor: '#00c853', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' },
  card: { backgroundColor: '#252525', padding: '20px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' },
  linkBox: { backgroundColor: '#111', padding: '10px', borderRadius: '8px', margin: '15px 0', overflowX: 'auto' },
  code: { color: '#0088cc', fontSize: '12px' },
  buttonMain: { width: '100%', padding: '15px', backgroundColor: '#0088cc', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  buttonSuccess: { width: '100%', padding: '15px', backgroundColor: '#00c853', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold', marginBottom: '10px' },
  buttonSecondary: { width: '100%', padding: '10px', backgroundColor: 'transparent', border: '1px solid #444', borderRadius: '10px', color: '#aaa' }
};

export default App;
