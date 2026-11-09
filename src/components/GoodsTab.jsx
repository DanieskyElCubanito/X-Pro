import React from 'react';

export default function GoodsTab({ userData, setUserData, t }) {
  return (
    <div className="fade-in" style={{ paddingBottom: '20px', textAlign: 'center' }}>
      <h2 style={{ color: '#00f0ff', fontWeight: '900', textTransform: 'uppercase' }}>Zapatillas / Planes</h2>
      <p style={{ color: '#ff99dd' }}>Cargando tienda...</p>
    </div>
  );
}
