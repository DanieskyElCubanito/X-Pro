import { useState, useEffect } from 'react';
import { s } from '../styles/appStyles.js'; 
import CreateMissionModal from './CreateMissionModal'; // Asegúrate de crear e importar este archivo
import { botApi } from '../api/botApi'; // Para cargar las misiones dinámicas

export default function MissionsTab({ userData, setUserData, openedApps, handleOpenApp, handleClaimMission }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar misiones desde la base de datos al montar el componente
  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const res = await botApi.getActiveMissions(); 
        if (res.success) {
          setMissions(res.missions);
        }
      } catch (e) {
        console.error("Error cargando misiones", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, [showCreateModal]); // Se vuelve a ejecutar cuando se cierra el modal para actualizar la lista

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

  const MissionCard = ({ mission }) => {
    const isCompleted = userData?.missions_completed?.includes(mission.id);

    return (
      <div style={{...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '15px', backgroundColor: '#112233', border: '1px solid #1a3a5a'}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#004466', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
            🔗
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{mission.title}</p>
            <p style={{ margin: 0, color: '#FFD700', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
              🪙 +{mission.reward_per_click} PT
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isCompleted ? (
            <button style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', opacity: 0.5, backgroundColor: '#445566'}} disabled>Hecho</button>
          ) : (
            <>
              <button style={{...s.btnOutline, padding: '6px 12px', fontSize: '12px', borderColor: '#00ccff', color: '#00ccff'}} onClick={() => handleOpenApp(mission.id, mission.url)}>Abrir App</button>
              <button 
                style={{...s.btnGreen, padding: '6px 12px', fontSize: '12px', backgroundColor: openedApps[mission.id] ? '#0088cc' : '#334455', opacity: openedApps[mission.id] ? 1 : 0.6}} 
                onClick={() => handleAdAndClaim(mission.id)}
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
        paddingBottom: '130px' 
      }}
    >
      <div style={{textAlign: 'center', marginBottom: '20px'}}>
        <h2 style={{ margin: 0, color: '#fff' }}>📋 Panel de Misiones</h2>
        <p style={{ margin: 0, color: '#888', fontSize: '12px', marginTop: '5px' }}>Completa tareas de otros usuarios o promociona la tuya</p>
      </div>

      <button 
        onClick={() => setShowCreateModal(true)} 
        style={{
          ...s.btnGreen, 
          width: '100%', 
          marginBottom: '20px', 
          backgroundColor: '#FFD700', 
          color: '#000', 
          fontWeight: 'bold',
          padding: '12px',
          fontSize: '14px'
        }}
      >
        ➕ Crear mi Misión (Usar PT)
      </button>

      <h3 style={{color: '#fff', fontSize: '14px', borderBottom: '1px solid #1a3a5a', paddingBottom: '5px'}}>🌍 Misiones de la Comunidad</h3>
      
      {loading ? (
        <p style={{ textAlign: 'center', color: '#888', fontSize: '12px', marginTop: '20px' }}>Cargando misiones disponibles...</p>
      ) : missions.length > 0 ? (
        missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))
      ) : (
        <p style={{ textAlign: 'center', color: '#888', fontSize: '12px', marginTop: '20px' }}>No hay misiones activas en este momento. ¡Sé el primero en crear una!</p>
      )}

      {showCreateModal && (
        <CreateMissionModal 
          userData={userData} 
          setUserData={setUserData} 
          onClose={() => setShowCreateModal(false)} 
        />
      )}
    </div>
  );
}
