import { useState } from 'react';
import { s } from '../styles/appStyles';
import toast from 'react-hot-toast';
import botApi from '../api/botApi';

function PublishTab({ userData, setUserData }) {
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [photo, setPhoto] = useState('');
  const [group, setGroup] = useState('Airdrops TON');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!text || !link) {
      return toast.error("El texto y el enlace son obligatorios.");
    }
    if (Number(userData?.balance || 0) < 1) {
      return toast.error("No tienes suficientes PT. Necesitas 1 PT para publicar.");
    }

    // Asignar el ID del grupo según la selección
    const chatId = group === 'Airdrops Cripto' ? "-1003685621367" : "-1004377164928";

    setIsPublishing(true);
    const tid = toast.loading("Enviando al grupo de Telegram...");

    try {
      const res = await botApi.publishPost(userData.id, text, link, photo, chatId);
      
      if (res.success) {
        toast.success(`¡Publicado en ${group} exitosamente! (-1 PT)`, { id: tid });
        setUserData(prev => ({ ...prev, balance: res.balance }));
        setText('');
        setLink('');
        setPhoto('');
      } else {
        toast.error(res.error || "Error al publicar el mensaje.", { id: tid });
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor.", { id: tid });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="tab-content fade-in" style={{ paddingBottom: '130px' }}>
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <span style={{ fontSize: '20px' }}>📢</span>
          <h4 style={{ margin: 0, color: '#0088cc', fontSize: '14px', letterSpacing: '1px' }}>
            PUBLICAR EN GRUPOS
          </h4>
        </div>
        
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
          Promociona tus enlaces. Costo por publicación: <b style={{color: '#ffcc00'}}>1 PT</b>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select 
            value={group} 
            onChange={(e) => setGroup(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333' }}
          >
            <option value="Airdrops TON">Grupo: Airdrops Crypto</option>
            <option value="Airdrops Crypto">Grupo: Airdrops TON</option>
          </select>

          <textarea 
            placeholder="Texto descriptivo (Obligatorio)" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', minHeight: '80px', resize: 'none' }}
          />

          <input 
            type="url" 
            placeholder="Enlace de tu proyecto (Obligatorio)" 
            value={link}
            onChange={(e) => setLink(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333' }}
          />

          <input 
            type="url" 
            placeholder="Enlace de imagen (Opcional)" 
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333' }}
          />

          <button 
            style={{ ...s.btnGreen, marginTop: '10px', backgroundColor: Number(userData?.balance || 0) >= 1 ? '#0088cc' : '#555' }}
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? 'PUBLICANDO...' : 'PUBLICAR AHORA (-1 PT)'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PublishTab;
