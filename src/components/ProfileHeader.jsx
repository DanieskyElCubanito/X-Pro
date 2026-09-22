import WebApp from '@twa-dev/sdk';
import { s } from '../styles/appStyles';

export default function ProfileHeader({ userData }) {
  const ptBalance = Number(userData?.points || 0);

  return (
    <div style={{ ...s.profileHeader, flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <img 
          src={WebApp.initDataUnsafe?.user?.photo_url || 'https://via.placeholder.com/100'} 
          style={s.profileAvatar} 
          alt="avatar" 
        />
        <div style={{ marginLeft: '15px' }}>
          <p style={s.profileName}>{userData?.username || 'Usuario'}</p>
          <p style={s.profileId}>ID: {userData?.id}</p>
        </div>
      </div>

      {/* Panel de Puntos (PT) */}
      <div style={{ backgroundColor: '#004466', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Mis Puntos Acumulados</p>
        <p style={{ margin: '5px 0 0', fontSize: '20px', color: '#FFD700', fontWeight: 'bold' }}>🪙 {ptBalance} PT</p>
      </div>
    </div>
  );
}