import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const darkStyles = {
  container: {
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    paddingBottom: '20px'
  },
  title: {
    fontSize: '22px',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    margin: '10px 0 16px 0',
    color: '#ffffff'
  },
  card: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
  },
  cardInteractive: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '16px',
    padding: '14px 16px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease'
  },
  btnPrimary: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#00ccff',
    color: '#000000',
    border: 'none',
    borderRadius: '14px',
    fontWeight: '800',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 204, 255, 0.25)'
  },
  btnDark: {
    padding: '10px 16px',
    backgroundColor: '#00ccff',
    color: '#000000',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '800',
    cursor: 'pointer'
  },
  btnLight: {
    padding: '10px 16px',
    backgroundColor: '#262626',
    color: '#888888',
    border: '1px solid #3a3a3a',
    borderRadius: '12px',
    fontWeight: '800',
    cursor: 'pointer'
  },
  input: {
    width: '100%',
    backgroundColor: '#121212',
    border: '1px solid #333333',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '14px',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  progressBarContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    margin: '10px 0 20px 0'
  },
  progressStep: (active) => ({
    width: '45px',
    height: '6px',
    backgroundColor: active ? '#00ccff' : '#262626',
    borderRadius: '10px',
    transition: 'all 0.2s ease'
  })
};

const TEMPLATES = [
  {
    title: 'Airdrop Update',
    icon: '🚀',
    text: '🚀 Nuevo Airdrop confirmado. Participa gratis completando las tareas y asegura tus tokens.'
  },
  {
    title: 'Big Giveaway',
    icon: '🎁',
    text: '🎁 Gran sorteo activo para la comunidad. Entra al enlace y gana recompensas exclusivas.'
  },
  {
    title: 'Bot de Referidos',
    icon: '👥',
    text: '💎 Gana saldo en Telegram todos los días. Prueba la Mini App oficial y comparte tu enlace.'
  }
];

const AVAILABLE_GROUPS = [
  { id: "-1003685621367", name: "@AirdropsCriptoES", members: "10.6K miembros" },
  { id: "-1004377164928", name: "@TONAirdropsES", members: "25.4K miembros" }
];

export default function PublishTab({ userData, setUserData }) {
  const [activeTab, setActiveTab] = useState('create');
  const [step, setStep] = useState(1);

  const [postText, setPostText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [buttonConfig, setButtonConfig] = useState({ text: 'Abrir', url: '', color: 'neutral' });
  const [selectedGroups, setSelectedGroups] = useState([]);

  const [showButtonModal, setShowButtonModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const balance = Number(userData?.balance || 0);
  const totalCost = selectedGroups.length * 1;

  const handleToggleGroup = (groupId) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter((id) => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const handleNextStep1 = () => {
    if (!postText.trim()) return toast.error("Escribe un mensaje para continuar.");
    setStep(2);
  };

  const handleNextStep2 = () => setStep(3);

  const handleNextStep3 = () => {
    if (selectedGroups.length === 0) return toast.error("Selecciona al menos un grupo.");
    if (balance < totalCost) {
      return toast.error(`Saldo insuficiente. Necesitas ${totalCost} PT y tienes ${balance} PT.`);
    }
    setStep(4);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const tid = toast.loading("Publicando en los grupos seleccionados...");

    try {
      const finalLink = buttonConfig.url || linkUrl || 'https://t.me/ReffRobot/app';

      for (const chatId of selectedGroups) {
        const response = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'publish-post',
            userId: userData?.id,
            chatId: chatId,
            text: postText,
            link: finalLink,
            photoUrl: imageUrl || null
          })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Error al publicar.");

        if (data.balance !== undefined) {
          setUserData((prev) => ({ ...prev, balance: data.balance }));
        }
      }

      toast.success("¡Publicado con éxito!", { id: tid });
      setPostText('');
      setImageUrl('');
      setLinkUrl('');
      setSelectedGroups([]);
      setStep(1);
    } catch (err) {
      toast.error(err.message || "Error al procesar la publicación", { id: tid });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={darkStyles.container}>
      <Toaster position="top-center" />
      <h2 style={darkStyles.title}>PUBLICAR</h2>

      {/* Selector superior: Crear post / Mis posts */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        <button 
          onClick={() => setActiveTab('create')} 
          style={activeTab === 'create' ? { ...darkStyles.btnDark, flex: 1 } : { ...darkStyles.btnLight, flex: 1 }}
        >
          🚀 Crear post
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          style={activeTab === 'history' ? { ...darkStyles.btnDark, flex: 1 } : { ...darkStyles.btnLight, flex: 1 }}
        >
          📋 Mis posts
        </button>
      </div>

      {activeTab === 'create' && (
        <>
          <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#888888', letterSpacing: '0.5px' }}>
            PASO {step} DE 4
          </div>
          <div style={darkStyles.progressBarContainer}>
            <div style={darkStyles.progressStep(step >= 1)} />
            <div style={darkStyles.progressStep(step >= 2)} />
            <div style={darkStyles.progressStep(step >= 3)} />
            <div style={darkStyles.progressStep(step >= 4)} />
          </div>

          {/* ================= PASO 1: TEXTO & PLANTILLAS ================= */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '10px', color: '#fff' }}>
                ¿Qué quieres compartir?
              </h3>
              <div style={darkStyles.card}>
                <textarea
                  style={{ ...darkStyles.input, height: '110px', resize: 'none', border: 'none', padding: 0 }}
                  placeholder="Escribe tu mensaje o anuncio aquí..."
                  maxLength={500}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#666666', marginTop: '6px' }}>
                  {postText.length} / 500
                </div>
                <button onClick={handleNextStep1} style={{ ...darkStyles.btnPrimary, marginTop: '12px' }}>
                  Continuar &gt;
                </button>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '800', color: '#888888', marginBottom: '10px', textTransform: 'uppercase' }}>
                Plantillas rápidas
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {TEMPLATES.map((tmpl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPostText(tmpl.text)}
                    style={{ ...darkStyles.card, padding: '12px', cursor: 'pointer', marginBottom: 0 }}
                  >
                    <div style={{ fontSize: '22px', marginBottom: '4px' }}>{tmpl.icon}</div>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#ffffff' }}>{tmpl.title}</div>
                    <div style={{ fontSize: '11px', color: '#777777', marginTop: '4px', lineHeight: '1.3' }}>
                      {tmpl.text.slice(0, 42)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PASO 2: EXTRAS (IMAGEN Y BOTÓN) ================= */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <button onClick={() => setStep(1)} style={{ ...darkStyles.btnLight, padding: '6px 12px' }}>&lt;</button>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#fff' }}>¿Le añades algo?</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#888888', marginBottom: '14px' }}>
                Opcional. Una imagen y un botón interactivo captan más vistas.
              </p>

              <div onClick={() => setShowImageModal(true)} style={darkStyles.cardInteractive}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '24px' }}>🖼️</div>
                  <div>
                    <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '14px' }}>Imagen</div>
                    <div style={{ fontSize: '12px', color: imageUrl ? '#00ccff' : '#777777' }}>
                      {imageUrl ? 'Imagen adjuntada ✓' : 'Añade una URL pública'}
                    </div>
                  </div>
                </div>
                <div style={{ color: '#888', fontWeight: 'bold' }}>&gt;</div>
              </div>

              <div onClick={() => setShowButtonModal(true)} style={darkStyles.cardInteractive}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '24px' }}>🔘</div>
                  <div>
                    <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '14px' }}>Botón interactivo</div>
                    <div style={{ fontSize: '12px', color: buttonConfig.url ? '#00ccff' : '#777777' }}>
                      {buttonConfig.url ? `Botón: "${buttonConfig.text}"` : 'Toca para configurar enlace'}
                    </div>
                  </div>
                </div>
                <div style={{ color: '#888', fontWeight: 'bold' }}>&gt;</div>
              </div>

              <button onClick={handleNextStep2} style={{ ...darkStyles.btnPrimary, marginTop: '16px' }}>
                Continuar al selector de grupos &gt;
              </button>
            </div>
          )}

          {/* ================= PASO 3: SELECCIÓN DE GRUPOS ================= */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <button onClick={() => setStep(2)} style={{ ...darkStyles.btnLight, padding: '6px 12px' }}>&lt;</button>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#fff' }}>¿Dónde se publica?</h3>
              </div>

              {AVAILABLE_GROUPS.map((grp) => {
                const isSelected = selectedGroups.includes(grp.id);
                return (
                  <div
                    key={grp.id}
                    onClick={() => handleToggleGroup(grp.id)}
                    style={{
                      ...darkStyles.cardInteractive,
                      borderColor: isSelected ? '#00ccff' : '#333333',
                      backgroundColor: isSelected ? '#12252e' : '#1a1a1a'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: '#ffffff' }}>{grp.name}</div>
                      <div style={{ fontSize: '11px', color: '#888888' }}>{grp.members}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      style={{ width: '18px', height: '18px', accentColor: '#00ccff' }}
                    />
                  </div>
                );
              })}

              <div style={{
                backgroundColor: '#12252e',
                border: '1px solid #00ccff',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: '800',
                fontSize: '13px',
                marginBottom: '14px',
                color: '#00ccff'
              }}>
                <span>{selectedGroups.length} grupos seleccionados</span>
                <span>Costo: {totalCost} PT</span>
              </div>

              <button onClick={handleNextStep3} style={darkStyles.btnPrimary}>
                Continuar al resumen &gt;
              </button>
            </div>
          )}

          {/* ================= PASO 4: RESUMEN Y CONFIRMACIÓN ================= */}
          {step === 4 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <button onClick={() => setStep(3)} style={{ ...darkStyles.btnLight, padding: '6px 12px' }}>&lt;</button>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#fff' }}>Revisar y Publicar</h3>
              </div>

              <div style={darkStyles.card}>
                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '6px' }}>VISTA PREVIA:</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', marginBottom: '10px', color: '#eee' }}>{postText}</div>
                {imageUrl && (
                  <div style={{ fontSize: '12px', color: '#00ccff', marginBottom: '8px' }}>
                    🖼️ Imagen adjunta: {imageUrl.slice(0, 35)}...
                  </div>
                )}
                {buttonConfig.url && (
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: buttonConfig.color === 'blue' ? '#0070f3' : buttonConfig.color === 'green' ? '#28a745' : '#262626',
                    color: '#ffffff'
                  }}>
                    🔗 {buttonConfig.text}
                  </div>
                )}
              </div>

              <div style={{ fontSize: '13px', marginBottom: '14px', padding: '0 4px', color: '#aaa', lineHeight: '1.6' }}>
                • Tu saldo: <strong style={{ color: '#ffcc00' }}>{balance} PT</strong><br />
                • Costo total: <strong style={{ color: '#ff8a80' }}>-{totalCost} PT</strong><br />
                • Saldo restante estimado: <strong style={{ color: '#fff' }}>{(balance - totalCost).toFixed(2)} PT</strong>
              </div>

              <button 
                onClick={handlePublish} 
                disabled={isPublishing} 
                style={{ ...darkStyles.btnPrimary, backgroundColor: '#28a745', color: '#fff' }}
              >
                {isPublishing ? 'Enviando...' : '🚀 CONFIRMAR Y PUBLICAR'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Pestaña Mis Posts */}
      {activeTab === 'history' && (
        <div style={darkStyles.card}>
          <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>Historial reciente</h4>
          <p style={{ fontSize: '13px', color: '#888' }}>
            Aquí podrás consultar las campañas y anuncios enviados a los grupos.
          </p>
        </div>
      )}

      {/* ================= MODAL DE CONFIGURACIÓN DEL BOTÓN ================= */}
      {showButtonModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100000
        }}>
          <div style={{ ...darkStyles.card, width: '100%', maxWidth: '340px', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: '800', color: '#fff', fontSize: '16px' }}>Botón interactivo</h3>
              <button 
                onClick={() => setShowButtonModal(false)}
                style={{ ...darkStyles.btnLight, padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>TEXTO DEL BOTÓN</label>
              <input
                style={darkStyles.input}
                value={buttonConfig.text}
                onChange={(e) => setButtonConfig({ ...buttonConfig, text: e.target.value })}
                placeholder="Ej. Abrir Mini App"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>ENLACE (URL)</label>
              <input
                style={darkStyles.input}
                value={buttonConfig.url}
                onChange={(e) => setButtonConfig({ ...buttonConfig, url: e.target.value })}
                placeholder="https://t.me/..."
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>COLOR</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
                {[
                  { id: 'neutral', label: 'Neutro', bg: '#262626' },
                  { id: 'blue', label: 'Azul', bg: '#0070f3' },
                  { id: 'green', label: 'Verde', bg: '#28a745' },
                  { id: 'red', label: 'Rojo', bg: '#dc3545' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setButtonConfig({ ...buttonConfig, color: c.id })}
                    style={{
                      padding: '6px 2px',
                      fontSize: '11px',
                      fontWeight: '800',
                      backgroundColor: c.bg,
                      color: '#ffffff',
                      border: buttonConfig.color === c.id ? '2px solid #00ccff' : '1px solid #444',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setShowButtonModal(false)} style={darkStyles.btnPrimary}>
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL DE IMAGEN ================= */}
      {showImageModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100000
        }}>
          <div style={{ ...darkStyles.card, width: '100%', maxWidth: '340px', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: '800', color: '#fff', fontSize: '16px' }}>Adjuntar Imagen</h3>
              <button 
                onClick={() => setShowImageModal(false)}
                style={{ ...darkStyles.btnLight, padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>URL PÚBLICA DE LA IMAGEN</label>
              <input
                style={darkStyles.input}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <button onClick={() => setShowImageModal(false)} style={darkStyles.btnPrimary}>
              Guardar Imagen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
