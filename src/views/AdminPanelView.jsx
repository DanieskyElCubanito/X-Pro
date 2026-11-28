import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callRpc(fnName, params = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en Vercel');
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Error en ${fnName}`);
  }
  return data;
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#0B1220',
  border: '1px solid #243247',
  borderRadius: '12px',
  padding: '11px 12px',
  color: '#F8FAFC',
  fontSize: '13px',
  outline: 'none'
};

export default function AdminPanelView() {
  const [isAuth, setIsAuth] = useState(false);
  const [loginPass, setLoginPass] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [section, setSection] = useState('deposits'); // 'deposits' | 'withdrawals' | 'security'

  // Estado de Depósitos
  const [tgId, setTgId] = useState('');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('USDT (BEP-20)');
  const [txHash, setTxHash] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  // Estado de Retiros
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  // Estado de Cambio de Contraseña
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const loadWithdrawals = useCallback(async () => {
    setLoadingWithdrawals(true);
    try {
      const list = await callRpc('admin_get_withdrawals');
      setWithdrawals(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err.message || 'No se pudieron cargar los retiros');
    } finally {
      setLoadingWithdrawals(false);
    }
  }, []);

  useEffect(() => {
    if (isAuth && section === 'withdrawals') {
      loadWithdrawals();
    }
  }, [isAuth, section, loadWithdrawals]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginPass.trim()) {
      return toast.error('Ingresa la contraseña');
    }
    setLoggingIn(true);
    try {
      const res = await callRpc('admin_login', { p_password: loginPass.trim() });
      if (res?.success) {
        setIsAuth(true);
        setLoginPass('');
        toast.success('Bienvenido al Panel de Administración', {
          style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
        });
      } else {
        toast.error(res?.error || 'Contraseña incorrecta');
      }
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleCreditDeposit = async (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!tgId.trim() || !numericAmount || numericAmount < 1) {
      return toast.error('Ingresa un Telegram ID válido y monto mínimo de $1 USD');
    }
    setSubmittingDeposit(true);
    try {
      await callRpc('admin_credit_deposit', {
        p_telegram_id: Number(tgId.trim()),
        p_amount: numericAmount,
        p_network: network,
        p_tx_hash: txHash.trim()
      });
      toast.success(`Depósito de $${numericAmount.toFixed(2)} USD acreditado`, {
        style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
      });
      setTgId('');
      setAmount('');
      setTxHash('');
    } catch (err) {
      toast.error(err.message || 'No se pudo acreditar el depósito');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleResolveWithdraw = async (txId, approve) => {
    setResolvingId(txId);
    try {
      await callRpc('admin_resolve_withdraw', {
        p_tx_id: Number(txId),
        p_approve: Boolean(approve)
      });
      toast.success(approve ? 'Retiro aprobado' : 'Retiro rechazado y saldo devuelto', {
        style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
      });
      await loadWithdrawals();
    } catch (err) {
      toast.error(err.message || 'No se pudo procesar el retiro');
    } finally {
      setResolvingId(null);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPass.trim() || !newPass.trim()) {
      return toast.error('Completa ambos campos de contraseña');
    }
    setSavingPass(true);
    try {
      const res = await callRpc('admin_change_password', {
        p_current_password: currentPass.trim(),
        p_new_password: newPass.trim()
      });
      if (res?.success) {
        toast.success('Contraseña actualizada correctamente', {
          style: { background: '#111C2E', color: '#22D3EE', border: '1px solid #22D3EE' }
        });
        setCurrentPass('');
        setNewPass('');
      } else {
        toast.error(res?.error || 'No se pudo cambiar la contraseña');
      }
    } catch (err) {
      toast.error(err.message || 'Error al actualizar contraseña');
    } finally {
      setSavingPass(false);
    }
  };

  if (!isAuth) {
    return (
      <form
        onSubmit={handleLogin}
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '18px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#F8FAFC' }}>
          Panel de Administración
        </h2>
        <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
          Ingresa tu clave de acceso para gestionar depósitos, retiros y seguridad.
        </p>

        <input
          type="password"
          placeholder="Contraseña de administrador"
          value={loginPass}
          onChange={(e) => setLoginPass(e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loggingIn}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
            color: '#06101C',
            border: 'none',
            borderRadius: '999px',
            padding: '13px',
            fontSize: '14px',
            fontWeight: '800',
            cursor: 'pointer'
          }}
        >
          {loggingIn ? 'Verificando...' : 'Entrar al Panel'}
        </button>
      </form>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#F8FAFC' }}>
          Panel Admin
        </h2>
        <button
          type="button"
          onClick={() => setIsAuth(false)}
          style={{
            backgroundColor: '#111C2E',
            color: '#94A3B8',
            border: '1px solid #1E293B',
            borderRadius: '999px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Salir
        </button>
      </div>

      {/* Pestañas internas del Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        <button
          type="button"
          onClick={() => setSection('deposits')}
          style={{
            backgroundColor: section === 'deposits' ? '#0891B2' : '#111C2E',
            color: section === 'deposits' ? '#FFFFFF' : '#CBD5E1',
            border: section === 'deposits' ? '1px solid #22D3EE' : '1px solid #1E293B',
            borderRadius: '10px',
            padding: '9px 6px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer'
          }}
        >
          Depósitos
        </button>

        <button
          type="button"
          onClick={() => setSection('withdrawals')}
          style={{
            backgroundColor: section === 'withdrawals' ? '#0891B2' : '#111C2E',
            color: section === 'withdrawals' ? '#FFFFFF' : '#CBD5E1',
            border: section === 'withdrawals' ? '1px solid #22D3EE' : '1px solid #1E293B',
            borderRadius: '10px',
            padding: '9px 6px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer'
          }}
        >
          Retiros
        </button>

        <button
          type="button"
          onClick={() => setSection('security')}
          style={{
            backgroundColor: section === 'security' ? '#0891B2' : '#111C2E',
            color: section === 'security' ? '#FFFFFF' : '#CBD5E1',
            border: section === 'security' ? '1px solid #22D3EE' : '1px solid #1E293B',
            borderRadius: '10px',
            padding: '9px 6px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer'
          }}
        >
          Clave
        </button>
      </div>

      {/* SECCIÓN 1: ACREDITAR DEPÓSITOS */}
      {section === 'deposits' && (
        <form
          onSubmit={handleCreditDeposit}
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#22D3EE' }}>
            Acreditar Depósito (Plan 5% diario x 40 días)
          </div>

          <input
            type="text"
            placeholder="Telegram ID del usuario"
            value={tgId}
            onChange={(e) => setTgId(e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            step="0.01"
            min="1"
            placeholder="Monto en USD (Mín. $1)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />

          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            style={inputStyle}
          >
            <option value="USDT (BEP-20)">USDT (BEP-20)</option>
            <option value="GRAM / TON">GRAM / TON</option>
          </select>

          <input
            type="text"
            placeholder="Hash / TxID (opcional)"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={submittingDeposit}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
              color: '#06101C',
              border: 'none',
              borderRadius: '999px',
              padding: '13px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            {submittingDeposit ? 'Acreditando...' : 'Acreditar Depósito'}
          </button>
        </form>
      )}

      {/* SECCIÓN 2: RETIROS */}
      {section === 'withdrawals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#22D3EE' }}>
              Solicitudes de Retiro
            </span>
            <button
              type="button"
              onClick={loadWithdrawals}
              style={{
                backgroundColor: '#111C2E',
                color: '#CBD5E1',
                border: '1px solid #1E293B',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Actualizar
            </button>
          </div>

          {loadingWithdrawals ? (
            <div style={{ backgroundColor: '#0F172A', borderRadius: '14px', padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
              Cargando retiros...
            </div>
          ) : withdrawals.length === 0 ? (
            <div style={{ backgroundColor: '#0F172A', borderRadius: '14px', padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
              No hay retiros registrados.
            </div>
          ) : (
            withdrawals.map((w) => (
              <div
                key={w.id}
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#F8FAFC' }}>
                    ID {w.telegram_id} {w.username ? `(@${w.username})` : ''}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#22D3EE' }}>
                    ${Number(w.amount || 0).toFixed(2)} USD
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: '#CBD5E1' }}>
                  Red: <strong>{w.network || 'N/A'}</strong> • Estado: <strong>{w.status}</strong>
                </div>

                <div style={{ fontSize: '11px', color: '#94A3B8', wordBreak: 'break-all' }}>
                  Wallet: {w.wallet_address}
                </div>

                {w.status === 'pending' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      disabled={resolvingId === w.id}
                      onClick={() => handleResolveWithdraw(w.id, true)}
                      style={{
                        backgroundColor: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      Aprobar
                    </button>

                    <button
                      type="button"
                      disabled={resolvingId === w.id}
                      onClick={() => handleResolveWithdraw(w.id, false)}
                      style={{
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* SECCIÓN 3: CAMBIAR CONTRASEÑA */}
      {section === 'security' && (
        <form
          onSubmit={handleChangePassword}
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#22D3EE' }}>
            Cambiar Contraseña del Panel
          </div>

          <input
            type="password"
            placeholder="Contraseña actual"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Nueva contraseña (mín. 4 caracteres)"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={savingPass}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
              color: '#06101C',
              border: 'none',
              borderRadius: '999px',
              padding: '13px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            {savingPass ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      )}
    </div>
  );
}
