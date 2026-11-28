import React, { useState, useEffect, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import { s } from '../styles/appStyles';
import { botApi } from '../api/botApi';

const LEVEL_CONFIG = [
  { level: 1, tag: 'L1', commission: 50, color: '#22D3EE', badgeBg: '#0284C7' },
  { level: 2, tag: 'L2', commission: 30, color: '#38BDF8', badgeBg: '#0369A1' },
  { level: 3, tag: 'L3', commission: 10, color: '#34D399', badgeBg: '#047857' },
  { level: 4, tag: 'L4', commission: 5, color: '#FBBF24', badgeBg: '#B45309' },
  { level: 5, tag: 'L5', commission: 5, color: '#C084FC', badgeBg: '#7E22CE' }
];

const IconShare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const normalizeTeamRows = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.members)) return raw.members;
  if (Array.isArray(raw?.team)) return raw.team;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

export default function TeamTab({ userData }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'invested' | 'uninvested'
  const [teamRows, setTeamRows] = useState(() => normalizeTeamRows(userData?.team));
  const [loadingTeam, setLoadingTeam] = useState(false);

  const userId = userData?.id || userData?.telegram_id || '';
  const botUsername = WebApp.initDataUnsafe?.bot_username || 'ProfitCoreBot';
  const inviteLink = userId
    ? `https://t.me/${botUsername}?start=${userId}`
    : `https://t.me/${botUsername}`;

  useEffect(() => {
    let mounted = true;

    async function fetchRealTeam() {
      if (!userId) return;
      setLoadingTeam(true);
      try {
        const res = await botApi.getTeamStats(userId);
        if (!mounted) return;
        const rows = normalizeTeamRows(res);
        setTeamRows(rows);
      } catch (e) {
        if (mounted && Array.isArray(userData?.team)) {
          setTeamRows(normalizeTeamRows(userData.team));
        }
      } finally {
        if (mounted) setLoadingTeam(false);
      }
    }

    fetchRealTeam();
    return () => {
      mounted = false;
    };
  }, [userId, userData?.team]);

  const statsByLevel = useMemo(() => {
    const map = {};

    LEVEL_CONFIG.forEach((cfg) => {
      const membersInLevel = teamRows
        .filter((row) => Number(row.lvl ?? row.level) === cfg.level)
        .map((row, idx) => {
          const invested = Number(
            row.active_investments ?? row.invested ?? row.total_invested ?? 0
          );
          const isActive =
            typeof row.active === 'boolean' ? row.active : invested > 0;
          const handle = row.username
            ? row.username.startsWith('@')
              ? row.username
              : `@${row.username}`
            : row.first_name || `ID ${row.telegram_id || row.id || idx + 1}`;
          const avatar =
            row.photo_url ||
            row.avatar ||
            `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
              String(row.telegram_id || row.id || handle)
            )}`;
          const bonus =
            row.bonus_earned !== undefined
              ? Number(row.bonus_earned)
              : (invested * cfg.commission) / 100;

          return {
            id: row.telegram_id || row.id || `${cfg.level}-${idx}`,
            handle,
            invested,
            active: isActive,
            avatar,
            bonus
          };
        });

      const totalInvested = membersInLevel.reduce((acc, m) => acc + m.invested, 0);
      const myEarnings =
        teamRows.length > 0
          ? membersInLevel.reduce((acc, m) => acc + m.bonus, 0)
          : Number(userData?.[`level_${cfg.level}_earnings`] ?? 0);

      map[cfg.level] = {
        totalCount: membersInLevel.length,
        activeCount: membersInLevel.filter((m) => m.active && m.invested > 0).length,
        earned: myEarnings,
        totalInvested,
        myEarnings,
        members: membersInLevel
      };
    });

    return map;
  }, [teamRows, userData]);

  const totalEarned = useMemo(() => {
    if (userData?.referral_earnings !== undefined && userData?.referral_earnings !== null) {
      return Number(userData.referral_earnings);
    }
    return Object.values(statsByLevel).reduce((sum, lvl) => sum + Number(lvl.myEarnings || 0), 0);
  }, [userData?.referral_earnings, statsByLevel]);

  const safeHaptic = (style = 'light') => {
    try {
      if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred(style);
    } catch (e) {}
  };

  const handleCopy = () => {
    safeHaptic('light');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(inviteLink);
    }
    toast.success('Enlace copiado', {
      style: { background: '#22D3EE', color: '#06101C', fontWeight: 'bold' }
    });
  };

  const handleShare = () => {
    safeHaptic('medium');
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('¡Únete y gana recompensas diarias!')}`;
    try {
      WebApp.openTelegramLink(shareUrl);
    } catch (e) {
      window.open(shareUrl, '_blank');
    }
  };

  // --- VISTA DETALLE DE NIVEL ---
  if (selectedLevel !== null) {
    const cfg = LEVEL_CONFIG.find((item) => item.level === selectedLevel) || LEVEL_CONFIG[0];
    const levelData = statsByLevel[cfg.level] || {
      totalCount: 0,
      activeCount: 0,
      earned: 0,
      totalInvested: 0,
      myEarnings: 0,
      members: []
    };

    const allMembers = levelData.members;
    const investedMembers = allMembers.filter((m) => m.active && m.invested > 0);
    const uninvestedMembers = allMembers.filter((m) => !m.active || m.invested <= 0);

    const visibleMembers =
      filterMode === 'invested'
        ? investedMembers
        : filterMode === 'uninvested'
        ? uninvestedMembers
        : allMembers;

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              safeHaptic('light');
              setSelectedLevel(null);
              setFilterMode('all');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            ← Atrás
          </button>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#F8FAFC' }}>Mi Equipo</h2>
        </div>

        {/* Selector de niveles L1 - L5 */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {LEVEL_CONFIG.map((item) => {
            const isActiveTab = item.level === cfg.level;
            const count = statsByLevel[item.level]?.totalCount ?? 0;
            return (
              <button
                type="button"
                key={item.level}
                onClick={() => {
                  safeHaptic('light');
                  setSelectedLevel(item.level);
                }}
                style={{
                  backgroundColor: isActiveTab ? '#0891B2' : '#111C2E',
                  color: isActiveTab ? '#FFFFFF' : '#CBD5E1',
                  border: isActiveTab ? '1px solid #22D3EE' : '1px solid #1E293B',
                  borderRadius: '999px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {isActiveTab ? `Nivel ${item.level} (${item.tag}) (${count})` : item.tag}
              </button>
            );
          })}
        </div>

        {/* Resumen del nivel */}
        <div
          style={{
            background: 'linear-gradient(180deg, #102033 0%, #0B1322 100%)',
            border: '1px solid #1E324A',
            borderRadius: '16px',
            padding: '14px 16px'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0', marginBottom: '4px' }}>
            Total Inversión {cfg.tag}:{' '}
            <span style={{ fontWeight: '800', color: '#FFFFFF' }}>
              ${levelData.totalInvested.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#22D3EE' }}>
            Tus Ganancias {cfg.tag}:{' '}
            <span style={{ fontWeight: '800' }}>
              ${levelData.myEarnings.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto' }}>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            style={{
              backgroundColor: filterMode === 'all' ? '#1E293B' : 'transparent',
              color: filterMode === 'all' ? '#F8FAFC' : '#94A3B8',
              border: filterMode === 'all' ? '1px solid #334155' : '1px solid transparent',
              borderRadius: '999px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Todos ({allMembers.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('invested')}
            style={{
              backgroundColor: filterMode === 'invested' ? '#0891B2' : '#111C2E',
              color: filterMode === 'invested' ? '#FFFFFF' : '#22D3EE',
              border: '1px solid #0E7490',
              borderRadius: '999px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Con Inversión ({investedMembers.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('uninvested')}
            style={{
              backgroundColor: filterMode === 'uninvested' ? '#1E293B' : '#111C2E',
              color: '#CBD5E1',
              border: '1px solid #1E293B',
              borderRadius: '999px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Sin Inversión ({uninvestedMembers.length})
          </button>
        </div>

        {/* Lista de referidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loadingTeam ? (
            <div style={{ ...s.card, textAlign: 'center', padding: '20px' }}>
              <p style={{ ...s.textMuted, margin: 0 }}>Cargando referidos...</p>
            </div>
          ) : visibleMembers.length === 0 ? (
            <div style={{ ...s.card, textAlign: 'center', padding: '20px' }}>
              <p style={{ ...s.textMuted, margin: 0 }}>No hay referidos en este filtro.</p>
            </div>
          ) : (
            visibleMembers.map((member) => {
              const bonusAmount = Number(member.bonus ?? (member.invested * cfg.commission) / 100);
              return (
                <div
                  key={member.id}
                  style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <img
                    src={member.avatar}
                    alt={member.handle}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #22D3EE',
                      flexShrink: 0
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.handle}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          backgroundColor: member.active ? 'rgba(34, 197, 94, 0.16)' : 'rgba(148, 163, 184, 0.14)',
                          color: member.active ? '#22C55E' : '#CBD5E1',
                          border: member.active ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(148, 163, 184, 0.25)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {member.active ? 'Activo' : 'Sin inversión'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: '600' }}>
                      Invertido: ${member.invested.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: member.active && bonusAmount > 0 ? '#22D3EE' : '#CBD5E1'
                      }}
                    >
                      {member.active && bonusAmount > 0
                        ? `+${cfg.commission}% Bono: +$${bonusAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                        : 'Gano: $0,00 USD'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // --- VISTA GENERAL DE MI EQUIPO (Sin botón Atrás) ---
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#F8FAFC' }}>Mi Equipo</h2>
      </div>

      {/* Total Ganado por Referidos */}
      <div
        style={{
          background: 'linear-gradient(180deg, #102033 0%, #0B1322 100%)',
          border: '1px solid #1E324A',
          borderRadius: '18px',
          padding: '16px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: '600', marginBottom: '4px' }}>
          Total Ganado por Referidos
        </div>
        <div style={{ fontSize: '32px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
          ${Number(totalEarned).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#CBD5E1' }}>USD</span>
        </div>
      </div>

      {/* Enlace de Invitación */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', marginBottom: '8px' }}>
          Enlace de Invitación
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              flex: 1,
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '12px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              minWidth: 0
            }}
          >
            <span
              style={{
                fontSize: '13px',
                color: '#94A3B8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {inviteLink}
            </span>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                backgroundColor: '#06B6D4',
                color: '#06101C',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Copiar
            </button>
          </div>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Compartir enlace"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#111C2E',
              border: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <IconShare />
          </button>
        </div>
      </div>

      {/* 5 Niveles de Referidos */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '18px',
          padding: '14px'
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: '800',
            color: '#E2E8F0',
            letterSpacing: '0.4px',
            marginBottom: '12px'
          }}
        >
          5 NIVELES DE REFERIDOS
        </div>

        {/* Fila 1: L1, L2, L3 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
          {LEVEL_CONFIG.slice(0, 3).map((item) => {
            const info = statsByLevel[item.level];
            return (
              <div
                key={item.level}
                onClick={() => {
                  safeHaptic('medium');
                  setSelectedLevel(item.level);
                }}
                style={{
                  backgroundColor: '#111C2E',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <span
                    style={{
                      backgroundColor: item.badgeBg,
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 5px',
                      borderRadius: '5px'
                    }}
                  >
                    {item.tag}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: item.color }}>
                    {item.commission}%
                  </span>
                </div>

                <div style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.1' }}>
                  {info.totalCount}
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', marginBottom: '4px' }}>
                  Referidos ({info.activeCount} activos)
                </div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8' }}>
                  ${info.earned.toFixed(2)} USD
                </div>
              </div>
            );
          })}
        </div>

        {/* Fila 2: L4, L5 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {LEVEL_CONFIG.slice(3, 5).map((item) => {
            const info = statsByLevel[item.level];
            return (
              <div
                key={item.level}
                onClick={() => {
                  safeHaptic('medium');
                  setSelectedLevel(item.level);
                }}
                style={{
                  backgroundColor: '#111C2E',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <span
                    style={{
                      backgroundColor: item.badgeBg,
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 5px',
                      borderRadius: '5px'
                    }}
                  >
                    {item.tag}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: item.color }}>
                    {item.commission}%
                  </span>
                </div>

                <div style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.1' }}>
                  {info.totalCount}
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', marginBottom: '4px' }}>
                  Referidos ({info.activeCount} activos)
                </div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8' }}>
                  ${info.earned.toFixed(2)} USD
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
