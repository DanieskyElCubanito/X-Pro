import { s } from '../styles/appStyles.js'; 

export default function MissionsTab({ userData, openedApps, handleOpenApp, handleClaimMission }) {
  const isNexLegendsCompleted = userData?.missions_completed?.includes('Nex Legends');
  const isGmailCompleted = userData?.missions_completed?.includes('gmail');
  const isCandyCompleted = userData?.missions_completed?.includes('candy');
  const isEarnStarsCompleted = userData?.missions_completed?.includes('earn_stars');
  const isGemFluxCompleted = userData?.missions_completed?.includes('gemflux');

  const handleAdAndClaim = (missionId) => {
    if (!openedApps[missionId]) {
      alert("Debes abrir la app primero antes de poder reclamar.");
      return;
    }

    if (typeof window.showGiga === 'function') {
      window.showGiga()
        .then(() => handleClaimMission(missionId))
        .catch(e => {
          console.error("Anuncio no completado:", e);
          alert("⚠️ Debes ver el anuncio completo para recibir la recompensa.");
        });
    } else {
      handleClaimMission(missionId);
    }
  };

  const MissionCard = ({ icon, title, isCompleted, missionId, url, reward, currency }) => {
    const isUSDT = currency === 'USDT';
    const currencyColor = isUSDT ? '#26A17B' : '#FFD700'; 
    const currencySymbol = isUSDT ? '💲' : '⭐';

    return (
      <div style={{...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#004466', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>{icon}</div>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{title}</p>
            <p style={{ margin: 0, color: currencyColor, fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
              {currencySymbol} +{reward} {currency}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isCompleted ? (
            <button style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', opacity: 0.5, backgroundColor: '#445566'}} disabled>Hecho</button>
          ) : (
            <>
              <button style={{...s.btnOutline, padding: '6px 12px', fontSize: '12px', borderColor: '#00ccff', color: '#00ccff'}} onClick={() => handleOpenApp(missionId, url)}>Abrir App</button>
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
  };

  return (
    <div 
      className="fade-in" 
      style={{ 
        marginTop: '10px', 
        textAlign: 'left', 
        maxHeight: '80vh', 
        overflowY: 'auto', 
        paddingRight: '5px', 
        paddingBottom: '130px' // 🔥 Espacio para que el menú flotante inferior no tape GemFlux
      }}
    >
      <div style={{textAlign: 'center', marginBottom: '20px'}}>
        <h2 style={{ margin: 0, color: '#fff' }}>📋 Panel de Misiones</h2>
        <p style={{ margin: 0, color: '#888', fontSize: '12px', marginTop: '5px' }}>Completa tareas para ganar recompensas</p>
      </div>

      <h3 style={{color: '#fff', fontSize: '14px', borderBottom: '1px solid #1a3a5a', paddingBottom: '5px'}}>💎 Misiones Premium</h3>
      <MissionCard icon="🤖" title="Start Nex Legends" isCompleted={isNexLegendsCompleted} missionId="Nex Legends" url="https://t.me/nexlegendsbot/hunt?startapp=7517815832" reward="0.10" currency="USDT" />
      <MissionCard icon="✉️" title="Start Gmail Farmer" isCompleted={isGmailCompleted} missionId="gmail" url="https://t.me/GmailFarmerBot?start=7517815832" reward="0.15" currency="USDT" />

      <h3 style={{color: '#fff', fontSize: '14px', borderBottom: '1px solid #1a3a5a', paddingBottom: '5px', marginTop: '20px'}}>🪙 Misiones Diarias</h3>
      <MissionCard icon="🍬" title="Dulce (CANDY)" isCompleted={isCandyCompleted} missionId="candy" url="https://t.me/dulcecandybot?start=7517815832" reward="50" currency="PT" />
      <MissionCard icon="⭐" title="Earn Stars" isCompleted={isEarnStarsCompleted} missionId="earn_stars" url="https://t.me/EarnStarsAppBot/?startapp=ref_3gbwvtk" reward="100" currency="PT" />
      <MissionCard icon="💎" title="GemFlux" isCompleted={isGemFluxCompleted} missionId="gemflux" url="https://t.me/GemFlux_bot/app?startapp=7517815832" reward="25" currency="PT" />
    </div>
  );
}