import React from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import { s } from '../styles/appStyles';

export default function TeamView({ userData }) {
  const userId = userData?.id || '8968109534';
  const botUsername = 'ProfitCoreBot'; // Cambia esto por el @usuario real de tu bot sin el @
  const inviteLink = `https://t.me/${botUsername}?start=${userId}`;

  const handleCopyLink = () => {
    try {
      if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred('light');
    } catch (e) {}

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Enlace de invitación copiado', {
        style: { background: '#22D3EE', color: '#06101C', fontWeight: 'bold' }
      });
    }
  };

  return (
    <div className="fade-in">
      <h2 style={{ ...s.h1, marginBottom: '16px' }}>Mi Equipo</h2>

      <div
        style={{
          ...s.card,
          background: 'linear-gradient(135deg, #102033 0%, #0B1322 100%)',
          border: '1px solid #22D3EE',
          textAlign: 'center'
        }}
      >
        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#22D3EE', fontWeight: 'bold' }}>
          COMISIONES POR REFERIDOS
        </p>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '30px', color: '#F8FAFC' }}>
          ${Number(userData?.referral_earnings || 0).toFixed(2)} <span style={{ fontSize: '14px', color: '#94A3B8' }}>USD</span>
        </h2>
        <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
          Gana un bono automático por cada depósito de tus invitados.
        </p>
      </div>

      <div style={s.card}>
        <h3 style={{ ...s.h3, marginBottom: '10px' }}>Tu Enlace de Invitación</h3>
        <div
          style={{
            backgroundColor: '#0B1220',
            border: '1px solid #243247',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '12px',
            color: '#CBD5E1',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            marginBottom: '12px'
          }}
        >
          {inviteLink}
        </div>
        <button
          onClick={handleCopyLink}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
            color: '#06101C',
            border: 'none',
            borderRadius: '999px',
            padding: '13px',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          COPIAR ENLACE DE INVITACIÓN
        </button>
      </div>
    </div>
  );
}
