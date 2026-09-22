import { s } from '../styles/appStyles';

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div style={s.bottomNav}>
      <div onClick={() => setActiveTab('home')} style={activeTab === 'home' ? s.navItemActive : s.navItem}>
        <span style={{fontSize:'20px'}}>🏠</span><span style={{fontSize:'10px'}}>INICIO</span>
      </div>
      <div onClick={() => setActiveTab('publish')} style={activeTab === 'publish' ? s.navItemActive : s.navItem}>
        <span style={{fontSize:'20px'}}>📢</span><span style={{fontSize:'10px'}}>PUBLICAR</span>
      </div>
      <div onClick={() => setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>
        <span style={{fontSize:'20px'}}>👥</span><span style={{fontSize:'10px'}}>AMIGOS</span>
      </div>
    </div>
  );
}
