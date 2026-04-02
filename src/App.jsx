import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

function App() {
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // 1. Inicializar el SDK de Telegram
    WebApp.ready();
    WebApp.expand();

    const user = WebApp.initDataUnsafe.user;
    const startParam = WebApp.initDataUnsafe.start_param;

    // Si abres la app fuera de Telegram, esto saltará
    if (!user) {
      setStatus('error');
      setErrorMsg('Por favor, abre esta app desde el bot de Telegram.');
      return;
    }

    // 2. Llamada al Backend
    axios.post('/api/verify', { 
      user: user, 
      start_param: startParam 
    })
    .then(res => {
      if (res.data.success) {
        setStatus('member');
      } else {
        setStatus('guest');
      }
    })
    .catch(err => {
      console.error(err);
      setStatus('error');
      // Esto nos dirá si el problema es el Token, la DB o la Red
      setErrorMsg(err.response?.data?.error || err.message);
    });
  }, []);

  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'white' }}>
        <p>Conectando con el servidor...</p>
        <small>Si tarda mucho, verifica que el bot sea ADMIN del canal.</small>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '20px', color: '#ff5555', textAlign: 'center' }}>
        <h3>⚠️ Error de Conexión</h3>
        <p>{errorMsg}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
      {status === 'guest' ? (
        <div>
          <h2>¡Hola, {WebApp.initDataUnsafe.user?.first_name}!</h2>
          <p>Para entrar, debes unirte a nuestro canal oficial.</p>
          <button 
            style={{ padding: '12px 24px', backgroundColor: '#0088cc', border: 'none', borderRadius: '8px', color: 'white' }}
            onClick={() => WebApp.openTelegramLink('https://t.me/TU_CANAL')} // CAMBIA ESTO POR TU CANAL
          >
            Unirme al Canal
          </button>
        </div>
      ) : (
        <div>
          <h2>✅ Verificado</h2>
          <p>¡Bienvenido a la Mini App!</p>
          {/* Aquí va el resto de tu app de referidos */}
        </div>
      )}
    </div>
  );
}

export default App;
