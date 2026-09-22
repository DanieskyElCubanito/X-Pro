import { useState } from 'react';
import { s } from '../styles/appStyles';
import toast from 'react-hot-toast';

function PublishTab({ userData, setUserData }) {
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [photo, setPhoto] = useState('');
  const [group, setGroup] = useState('Reff Free');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = () => {
    if (!text || !link) {
      toast.error("El texto y el enlace son obligatorios.");
      return;
    }
    if (userData?.points < 1) {
      toast.error("No tienes suficientes PT. Necesitas 1 PT para publicar.");
      return;
    }

    setIsPublishing(true);
    // Aquí conectaremos la lógica de Supabase/Bot en el próximo paso
    setTimeout(() => {
      toast.success(`¡Publicado en ${group} exitosamente! (-1 PT)`);
      setUserData(prev => ({ ...prev, points: prev.points - 1 }));
      setText('');
      setLink('');
      setPhoto('');
      setIsPublishing(false);
    }, 1500);
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
            <option value="Reff Free">Grupo: Reff Free</option>
            <option value="Reff 360">Grupo: Reff 360</option>
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
            style={{ ...s.btnGreen, marginTop: '10px', backgroundColor: userData?.points >= 1 ? '#0088cc' : '#555' }}
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


