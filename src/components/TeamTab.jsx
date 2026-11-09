import React, { useState } from 'react';
import toast from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';

export default function TeamTab({ userData, t }) {
  // Enlace de invitación dinámico basado en el ID del usuario
  const inviteLink = `https://t.me/ClickNetworkbot/app?startapp=${userData?.id || '999999'}`;

  // Datos simulados para la interfaz (luego los conectaremos al backend)
  const stats = {
    totalTeam: 24,
    totalInvestors: 7,
    rechargeCommission: 145.50
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('¡Enlace de invitación copiado!');
  };

  const shareTelegram = () => {
    const text = encodeURIComponent("¡Únete a mi equipo en ClickSneakers y gana 2% diario en USDT!");
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`¡Únete a mi equipo en ClickSneakers y gana 2% diario en USDT! Únete aquí: ${inviteLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent("¡Gana 2% diario en USDT con Web3 Sneakers! Únete a mi equipo en Telegram 👇");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(inviteLink)}`, '_blank');
  };

  const styles = {
    container: { paddingBottom: '20px' },
    sectionTitle: { color: '#fff', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
    
    // Tarjeta de Promoción
    promoCard: { background: 'linear-gradient(145deg, rgba(20,5,40,0.9), rgba(10,2,20,0.95))', border: '2px solid #00ffaa', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0, 255, 170, 0.2)', marginBottom: '24px', textAlign: 'center' },
    promoGlow: { position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(0, 255, 170, 0.2) 0%, transparent 70%)', pointerEvents: 'none' },
    promoTitle: { margin: '0 0 16px 0', color: '#00ffaa', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' },
    linkBox: { background: 'rgba(0,0,0,0.4)', border: '1px dashed #00ffaa', borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '13px', wordBreak: 'break-all', marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
    copyBtn: { width: '100%', background: 'linear-gradient(90deg, #00ffaa, #00b377)', border: 'none', borderRadius: '12px', padding: '14px', color: '#000', fontSize: '14px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(0, 255, 170, 0.4)' },

    // Estadísticas del Equipo
    statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' },
    statBox: (color) => ({ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}40`, borderRadius: '16px', padding: '16px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }),
    statLabel: { color: '#aaa', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' },
    statValue: (color) => ({ color: color, fontSize: '24px', fontWeight: '900', textShadow: `0 0 10px ${color}50` }),
    
    // Comisiones por Recarga
    rebateBox: { background: 'rgba(255, 20, 147, 0.1)', border: '1px solid #ff1493', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '24px', boxShadow: '0 4px 15px rgba(255, 20, 147, 0.15)' },

    // Social Promotion
    socialGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' },
    socialBtn: (color) => ({ background: `${color}15`, border: `1px solid ${color}`, borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: `0 4px 10px ${color}20` }),
    socialIcon: { fontSize: '24px' },
    socialText: (color) => ({ color: color, fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' })
  };

  return (
    <div style={styles.container}>
      
      {/* MY PROMOTION CARD */}
      <div className="fade-in" style={styles.promoCard}>
        <div style={styles.promoGlow}></div>
        <h3 style={styles.promoTitle}>💳 My Promotion Card</h3>
        <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '16px' }}>Comparte tu enlace y gana hasta un 20% de las inversiones de tus referidos directos.</p>
        
        <div style={styles.linkBox}>
          <span>{inviteLink}</span>
        </div>
        
        <button style={styles.copyBtn} onClick={handleCopyLink}>
          📋 Copiar Enlace
        </button>
      </div>

      {/* MY TEAM STATS */}
      <h3 style={styles.sectionTitle}>👥 My Team Stats</h3>
      <div className="fade-in" style={styles.statsGrid}>
        <div style={styles.statBox('#00f0ff')}>
          <div style={styles.statLabel}>Total Team</div>
          <div style={styles.statValue('#00f0ff')}>{stats.totalTeam}</div>
          <div style={{ fontSize: '9px', color: '#888' }}>Usuarios Registrados</div>
        </div>
        <div style={styles.statBox('#ffe600')}>
          <div style={styles.statLabel}>Total Inversores</div>
          <div style={styles.statValue('#ffe600')}>{stats.totalInvestors}</div>
          <div style={{ fontSize: '9px', color: '#888' }}>Con Planes Activos</div>
        </div>
      </div>

      {/* TEAM RECHARGE COMMISSION REBATE */}
      <div className="fade-in" style={styles.rebateBox}>
        <div style={{ fontSize: '11px', color: '#ff99dd', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
          Team Recharge Commission Rebate
        </div>
        <div style={{ fontSize: '32px', color: '#ff1493', fontWeight: '900', textShadow: '0 0 15px rgba(255,20,147,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {stats.rechargeCommission.toFixed(2)} <span style={{ fontSize: '16px', color: '#ff99dd' }}>USDT</span>
        </div>
        <button style={{ marginTop: '16px', background: 'transparent', border: '1px solid #ff1493', color: '#ff1493', padding: '8px 24px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>
          Ver Detalles
        </button>
      </div>

      {/* SOCIAL PROMOTION */}
      <h3 style={styles.sectionTitle}>🚀 Social Promotion</h3>
      <div className="fade-in" style={styles.socialGrid}>
        <button style={styles.socialBtn('#00a8ff')} onClick={shareTelegram}>
          <div style={styles.socialIcon}>✈️</div>
          <div style={styles.socialText('#00a8ff')}>Telegram</div>
        </button>
        <button style={styles.socialBtn('#25D366')} onClick={shareWhatsApp}>
          <div style={styles.socialIcon}>💬</div>
          <div style={styles.socialText('#25D366')}>WhatsApp</div>
        </button>
        <button style={styles.socialBtn('#1DA1F2')} onClick={shareTwitter}>
          <div style={styles.socialIcon}>🐦</div>
          <div style={styles.socialText('#1DA1F2')}>Twitter</div>
        </button>
      </div>

    </div>
  );
}
