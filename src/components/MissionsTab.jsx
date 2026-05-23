import { s } from '../styles/appStyles';

export default function MissionsTab({ userData, openedApps, handleOpenApp, handleClaimMission }) {
  const isNexLegendsCompleted = userData?.missions_completed?.includes('Nex Legends');
  const isGmailCompleted = userData?.missions_completed?.includes('gmail');

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
            <button style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', backgroundColor: openedApps[missionId] ? '#0088cc' : '#334455', opacity: openedApps[missionId] ? 1 : 0.6}} onClick={() => handleClaimMission(missionId)}>Reclamar</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ marginTop: '10px', textAlign: 'left' }}>
      <div style={{textAlign: 'center', marginBottom: '20px'}}>
        <h2 style={{ margin: 0, color: '#fff' }}>📋 Panel de Misiones</h2>
      </div>
      <MissionCard icon="🤖" title="Start Nex Legends" isCompleted={isNexLegendsCompleted} missionId="Nex Legends" url="https://t.me/nexlegendsbot/hunt?startapp=7517815832" />
      <MissionCard icon="✉️" title="Start Gmail Farmer" isCompleted={isGmailCompleted} missionId="gmail" url="https://t.me/GmailFarmerBot?start=7517815832" />
    </div>
  );
}
