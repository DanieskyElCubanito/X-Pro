import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

function App() {
  const [status, setStatus] = useState('loading'); // loading, member, guest

  useEffect(() => {
    WebApp.ready();
    const user = WebApp.initDataUnsafe.user;
    const startParam = WebApp.initDataUnsafe.start_param; // Aquí viene el ID del referido

    if (user) {
      axios.post('/api/verify', { user, start_param: startParam })
        .then(res => {
          if (res.data.success) setStatus('member');
          else setStatus('guest');
        })
        .catch(() => setStatus('error'));
    }
  }, []);

  const referralLink = `https://t.me/IAProfitTonBot/app?startapp=${WebApp.initDataUnsafe.user?.id}`;

  if (status === 'loading') return <div>Cargando...</div>;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      {status === 'guest' ? (
        <div>
          <h1>¡Únete al canal!</h1>
          <p>Para usar esta app debes estar en nuestro canal oficial.</p>
          <button onClick={() => WebApp.openTelegramLink('https://t.me/TuCanal')}>Unirme ahora</button>
        </div>
      ) : (
        <div>
          <h1>Bienvenido, {WebApp.initDataUnsafe.user?.first_name}</h1>
          <div style={{ background: '#222', padding: '15px', borderRadius: '10px' }}>
            <p>Tu enlace de referido:</p>
            <code>{referralLink}</code>
            <br /><br />
            <button onClick={() => WebApp.openLink(`https://t.me/share/url?url=${referralLink}`)}>
              Compartir Enlace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
