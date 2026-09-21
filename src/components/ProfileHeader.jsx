import WebApp from '@twa-dev/sdk';
import { s } from '../styles/appStyles';

export default function ProfileHeader({ userData }) {
  const usdtBalance = Number(userData?.balance || 0).toFixed(4);
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
      
      {/* Panel de Saldos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#004466', padding: '12px', borderRadius: '10px' }}>
        <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #1a3a5a' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Saldo USDT</p>
          <p style={{ margin: '5px 0 0', fontSize: '16px', color: '#26A17B', fontWeight: 'bold' }}>💵 {usdtBalance}</p>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Puntos (PT)</p>
          <p style={{ margin: '5px 0 0', fontSize: '16px', color: '#FFD700', fontWeight: 'bold' }}>🪙 {ptBalance}</p>
        </div>
      </div>
    </div>
  );
}