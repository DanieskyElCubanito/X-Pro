export default function BottomNav({ currentTab, setCurrentTab }) {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: '🏠' },
    { id: 'tasks', label: 'Tareas', icon: '📋' },
    { id: 'publish', label: 'Publicar', icon: '✈️' },
    { id: 'top', label: 'Top', icon: '🏆' },
    { id: 'referrals', label: 'Referidos', icon: '👥' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderTop: '2.5px solid #000',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0',
      zIndex: 50
    }}>
      {tabs.map((t) => {
        const isActive = currentTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setCurrentTab(t.id)}
            style={{
              background: isActive ? '#8cb7fc' : 'transparent',
              border: isActive ? '2px solid #000' : 'none',
              borderRadius: '12px',
              boxShadow: isActive ? '2px 2px 0 #000' : 'none',
              padding: '4px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '18px' }}>{t.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#000', marginTop: '2px' }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
