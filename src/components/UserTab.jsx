import React from 'react';
import ProfileHeader from './ProfileHeader';

export default function UserTab({ userData, t, lang, setLang }) {
  return (
    <div style={{ paddingBottom: '20px' }}>
      
      {/* 1. LA CABECERA DEL PERFIL AHORA ESTÁ AQUÍ */}
      <ProfileHeader userData={userData} t={t} lang={lang} setLang={setLang} />
      
      {/* 2. OPCIONES ADICIONALES DEL PERFIL */}
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        background: 'linear-gradient(145deg, rgba(20,5,40,0.8), rgba(10,2,20,0.9))', 
        borderRadius: '20px', 
        border: '1px solid #8a2be2', 
        textAlign: 'center', 
        boxShadow: '0 4px 15px rgba(138,43,226,0.15)' 
      }}>
         <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚙️</div>
         <h3 style={{ color: '#fff', margin: '0 0 8px 0', textTransform: 'uppercase', fontSize: '16px', fontWeight: '900' }}>
           {t('nav_user') || 'Ajustes de Perfil'}
         </h3>
         <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
           Desde aquí puedes vincular tu billetera de retiros (USDT BEP20) y revisar tu actividad de inversión.
         </p>
         
         <button style={{ 
           width: '100%', 
           padding: '12px', 
           background: 'rgba(138,43,226,0.2)', 
           border: '1px solid #8a2be2', 
           color: '#fff', 
           borderRadius: '12px', 
           fontWeight: '900', 
           cursor: 'pointer',
           textTransform: 'uppercase',
           transition: 'all 0.2s'
         }}>
            Vincular Billetera BEP20
         </button>
      </div>

    </div>
  );
}