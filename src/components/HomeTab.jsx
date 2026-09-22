import DailyCheckIn from './DailyCheckIn';
import { s } from '../styles/appStyles';

export default function HomeTab({ userData, setUserData }) {
  // El backend devuelve 'balance'
  const ptBalance = userData?.balance || 0;

  return (
    <div style={{ marginTop: '10px' }} className="fade-in">
      <div style={s.card}>
        <h4 style={{ color: '#888', margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold' }}>
          TU SALDO ACTUAL
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '38px', fontWeight: '900', color: '#ffcc00' }}>{ptBalance}</span>
          <span style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>PT</span>
        </div>
        <p style={{ fontSize: '11px', color: '#666', marginTop: '10px', lineHeight: '1.4' }}>
          Gana Puntos (PT) invitando a tus amigos o viendo anuncios. Usa tus PT para publicar enlaces en nuestros grupos.
        </p>
      </div>

      <DailyCheckIn userData={userData} setUserData={setUserData} />
    </div>
  );
}
