import { s } from '../styles/appStyles';

function AdsTab() {
  return (
    <div className="tab-content fade-in" style={{ paddingBottom: '130px' }}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <span style={{ fontSize: '30px' }}>🚧</span>
          <h4 style={{ color: '#fff', marginTop: '10px' }}>Sección deshabilitada</h4>
          <p style={{ color: '#888', fontSize: '12px' }}>
            Los anuncios han sido removidos de la plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdsTab;
