import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { s } from '../styles/appStyles.js'; 
import CreateMissionModal from './CreateMissionModal'; 
import { botApi } from '../api/botApi'; 

// --- ESTILOS NEÓN LOCALES PARA TAREAS ---
const localNeon = {
  taskCard: {
    ...s.card,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    padding: '16px',
    background: 'linear-gradient(135deg, rgba(38, 14, 66, 0.9), rgba(18, 7, 36, 0.9))',
    border: '2px solid #8a2be2',
    boxShadow: '0 4px 15px rgba(138, 43, 226, 0.2)'
  },
  btnAction: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '900',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase'
  }
};

export default function AdsTab({ userData, setUserData, openedApps = {}, handleOpenApp, handleClaimMission }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar misiones desde la base de datos al montar el componente
  useEffect(() => {
    const fetchMissions = async () => {
      setLoading(true);
      try {
        const res = await botApi.getActiveMissions(); 
        if (res.success) {
          setMissions(res.missions);
        }
      } catch (e) {
        toast.error("Error al cargar las tareas.");
        console.error("Error cargando misiones", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, [showCreateModal]);

  const handleAdAndClaim = (missionId) => {
    if (!openedApps[missionId]) {
      toast.error("Debes abrir el enlace primero antes de poder reclamar.", { icon: '🔗' });
      return;
    }

    if (typeof window.showGiga === 'function') {
      window.showGiga()
        .then(() => handleClaimMission(missionId))
        .catch(e => {
          console.error("Anuncio no completado:", e);
          toast.error("⚠️ Debes ver el anuncio completo para recibir tu saldo.", { duration: 4000 });
        });
    } else {
      handleClaimMission(missionId);
    }
  };

  const MissionCard = ({ mission }) => {
    const isCompleted = userData?.missions_completed?.includes(mission.id);
    const hasOpened = openedApps[mission.id];

    return (
      <div style={{
        ...localNeon.taskCard,
        borderColor: isCompleted ? 'rgba(0, 255, 170, 0.4)' : '#8a2be2',
        opacity: isCompleted ? 0.7 : 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '42px', height: '42px', 
            background: isCompleted ? 'rgba(0, 255, 170, 0.1)' : 'rgba(0, 240, 255, 0.1)', 
            border: isCompleted ? '1.5px solid #00ffaa' : '1.5px solid #00f0ff',
            borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' 
          }}>
            {isCompleted ? '✓' : '🔗'}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: '900', fontSize: '14px', color: '#fff' }}>
              {mission.title}
            </p>
            <p style={{ margin: 0, color: '#ffe600', fontSize: '12px', fontWeight: '900', marginTop: '4px', textShadow: '0 0 10px rgba(255, 230, 0, 0.4)' }}>
              ⚡ +{mission.reward_per_click} CLICK
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isCompleted ? (
            <button style={{
              ...localNeon.btnAction, 
              background: 'rgba(0, 255, 170, 0.2)', color: '#00ffaa', border: '1px solid #00ffaa'
            }} disabled>
              HECHO
            </button>
          ) : (
            <>
              <button 
                style={{
                  ...localNeon.btnAction, 
                  background: 'transparent', color: '#00f0ff', border: '1.5px solid #00f0ff'
                }} 
                onClick={() => handleOpenApp(mission.id, mission.url)}
              >
                1. ABRIR
              </button>
              
              <button 
                style={{
                  ...localNeon.btnAction, 
                  background: hasOpened ? 'linear-gradient(90deg, #ff1493, #d80073)' : 'rgba(255, 20, 147, 0.2)', 
                  color: hasOpened ? '#ffffff' : '#ff99dd', 
                  border: hasOpened ? 'none' : '1px solid rgba(255, 20, 147, 0.5)',
                  boxShadow: hasOpened ? '0 4px 10px rgba(255, 20, 147, 0.4)' : 'none'
                }} 
                onClick={() => handleAdAndClaim(mission.id)}
              >
                2. RECLAMAR
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '30px' }}>
      
      {/* CABECERA */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '42px', marginBottom: '8px', filter: 'drop-shadow(0 0 15px rgba(255, 65, 180, 0.4))' }}>
          🚀
        </div>
        <h2 style={{ margin: '0 0 6px 0', color: '#00f0ff', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase' }}>
          MERCADO DE TRÁFICO
        </h2>
        <p style={{ margin: 0, color: '#ff99dd', fontSize: '13px', fontWeight: 'bold' }}>
          Completa tareas o crea la tuya para ganar CLICK
        </p>
      </div>

      {/* BOTÓN CREAR MISIÓN (Si deseas usar este botón en lugar del PublishTab) */}
      <button 
        onClick={() => setShowCreateModal(true)} 
        style={{
          ...s.btnGreen, 
          width: '100%', 
          marginBottom: '24px', 
          background: 'linear-gradient(90deg, #ffe600, #ffaa00)', 
          color: '#050214', 
          boxShadow: '0 6px 0 #cc8800, 0 10px 20px rgba(255, 230, 0, 0.3)'
        }}
      >
        ➕ CREAR CAMPAÑA (USA TU SALDO)
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>
          🌍 TAREAS DE LA COMUNIDAD
        </h3>
        <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #8a2be2, transparent)' }}></div>
      </div>

      {/* LISTA DE MISIONES */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ ...s.loader, margin: '0 auto', width: '30px', height: '30px', borderWidth: '3px' }}></div>
          <p style={{ color: '#00f0ff', fontSize: '13px', fontWeight: 'bold', marginTop: '12px' }}>Sincronizando red...</p>
        </div>
      ) : missions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {missions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>
      ) : (
        <div style={{ ...s.card, textAlign: 'center', padding: '30px 20px', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <span style={{ fontSize: '30px', display: 'block', marginBottom: '10px' }}>🏜️</span>
          <p style={{ color: '#ff99dd', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.5', margin: 0 }}>
            No hay campañas activas en este momento.<br/>¡Sé el primero en crear una!
          </p>
        </div>
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
