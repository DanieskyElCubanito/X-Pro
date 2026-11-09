import React from 'react';

export default function UserTab({ userData, t, lang, setLang }) {
  return (
    <div className="fade-in" style={{ paddingBottom: '20px', textAlign: 'center' }}>
      <h2 style={{ color: '#8a2be2', fontWeight: '900', textTransform: 'uppercase' }}>Perfil / Ajustes</h2>
      <p style={{ color: '#ff99dd' }}>Cargando perfil...</p>
    </div>
  );
}
