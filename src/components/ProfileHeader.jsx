import WebApp from '@twa-dev/sdk';
import { s } from '../styles/appStyles';

export default function ProfileHeader({ userData }) {
  return (
    <div style={s.profileHeader}>
      <img src={WebApp.initDataUnsafe?.user?.photo_url || 'https://via.placeholder.com/100'} style={s.profileAvatar} alt="avatar" />
      <div>
        <p style={s.profileName}>{userData?.username || 'Usuario'}</p>
        <p style={s.profileId}>ID: {userData?.id}</p>
      </div>
    </div>
  );
}
