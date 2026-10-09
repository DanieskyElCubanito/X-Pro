import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { botApi } from '../api/botApi';

const neon = {
  card: {
    background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.85), rgba(20, 8, 38, 0.95))',
    border: '2px solid #00f0ff',
    borderRadius: '24px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 8px 24px rgba(0, 240, 255, 0.15)'
  },
  btnPrimary: {
    width: '100%', padding: '14px', background: 'linear-gradient(180deg, #ff66cc 0%, #ff1493 50%, #d80073 100%)',
    color: '#ffffff', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '14px',
    cursor: 'pointer', boxShadow: '0 6px 0 #8b004b, 0 10px 20px rgba(255, 20, 147, 0.4)'
  },
  btnOutline: {
    width: '100%', padding: '14px', background: 'rgba(0, 240, 255, 0.1)',
    color: '#00f0ff', border: '2px solid #00f0ff', borderRadius: '16px', fontWeight: '900', fontSize: '14px',
    cursor: 'pointer', boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)'
  },
  statBox: {
    background: 'rgba(15, 5, 28, 0.8)',
    border: '1px solid #8a2be2',
    borderRadius: '16px',
    padding: '14px 10px',
    textAlign: 'center',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
  },
  totalCard: {
    background: 'linear-gradient(90deg, #ff1493 0%, #8a2be2 100%)',
    padding: '18px 20px',
    borderRadius: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 6px 20px rgba(255, 20, 147, 0.35)',
    border: '2px solid rgba(255,255,255,0.2)'
  },
  refItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#120822', padding: '12px 14px', borderRadius: '14px',
    border: '1px solid #3d1b63'
  }
};

function ShareTab({ stats, handleShare, userId, totalReferralEarnings }) {
  const [referralsList, setReferralsList] = useState(stats?.referralsList || []);
  const [earnings, setEarnings] = useState(totalReferralEarnings || stats?.c1 || 0);
  const [loading, setLoading] = useState(false);

  // Recarga los referidos automáticamente al entrar a la pestaña
  useEffect(() => {
    if (userId) fetchReferrals();
  }, [userId]);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const data = await botApi.getReferrals(userId);
      if (data && data.success) {
        setReferralsList(data.referrals || []);
        setEarnings(data.earnings || 0);
      }
    } catch (error) {
      console.error("Error al actualizar la lista.");
    } finally {
      setLoading(false);
    }
  };

  const n1 = referralsList.length;
  const totalEarned = parseFloat(earnings).toFixed(4);

  const handleCopy = () => {
    if (!userId) return toast.error("Error: ID no encontrado.");
    const link = `https://t.me/ReffRobot/app?startapp=${userId}`;
    navigator.clipboard.writeText(link)
      .then(() => toast.success("¡Enlace copiado al portapapeles!"))
      .catch(() => toast.error("Error al copiar el enlace"));
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '20px' }}>
      
      {/* TARJETA INVITACIÓN */}
      <div style={neon.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <h4 style={{ margin: 0, color: '#00f0ff', fontSize: '16px', fontWeight: '900', letterSpacing: '1px' }}>
            SISTEMA DE AFILIADOS
          </h4>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
          <div style={{ ...neon.statBox, flex: 1 }}>
            <div style={{ color: '#ff99dd', fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px', marginBottom: '4px' }}>TUS INVITADOS</div>
            <div style={{ color: '#ffe600', fontSize: '22px', fontWeight: '900' }}>{n1}</div>
          </div>
          <button onClick={fetchReferrals} style={{ ...neon.statBox, background: '#2b0b47', border: '1px solid #ff41b4', padding: '10px', cursor: 'pointer' }}>
            <div style={{ fontSize: '18px', animation: loading ? 'spin 1s linear infinite' : 'none' }}>🔄</div>
            <div style={{ color: '#fff', fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>ACTUALIZAR</div>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ ...neon.btnPrimary, flex: 1 }} onClick={handleShare}>
            🚀 INVITAR
          </button>
          <button style={{ ...neon.btnOutline, flex: 1 }} onClick={handleCopy}>
            📋 COPIAR
          </button>
        </div>
      </div>

      {/* TARJETA DE ESTADÍSTICAS */}
      <div style={{ ...neon.card, borderColor: '#8a2be2' }}>
        <div style={neon.totalCard}>
          <div>
            <p style={{ fontSize: '11px', color: '#ff99dd', margin: '0 0 4px 0', fontWeight: '900' }}>GANANCIAS TOTALES</p>
            <p style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', margin: 0 }}>
              {totalEarned} <span style={{ fontSize: '14px', color: '#ffe600' }}>PT</span>
            </p>
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '14px', fontSize: '20px' }}>
            💎
          </div>
        </div>
      </div>

      {/* LISTA DE AFILIADOS DETALLADA */}
      <div style={{ ...neon.card, borderColor: '#ff41b4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ color: '#00f0ff', fontSize: '15px', margin: 0, fontWeight: '900' }}>
            👥 Tu Red ({n1})
          </h4>
          <span style={{ fontSize: '11px', color: '#ff99dd', fontWeight: 'bold' }}>ID / Estado</span>
        </div>

        {loading && n1 === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#00f0ff', fontSize: '13px', fontWeight: 'bold' }}>Sincronizando red...</div>
        ) : n1 === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#888', fontSize: '13px', lineHeight: '1.5' }}>
            Aún no tienes afiliados registrados.<br/>¡Comparte tu enlace para comenzar!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
            {referralsList.map((ref, idx) => (
              <div key={ref.id || idx} style={neon.refItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '24px', height: '24px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid #00f0ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f0ff', fontSize: '10px', fontWeight: 'bold' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>{ref.username || 'Usuario'}</div>
                    <div style={{ color: '#888', fontSize: '10px', fontFamily: 'monospace' }}>ID: {ref.id}</div>
                  </div>
                </div>
                
                {/* SI PASÓ EL CAPTCHA SE PAGA, SINO ESTÁ EN ESPERA */}
                {ref.referral_reward_granted ? (
                  <span style={{ color: '#00ffaa', fontSize: '12px', fontWeight: '900', background: 'rgba(0, 255, 170, 0.1)', padding: '4px 8px', borderRadius: '8px', border: '1px solid #00ffaa' }}>
                    +1.0 PT
                  </span>
                ) : (
                  <span style={{ color: '#ffe600', fontSize: '10px', fontWeight: '900', background: 'rgba(255, 230, 0, 0.1)', padding: '4px 8px', borderRadius: '8px', border: '1px dashed #ffe600' }}>
                    PENDIENTE
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#aaa', marginTop: '16px', lineHeight: '1.4' }}>
          *El saldo se libera cuando tu afiliado se une a los canales y completa la verificación humana.
        </p>
      </div>
    </div>
  );
}

export default ShareTab;
