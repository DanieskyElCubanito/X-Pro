import React from 'react';

export default function ProfileHeader({ userData }) {
  if (!userData) return null;

  // Sacamos la primera letra del usuario para hacerle un avatar Neón
  const avatarLetter = userData?.username ? userData.username.charAt(0).toUpperCase() : 'U';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      marginBottom: '16px',
      background: 'linear-gradient(135deg, rgba(38, 14, 66, 0.9), rgba(18, 7, 36, 0.9))',
      border: '1.5px solid #8a2be2',
      borderRadius: '20px',
      boxShadow: '0 4px 15px rgba(138, 43, 226, 0.2)'
    }}>
      {/* AVATAR NEÓN */}
      <div style={{
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #00f0ff, #ff1493)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: '900',
        color: '#ffffff',
        marginRight: '14px',
        border: '2px solid #00f0ff',
        boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
      }}>
        {avatarLetter}
      </div>
      
      {/* DATOS DEL USUARIO */}
      <div>
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: '900', letterSpacing: '0.5px' }}>
          {userData.username || 'Operador Web3'}
        </h3>
        <p style={{ margin: '2px 0 0 0', color: '#00f0ff', fontSize: '11px', fontWeight: '900' }}>
          ID: {userData.id}
        </p>
      </div>

      {/* INSIGNIA PRO */}
      <div style={{ marginLeft: 'auto' }}>
        <span style={{
          background: 'rgba(255, 20, 147, 0.2)',
          border: '1px solid #ff1493',
          color: '#ff99dd',
          padding: '4px 8px',
          borderRadius: '8px',
          fontSize: '10px',
          fontWeight: '900',
          textTransform: 'uppercase'
        }}>
          VERIFICADO
        </span>
      </div>
    </div>
  );
}
