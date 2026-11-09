 import React from 'react';

const TabIcons = {
  home: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff41b4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(255,65,180,0.5))' }}>
      <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9.5z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  goods: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.5))' }}>
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
      <path d="M18 14h-8" />
      <path d="M18 18h-8" />
    </svg>
  ),
  team: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ffaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,170,0.5))' }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  earn: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffe600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(255,230,0,0.5))' }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  ),
  user: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8a2be2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(138,43,226,0.5))' }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  admin: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff1493" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(255,20,147,0.5))' }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
};

export default function BottomNav({ activeTab, setActiveTab, userData, t }) {
  const ADMIN_IDS = ['8968109534', '8968109534'];
  const isAdmin = userData && ADMIN_IDS.includes(String(userData.id));

  // 🔥 Se usan las traducciones (asegúrate de que en translations.js existan estos keys)
  const tabs = [
    { id: 'home', label: t('nav_home'), icon: TabIcons.home, color: '#ff41b4' },
    { id: 'goods', label: t('nav_goods'), icon: TabIcons.goods, color: '#00f0ff' },
    { id: 'team', label: t('nav_team'), icon: TabIcons.team, color: '#00ffaa' },
    { id: 'earn', label: t('nav_earn'), icon: TabIcons.earn, color: '#ffe600' },
    { id: 'user', label: t('nav_user'), icon: TabIcons.user, color: '#8a2be2' }
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: t('nav_admin'), icon: TabIcons.admin, color: '#ff1493' });
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(5, 1, 13, 0.95)', backdropFilter: 'blur(16px)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 8px 16px 8px', borderTop: '2px solid #8a2be2',
      boxShadow: '0 -4px 20px rgba(138, 43, 226, 0.3)', zIndex: 99999, userSelect: 'none'
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, maxWidth: '75px', height: '54px',
              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              border: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
              borderRadius: '14px', boxShadow: isActive ? `0 0 10px ${tab.color}40` : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '4px', cursor: 'pointer', outline: 'none', padding: 0, color: '#000000',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}>
              {tab.icon}
            </div>
            <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '-0.3px', lineHeight: 1, color: isActive ? tab.color : '#888' }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
