import WebApp from '@twa-dev/sdk';
import toast, { Toaster } from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles';

export default function ChannelJoin({ channelStatus, setChannelStatus, userData, setMustJoin }) {
  
  const handleCheckChannels = async () => {
    const tid = toast.loading("Verificando canales...");
    try {
      const res = await botApi.checkChannels(userData.id);
      if (res.allJoined) {
        setMustJoin(false);
        toast.success("¡Perfecto! Ya puedes entrar", { id: tid });
      } else {
        setChannelStatus({ c1: res.channel1, c2: res.channel2 });
        toast.error("Aún no te has unido a todos los canales", { id: tid });
      }
    } catch (e) {
      toast.error("Error al verificar. Intenta de nuevo.", { id: tid });
    }
  };

  return (
    <div style={{...s.container, padding: '40px 20px', textAlign: 'center'}}>
      <Toaster position="top-center" />
      <h2 style={{color: '#0088cc', marginBottom: '10px'}}>¡Casi listo! 🚀</h2>
      <p style={{fontSize: '14px', color: '#888', marginBottom: '30px'}}>
        Para activar tu cuenta y empezar a ganar, únete a nuestros canales oficiales:
      </p>

      <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
        {!channelStatus.c1 && (
          <div style={{...s.card, border: '1px solid #0088cc'}}>
            <p style={{margin: '0 0 10px 0', fontWeight: 'bold'}}>Crypto ₿itcoin</p>
            <button style={s.btnGreen} onClick={() => WebApp.openTelegramLink('https://t.me/CryptosBitcoins')}>
              UNIRME CANAL 1
            </button>
          </div>
        )}
        {!channelStatus.c2 && (
          <div style={{...s.card, border: '1px solid #0088cc'}}>
            <p style={{margin: '0 0 10px 0', fontWeight: 'bold'}}>👑𝘾𝙧𝙮𝙥𝙩𝙤 𝙞𝙣𝙫𝙚𝙨𝙩𝙢𝙚𝙣𝙩𝙨👑</p>
            <button style={s.btnGreen} onClick={() => WebApp.openTelegramLink('https://t.me/CryptoInvestmentsWebs')}>
              UNIRME CANAL 2
            </button>
          </div>
        )}
      </div>

      <button 
        style={{...s.btnOutline, marginTop: '40px', width: '100%', color: '#28a745', borderColor: '#28a745'}} 
        onClick={handleCheckChannels}
      >
        🔄 YA ME UNÍ, VERIFICAR
      </button>
    </div>
  );
}
