import React from 'react';
import { s } from '../styles/appStyles';

function MissionsTab({ 
  adsWatchedCount = 0, 
  isAdLoading, 
  handleWatchAd 
}) {
  // Constantes de configuración
  const AD_LIMIT = 50;
  const AD_REWARD = 0.0001;

  // Cálculos de lógica visual
  const safeCount = Number(adsWatchedCount) || 0;
  const todayEarnings = (safeCount * AD_REWARD).toFixed(4);
  const progressPercent = Math.min((safeCount / AD_LIMIT) * 100, 100);

  return (
    <div className="tab-content fade-in" style={{ width: '100%' }}>
      <div style={{ ...s.card, border: '1px solid #28a745', textAlign: 'left' }}>

        {/* CABECERA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, color: '#28a745', fontSize: '18px' }}>🎥 MINERÍA ADS</h4>
          <div style={{ 
            backgroundColor: '#28a745', 
            color: '#fff', 
            fontSize: '10px', 
            padding: '2px 8px', 
            borderRadius: '10px', 
            fontWeight: 'bold' 
          }}>LIVE</div>
        </div>

        <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px', lineHeight: '1.4' }}>
          Mira videos cortos y recibe <b style={{ color: '#fff' }}>{AD_REWARD} TON</b> al instante. 
          ¡Tu red de 3 niveles también gana!
        </p>

        {/* CONTADOR DE GANANCIAS */}
        <div style={{ 
          backgroundColor: 'rgba(40, 167, 69, 0.1)', 
          padding: '15px', 
          borderRadius: '16px', 
          marginBottom: '20px',
          border: '1px solid rgba(40, 167, 69, 0.2)'
        }}>
            <span style={{ fontSize: '11px', color: '#888', fontWeight: '600' }}>GENERADO HOY</span>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#28a745' }}>
              {todayEarnings} <span style={{ fontSize: '14px' }}>TON</span>
            </div>
        </div>

        {/* BARRA DE PROGRESO */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>Progreso diario</span>
            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{safeCount} / {AD_LIMIT}</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#1a1a1a',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              backgroundColor: '#28a745',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* BOTÓN DE ACCIÓN */}
        <div style={{ marginTop: '25px' }}>
          {safeCount >= AD_LIMIT ? (
            <button style={{ ...s.btnOutline, width: '100%', cursor: 'not-allowed' }} disabled>
              ✅ LÍMITE DIARIO COMPLETADO
            </button>
          ) : (
            <button 
              style={{ 
                ...s.btnGreen, 
                width: '100%', 
                opacity: isAdLoading ? 0.7 : 1,
                cursor: isAdLoading ? 'wait' : 'pointer'
              }} 
              onClick={handleWatchAd} 
              disabled={isAdLoading}
            >
              {isAdLoading ? '🔄 CARGANDO ANUNCIO...' : '🎥 VER VIDEO (+0.0001)'}
            </button>
          )}
        </div>

        <p style={{ fontSize: '10px', color: '#444', marginTop: '15px', textAlign: 'center' }}>
          * Los pagos se acreditan automáticamente a tu saldo principal.
        </p>
      </div>
    </div>
  );
}

export default MissionsTab;
