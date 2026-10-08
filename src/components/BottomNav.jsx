import React from 'react';

// Iconos vectoriales idénticos a la barra de navegación de tu captura
const TabIcons = {
  // Casa con tejado y puerta
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9.5z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),

  // Portapapeles con renglones
  tasks: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="18" x2="13" y2="18" />
    </svg>
  ),

  // Avión de papel diagonal
  publish: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="none" />
    </svg>
  ),

  // Copa / Trofeo
  top: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12v4a6 6 0 0 1-12 0V4z" />
      <path d="M6 6H3a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1" />
      <path d="M18 6h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" />
      <path d="M12 14v4" />
      <path d="M8 21h8" />
      <path d="M10 18h4" />
    </svg>
  ),

  // Siluetas de usuarios / afiliados
  referrals: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2 19a7 7 0 0 1 14 0v1H2v-1z" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M16 14.5a5.5 5.5 0 0 1 6 4.5v1h-3" />
    </svg>
  )
};

export default function BottomNav({ currentTab, setCurrentTab }) {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: TabIcons.home },
    { id: 'tasks', label: 'Tareas', icon: TabIcons.tasks },
    { id: 'publish', label: 'Publicar', icon: TabIcons.publish },
    { id: 'top', label: 'Top', icon: TabIcons.top },
    { id: 'referrals', label: 'Referidos', icon: TabIcons.referrals }
  ];

  const handleSelectTab = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof setCurrentTab === 'function') {
      setCurrentTab(id);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTop: '2.5px solid #000000',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '6px 4px 10px 4px',
        zIndex: 999999,
        userSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={(e) => handleSelectTab(e, tab.id)}
            onTouchEnd={(e) => handleSelectTab(e, tab.id)}
            style={{
              flex: 1,
              maxWidth: '68px',
              height: '52px',
              backgroundColor: isActive ? '#6ba4f8' : 'transparent',
              border: isActive ? '2px solid #000000' : '2px solid transparent',
              borderRadius: '14px',
              boxShadow: isActive ? '3px 3px 0px #000000' : 'none',
              transform: isActive ? 'translate(-1px, -1px)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              cursor: 'pointer',
              outline: 'none',
              padding: 0,
              color: '#000000'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {tab.icon}
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '-0.3px',
                lineHeight: 1
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
