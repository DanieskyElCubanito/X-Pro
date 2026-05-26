import { s } from '../styles/appStyles.js'; // ✅ Mantenemos el .js para Vercel

export default function MissionsTab({ userData, openedApps, handleOpenApp, handleClaimMission }) {
  // Estado de misiones existentes
  const isNexLegendsCompleted = userData?.missions_completed?.includes('Nex Legends');
  const isGmailCompleted = userData?.missions_completed?.includes('gmail');
  
  // Estado de las nuevas misiones
  const isCandyCompleted = userData?.missions_completed?.includes('candy');
  const isEarnStarsCompleted = userData?.missions_completed?.includes('earn_stars');
  const isGemFluxCompleted = userData?.missions_completed?.includes('gemflux');

  // --- LÓGICA DE ANUNCIOS INTERCEPTORA ---
  const handleAdAndClaim = (missionId) => {
    // 1. Validamos que el botón no esté opaco/desactivado
    if (!openedApps[missionId]) {
      alert("Debes abrir la app primero antes de poder reclamar.");
      return;
    }

    // 2. Llamamos al anuncio de Giga
    if (typeof window.showGiga === 'function') {
      window.showGiga()
        .then(() => {
          // ✅ El anuncio se vio correctamente. Procedemos a darle el dinero.
          handleClaimMission(missionId);
        })
        .catch(e => {
          // ❌ El usuario cerró el anuncio antes de tiempo o hubo un error de red.
          console.error("El anuncio no se completó:", e);
          alert("⚠️ Debes ver el anuncio completo para recibir la recompensa.");
        });
    } else {
      // RESPALDO: Si el script de anuncios no cargó (ej. usaron AdBlocker), 
      // puedes decidir si bloquearlos o darles el premio. Aquí se lo damos por defecto.
      handleClaimMission(missionId);
    }
  };

  const MissionCard = ({ icon, title, isCompleted, missionId, url }) => (
    <div style={{...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: '#004466', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>{icon}</div>
        <div>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{title}</p>
          <p style={{ margin: 0, color: '#00ccff', fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>⚡ +0.001 TON</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isCompleted ? (
          <button style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', opacity: 0.5}} disabled>Completada</button>
        ) : (
          <>
            <button style={{...s.btnOutline, padding: '6px 12px', fontSize: '12px', borderColor: '#00ccff', color: '#00ccff'}} onClick={() => handleOpenApp(missionId, url)}>Abrir App</button>
            {/* 👇 Aquí cambiamos handleClaimMission directo por nuestro interceptor de anuncios */}
            <button 
              style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', backgroundColor: openedApps[missionId] ? '#0088cc' : '#334455', opacity: openedApps[missionId] ? 1 : 0.6}} 
              onClick={() => handleAdAndClaim(missionId)}
            >
              Reclamar
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className="fade-in" 
      style={{ 
        marginTop: '10px', 
        textAlign: 'left',
        maxHeight: '70vh',
        overflowY: 'auto',
        paddingRight: '5px',
        paddingBottom: '30px'
      }}
    >
      <div style={{textAlign: 'center', marginBottom: '20px'}}>
        <h2 style={{ margin: 0, color: '#fff' }}>📋 Panel de Misiones</h2>
      </div>
      
      {/* Misiones Existentes */}
      <MissionCard icon="🤖" title="Start Nex Legends" isCompleted={isNexLegendsCompleted} missionId="Nex Legends" url="https://t.me/nexlegendsbot/hunt?startapp=7517815832" />
      <MissionCard icon="✉️" title="Start Gmail Farmer" isCompleted={isGmailCompleted} missionId="gmail" url="https://t.me/GmailFarmerBot?start=7517815832" />
      
      {/* Nuevas Misiones */}
      <MissionCard icon="🍬" title="Dulce (CANDY)" isCompleted={isCandyCompleted} missionId="candy" url="https://t.me/dulcecandybot?start=7517815832" />
      <MissionCard icon="⭐" title="Earn Stars" isCompleted={isEarnStarsCompleted} missionId="earn_stars" url="https://t.me/EarnStarsAppBot/?startapp=ref_3gbwvtk" />
      <MissionCard icon="💎" title="GemFlux" isCompleted={isGemFluxCompleted} missionId="gemflux" url="https://t.me/GemFlux_bot/app?startapp=7517815832" />
    </div>
  );
}