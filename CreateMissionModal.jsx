import { useState } from 'react';
import toast from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles';

export default function CreateMissionModal({ userData, setUserData, onClose }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [totalClicks, setTotalClicks] = useState(10);
  const [rewardPerClick, setRewardPerClick] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalCost = totalClicks * rewardPerClick;

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!title.trim() || !url.trim()) {
      return toast.error("Completa todos los campos");
    }

    if (!url.startsWith("https://t.me/")) {
      return toast.error("El enlace debe comenzar con https://t.me/");
    }

    if ((userData?.points || 0) < totalCost) {
      return toast.error(`Saldo insuficiente. Necesitas ${totalCost} PT.`);
    }

    setLoading(true);
    const tid = toast.loading("Creando misión...");

    try {
      const res = await botApi.createMission({
        userId: userData.id,
        title,
        url,
        totalClicks,
        rewardPerClick,
        totalCost
      });

      if (res.success) {
        toast.success("¡Misión publicada con éxito!", { id: tid });
        setUserData(prev => ({ ...prev, points: prev.points - totalCost }));
        onClose();
      } else {
        toast.error(res.message || "Error al crear la misión", { id: tid });
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado", { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ ...s.card, width: '90%', maxWidth: '400px', backgroundColor: '#112233', border: '1px solid #1a3a5a' }}>
        <h3 style={{ color: '#fff', marginTop: 0 }}>➕ Promocionar mi Bot / Canal</h3>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
          <input
            type="text"
            placeholder="Título de la misión"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #1a3a5a', backgroundColor: '#001122', color: '#fff' }}
          />

          <input
            type="url"
            placeholder="Link de Telegram (https://t.me/...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #1a3a5a', backgroundColor: '#001122', color: '#fff' }}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Cantidad de usuarios</label>
              <input
                type="number"
                min="5"
                value={totalClicks}
                onChange={(e) => setTotalClicks(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #1a3a5a', backgroundColor: '#001122', color: '#fff' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#888' }}>Pago por usuario (PT)</label>
              <input
                type="number"
                min="1"
                value={rewardPerClick}
                onChange={(e) => setRewardPerClick(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #1a3a5a', backgroundColor: '#001122', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ backgroundColor: '#002233', padding: '10px', borderRadius: '8px', textAlign: 'center', marginTop: '10px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>Costo Total:</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#FFD700' }}>🪙 {totalCost} PT</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ ...s.btnOutline, flex: 1, borderColor: '#666', color: '#aaa' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ ...s.btnGreen, flex: 1, backgroundColor: '#FFD700', color: '#000', fontWeight: 'bold' }}>
              {loading ? "Creando..." : "Publicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
