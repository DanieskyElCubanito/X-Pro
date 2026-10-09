import { useState } from 'react';
import toast from 'react-hot-toast';

// --- ESTILOS NEÓN CYBERPUNK (Aplicados a la estructura Neobrutalista) ---
const neon = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },
  
  // 1. Header 
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  iconBtn: {
    width: '46px', height: '46px', background: 'rgba(15, 5, 28, 0.8)',
    border: '2px solid #8a2be2', borderRadius: '14px', boxShadow: '0 0 10px rgba(138, 43, 226, 0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', color: '#ffffff'
  },
  title: {
    fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', textTransform: 'uppercase',
    color: '#00f0ff', margin: 0, textShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
  },

  // 2. Stats Cards
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px'
  },
  statCard: (borderColor, bgColor, glowColor) => ({
    background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '20px',
    boxShadow: `0 4px 15px ${glowColor}`, padding: '16px 6px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center'
  }),
  statInnerIcon: {
    width: '36px', height: '36px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '10px'
  },
  statNumber: {
    fontSize: '22px', fontWeight: '900', lineHeight: '1.1', marginBottom: '6px', color: '#ffffff'
  },
  statDesc: {
    fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.2', color: '#ff99dd'
  },

  // 3. Info Box "CÓMO FUNCIONA"
  infoCard: {
    background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.6), rgba(20, 8, 38, 0.8))',
    border: '2px solid #8a2be2', borderRadius: '26px', boxShadow: '0 8px 24px rgba(138, 43, 226, 0.2)',
    padding: '20px 18px', marginBottom: '20px'
  },
  howTitle: {
    fontSize: '14px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#ffe600', marginBottom: '16px'
  },
  howStep: {
    display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0'
  },
  howStepIcon: (bgColor, textColor, glowColor) => ({
    width: '44px', height: '44px', background: bgColor, color: textColor, borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900',
    flexShrink: 0, boxShadow: `0 0 15px ${glowColor}`
  }),
  howStepText: {
    fontSize: '14px', fontWeight: '800', lineHeight: '1.3', color: '#ffffff'
  },
  dashedDivider: {
    border: 'none', borderTop: '2px dashed rgba(255, 65, 180, 0.4)', margin: '6px 0'
  },

  // 4. Botones Principales
  btnClick: {
    width: '100%', background: 'linear-gradient(180deg, #ff1493 0%, #d80073 100%)', color: '#ffffff',
    border: 'none', borderRadius: '20px', boxShadow: '0 6px 0 #8b004b, 0 10px 20px rgba(255, 20, 147, 0.4)',
    padding: '16px', fontSize: '15px', fontWeight: '900', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', marginBottom: '12px'
  },
  btnCrypto: {
    width: '100%', background: 'linear-gradient(180deg, #00f0ff 0%, #0088ff 100%)', color: '#050214',
    border: '2px solid #ffffff', borderRadius: '20px', boxShadow: '0 6px 0 #0055aa, 0 10px 25px rgba(0, 240, 255, 0.5)',
    padding: '16px', fontSize: '15px', fontWeight: '900', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer'
  }
};

export default function HomeTab({ userData }) {
  // Saldo normal del usuario
  const clickBalance = Number(userData?.balance || 0).toFixed(2);
  
  // En el futuro, estas dos variables vendrán del backend sumando las tareas:
  // Clicks globales de toda la plataforma
  const globalClicks = userData?.global_clicks || '232.1K';
  // Clicks recibidos en las tareas creadas por este usuario
  const clicksReceived = userData?.clicks_received || '0';

  return (
    <div className="fade-in" style={neon.container}>
      
      {/* HEADER */}
      <div style={neon.header}>
        <div 
          onClick={() => toast('El historial estará disponible pronto.', {icon: '🕒'})} 
          style={neon.iconBtn}
        >
          🕒
        </div>
        <h1 style={neon.title}>INICIO</h1>
        <div style={{ width: '46px' }}></div> {/* Espaciador invisible para centrar el título */}
      </div>

      {/* TRES TARJETAS DE MÉTRICAS */}
      <div style={neon.statsGrid}>
        {/* Global (Morado/Neón) - Tareas completadas en toda la red */}
        <div style={neon.statCard('#8a2be2', 'rgba(138, 43, 226, 0.2)', 'rgba(138, 43, 226, 0.3)')}>
          <div style={neon.statInnerIcon}>🌐</div>
          <div style={neon.statNumber}>{globalClicks}</div>
          <div style={{...neon.statDesc, color: '#ff99dd'}}>Clicks Globales</div>
        </div>

        {/* Saldo de Clicks (Amarillo/Cian) - Saldo normal del usuario */}
        <div style={neon.statCard('#00f0ff', 'rgba(0, 240, 255, 0.1)', 'rgba(0, 240, 255, 0.3)')}>
          <div style={neon.statInnerIcon}>⚡</div>
          <div style={{...neon.statNumber, color: '#00f0ff'}}>{clickBalance}</div>
          <div style={{...neon.statDesc, color: '#ffffff'}}>Saldo</div>
        </div>

        {/* Clicks Recibidos (Magenta/Rosa) - Tráfico recibido a sus propias campañas */}
        <div style={neon.statCard('#ff1493', 'rgba(255, 20, 147, 0.2)', 'rgba(255, 20, 147, 0.3)')}>
          <div style={neon.statInnerIcon}>📥</div>
          <div style={neon.statNumber}>{clicksReceived}</div>
          <div style={{...neon.statDesc, color: '#ff99dd'}}>Recibidos</div>
        </div>
      </div>

      {/* SECCIÓN "CÓMO FUNCIONA" */}
      <div style={neon.infoCard}>
        <div style={neon.howTitle}>MERCADO DE TRÁFICO</div>

        {/* Paso 1 */}
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#00f0ff', '#050214', 'rgba(0, 240, 255, 0.4)')}>+</div>
          <div style={neon.howStepText}>Crea una campaña y atrae usuarios a tu Bot o Grupo.</div>
        </div>

        <hr style={neon.dashedDivider} />

        {/* Paso 2 */}
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#ffe600', '#050214', 'rgba(255, 230, 0, 0.4)')}>⚡</div>
          <div style={neon.howStepText}>Completa tareas de otros para ganar saldo CLICK gratis.</div>
        </div>

        <hr style={neon.dashedDivider} />

        {/* Paso 3 */}
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#ff1493', '#ffffff', 'rgba(255, 20, 147, 0.4)')}>💎</div>
          <div style={neon.howStepText}>Usa GRAM o TON para campañas de tráfico masivo pagado.</div>
        </div>
      </div>

      {/* BOTONES DE CREACIÓN DE TAREAS */}
      
      {/* Botón 1: Pagar con saldo interno (CLICK) */}
      <button 
        onClick={() => toast('Ve a la pestaña de "Publicar" para crear tareas gratis.', {icon: '⚡'})} 
        style={neon.btnClick}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>+</span> CREA TU PRIMERA TAREA
        </div>
        <span style={{ fontSize: '10px', color: '#ffb3d9', fontWeight: 'bold', textTransform: 'none' }}>
          Usa tu saldo CLICK
        </span>
      </button>

      {/* Botón 2: Pagar con Criptomonedas (GRAM) */}
      <button 
        onClick={() => toast('La pasarela de pagos con GRAM estará disponible muy pronto.', {icon: '💎'})} 
        style={neon.btnCrypto}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💎</span> CREAR CAMPAÑA DE TRÁFICO
        </div>
        <span style={{ fontSize: '10px', color: '#050214', fontWeight: 'bold', textTransform: 'none' }}>
          Paga con GRAM / Crypto
        </span>
      </button>

    </div>
  );
}
