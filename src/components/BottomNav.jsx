import { s } from '../styles/appStyles';

export default function BottomNav({ activeTab, setActiveTab, setView }) {
  return (
    <div style={s.bottomNav}>
      <div onClick={() => { setActiveTab('home'); setView('main'); }} style={activeTab === 'home' ? s.navItemActive : s.navItem}>
        <span style={{fontSize:'20px'}}>🏠</span><span>HOME</span>
      </div>
      <div onClick={() => setActiveTab('missions')} style={activeTab === 'missions' ? s.navItemActive : s.navItem}>
        <span style={{fontSize:'20px'}}>📋</span><span>MISIONES</span>
      </div>
      <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>
        <span style={{fontSize:'20px'}}>👥</span><span>AMIGOS</span>
      </div>
    </div>
  );
}
