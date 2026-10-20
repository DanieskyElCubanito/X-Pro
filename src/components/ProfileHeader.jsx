import React, { useState } from 'react';
import WebApp from '@twa-dev/sdk';

export default function ProfileHeader({ userData }) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTab, setInfoTab] = useState('support'); // support, about, terms

  if (!userData) return null;

  // Intentamos obtener la foto real directamente del SDK de Telegram
  const photoUrl = WebApp.initDataUnsafe?.user?.photo_url;

  // Plan de respaldo: La inicial del usuario
  const avatarLetter = userData?.username ? userData.username.charAt(0).toUpperCase() : 'U';

  const modalStyles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 2, 20, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100000, backdropFilter: 'blur(5px)' },
    card: { background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.95), rgba(20, 8, 38, 0.95))', border: '2px solid #00f0ff', borderRadius: '24px', padding: '20px', width: '100%', maxWidth: '360px', boxShadow: '0 8px 30px rgba(0, 240, 255, 0.2)', color: '#fff', maxHeight: '85vh', display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '900', color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '1px' },
    closeBtn: { background: 'rgba(255, 255, 255, 0.1)', border: '1px solid #ff1493', borderRadius: '10px', padding: '6px 12px', color: '#ff99dd', fontWeight: '900', cursor: 'pointer' },
    tabContainer: { display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '14px' },
    tab: (active) => ({ flex: 1, padding: '8px 0', fontSize: '11px', fontWeight: '900', textAlign: 'center', cursor: 'pointer', borderRadius: '10px', background: active ? 'linear-gradient(90deg, #ff1493, #8a2be2)' : 'transparent', color: active ? '#fff' : '#aaa', border: 'none', transition: '0.2s' }),
    contentArea: { overflowY: 'auto', paddingRight: '4px', fontSize: '13px', lineHeight: '1.6', color: '#ddd' },
    linkBox: { background: 'rgba(0, 240, 255, 0.1)', border: '1px solid #00f0ff', padding: '12px', borderRadius: '12px', marginBottom: '12px', display: 'block', textDecoration: 'none', color: '#fff' }
  };

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        marginBottom: '16px',
        background: 'linear-gradient(135deg, rgba(38, 14, 66, 0.9), rgba(18, 7, 36, 0.9))',
        border: '1.5px solid #8a2be2',
        borderRadius: '20px',
        boxShadow: '0 4px 15px rgba(138, 43, 226, 0.2)',
        position: 'relative'
      }}>

        {/* SISTEMA DE AVATAR INTELIGENTE */}
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt="Avatar" 
            style={{ width: '46px', height: '46px', borderRadius: '50%', marginRight: '14px', border: '2px solid #00f0ff', boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #00f0ff, #ff1493)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', color: '#ffffff', marginRight: '14px', border: '2px solid #00f0ff', boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}>
            {avatarLetter}
          </div>
        )}

        {/* DATOS DEL USUARIO */}
        <div>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: '900', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {userData.username || 'Operador Web3'}
            <span style={{ background: 'rgba(255, 20, 147, 0.2)', border: '1px solid #ff1493', color: '#ff99dd', padding: '2px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>
              VERIFICADO
            </span>
          </h3>
          <p style={{ margin: '2px 0 0 0', color: '#00f0ff', fontSize: '11px', fontWeight: '900' }}>
            ID: {userData.id}
          </p>
        </div>

        {/* BOTÓN DE AJUSTES E INFO */}
        <div style={{ marginLeft: 'auto' }}>
          <button 
            onClick={() => setShowInfoModal(true)}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #8a2be2', borderRadius: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', cursor: 'pointer', boxShadow: '0 0 10px rgba(138, 43, 226, 0.3)', color: '#fff' }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* MODAL DE INFORMACIÓN */}
      {showInfoModal && (
        <div style={modalStyles.overlay}>
          <div className="fade-in" style={modalStyles.card}>
            <div style={modalStyles.header}>
              <h3 style={modalStyles.title}>Click Network</h3>
              <button onClick={() => setShowInfoModal(false)} style={modalStyles.closeBtn}>✕</button>
            </div>

            <div style={modalStyles.tabContainer}>
              <button onClick={() => setInfoTab('support')} style={modalStyles.tab(infoTab === 'support')}>SOPORTE</button>
              <button onClick={() => setInfoTab('about')} style={modalStyles.tab(infoTab === 'about')}>ACERCA DE</button>
              <button onClick={() => setInfoTab('terms')} style={modalStyles.tab(infoTab === 'terms')}>TÉRMINOS</button>
            </div>

            <div style={modalStyles.contentArea}>
              {infoTab === 'support' && (
                <div>
                  <h4 style={{ color: '#00f0ff', marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: '900' }}>Asistencia y Contacto</h4>
                  
                  <a href="https://t.me/TheDannyWeb3" target="_blank" rel="noopener noreferrer" style={modalStyles.linkBox}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>💡</div>
                    <div style={{ fontWeight: '900', color: '#00f0ff', fontSize: '14px' }}>¿Tienes alguna sugerencia?</div>
                    <div style={{ fontSize: '11px', color: '#ccc', marginTop: '4px' }}>Nos encanta mejorar. Contáctanos y cuéntanos tus ideas en <b>@TheDannyWeb3</b>.</div>
                  </a>

                  <a href="https://t.me/TheDannyWeb3" target="_blank" rel="noopener noreferrer" style={{ ...modalStyles.linkBox, borderColor: '#ff1493', background: 'rgba(255, 20, 147, 0.1)' }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>🐛</div>
                    <div style={{ fontWeight: '900', color: '#ff41b4', fontSize: '14px' }}>Recompensa por Bugs</div>
                    <div style={{ fontSize: '11px', color: '#ccc', marginTop: '4px' }}>Si encuentras un error o fallo en la app, dímelo y <b>te llevas 25 CLICKs</b> gratis a tu saldo: <b>@TheDannyWeb3</b>.</div>
                  </a>
                </div>
              )}

              {infoTab === 'about' && (
                <div>
                  <h4 style={{ color: '#ffe600', marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: '900' }}>Sobre Click Network</h4>
                  <p style={{ marginBottom: '10px' }}>
                    <b>Click Network</b> es una plataforma publicitaria y red de intercambio de tráfico nativa de Telegram.
                  </p>
                  <p style={{ marginBottom: '10px' }}>
                    Diseñada para impulsar el crecimiento orgánico de canales, grupos, bots y Mini Apps (Web3) recompensando a los usuarios de la comunidad por su interacción y tiempo.
                  </p>
                  <p>
                    Construida con tecnología blockchain para asegurar la transparencia de pagos usando Telegram Stars y la red TON (The Open Network).
                  </p>
                  <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#888' }}>
                    Versión 1.0.0 (Build 2026)
                  </div>
                </div>
              )}

              {infoTab === 'terms' && (
                <div>
                  <h4 style={{ color: '#00ffaa', marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: '900' }}>Términos y Condiciones</h4>
                  <p style={{ fontSize: '11px', marginBottom: '10px' }}>Al utilizar Click Network, aceptas los siguientes términos de servicio:</p>
                  <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><b>Anti-Fraude:</b> Está estrictamente prohibido el uso de bots, emuladores, granjas de clics o múltiples cuentas. Nos reservamos el derecho de suspender permanentemente las cuentas que muestren actividad fraudulenta.</li>
                    <li><b>Economía Interna:</b> El saldo "CLICK" es una métrica interna de puntos de recompensa y tráfico, no constituye dinero fiat, moneda de curso legal, ni criptomoneda fuera de este ecosistema.</li>
                    <li><b>Contenido:</b> No somos responsables por el contenido de los enlaces promocionados por terceros. Los anuncios de estafas (scams) o contenido ilegal serán eliminados sin reembolso.</li>
                    <li><b>Pagos Web3:</b> Las transacciones en TON y Telegram Stars son definitivas. Asegúrate de verificar los montos exactos antes de proceder.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
