import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { nb } from '../styles/neoBrutalist';

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
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history'
  const [step, setStep] = useState(1);

  // Datos del post
  const [postText, setPostText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [buttonConfig, setButtonConfig] = useState({ text: 'Abrir', url: '', color: 'neutral' });
  const [selectedGroups, setSelectedGroups] = useState([]);

  // Modales
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const balance = Number(userData?.balance || 0);
  const totalCost = selectedGroups.length * 1; // 1 PT por grupo seleccionado

  const handleToggleGroup = (groupId) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter((id) => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const handleNextStep1 = () => {
    if (!postText.trim()) {
      return toast.error("Escribe un mensaje para continuar.");
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setStep(3);
  };

  const handleNextStep3 = () => {
    if (selectedGroups.length === 0) {
      return toast.error("Selecciona al menos un grupo.");
    }
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
        if (!data.success) {
          throw new Error(data.error || "Error al publicar.");
        }

        // Actualizar balance en el estado global
        if (data.balance !== undefined) {
          setUserData((prev) => ({ ...prev, balance: data.balance }));
        }
      }

      toast.success("¡Publicado con éxito!", { id: tid });
      // Resetear formulario
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
    <div style={nb.container}>
      <Toaster position="top-center" />
      <h2 style={nb.title}>PUBLICAR</h2>

      {/* Selector superior: Crear post / Mis posts */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        <button 
          onClick={() => setActiveTab('create')} 
          style={activeTab === 'create' ? { ...nb.btnDark, flex: 1 } : { ...nb.btnLight, flex: 1 }}
        >
          🚀 Crear post
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          style={activeTab === 'history' ? { ...nb.btnDark, flex: 1 } : { ...nb.btnLight, flex: 1 }}
        >
          📋 Mis posts
        </button>
      </div>

      {activeTab === 'create' && (
        <>
          {/* Indicador de pasos */}
          <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
            PASO {step} DE 4
          </div>
          <div style={nb.progressBarContainer}>
            <div style={nb.progressStep(step >= 1)} />
            <div style={nb.progressStep(step >= 2)} />
            <div style={nb.progressStep(step >= 3)} />
            <div style={nb.progressStep(step >= 4)} />
          </div>

          {/* ================= PASO 1: TEXTO & PLANTILLAS ================= */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px' }}>
                ¿Qué quieres compartir?
              </h3>
              <div style={nb.card}>
                <textarea
                  style={{ ...nb.input, height: '120px', resize: 'none', border: 'none', padding: 0 }}
                  placeholder="Escribe tu mensaje o anuncio aquí..."
                  maxLength={500}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#888', marginTop: '6px' }}>
                  {postText.length} / 500
                </div>
                <button onClick={handleNextStep1} style={{ ...nb.btnPrimary, marginTop: '12px' }}>
                  &gt; Continuar
                </button>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '900', color: '#666', marginBottom: '10px', textTransform: 'uppercase' }}>
                Plantillas rápidas
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {TEMPLATES.map((tmpl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPostText(tmpl.text)}
                    style={{ ...nb.card, padding: '12px', cursor: 'pointer', marginBottom: 0 }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{tmpl.icon}</div>
                    <div style={{ fontWeight: '800', fontSize: '14px' }}>{tmpl.title}</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', lineHeight: '1.2' }}>
                      {tmpl.text.slice(0, 40)}...
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
                <button onClick={() => setStep(1)} style={{ ...nb.btnLight, padding: '6px 12px' }}>&lt;</button>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>¿Le añades algo?</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '14px' }}>
                Opcional. Una imagen y un enlace hacen que se mire más.
              </p>

              <div onClick={() => setShowImageModal(true)} style={nb.cardInteractive}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '26px' }}>🖼️</div>
                  <div>
                    <div style={{ fontWeight: '800' }}>Imagen</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {imageUrl ? 'Imagen adjuntada ✓' : 'Añade una URL pública'}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: '900' }}>&gt;</div>
              </div>

              <div onClick={() => setShowButtonModal(true)} style={nb.cardInteractive}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '26px' }}>🔘</div>
                  <div>
                    <div style={{ fontWeight: '800' }}>Botón interactivo</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {buttonConfig.url ? `Botón: "${buttonConfig.text}"` : 'Toca para configurar enlace'}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: '900' }}>&gt;</div>
              </div>

              <button onClick={handleNextStep2} style={{ ...nb.btnPrimary, marginTop: '16px' }}>
                &gt; Continuar al selector de grupos
              </button>
            </div>
          )}

          {/* ================= PASO 3: SELECCIÓN DE GRUPOS ================= */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <button onClick={() => setStep(2)} style={{ ...nb.btnLight, padding: '6px 12px' }}>&lt;</button>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>¿Dónde se publica?</h3>
              </div>

              {AVAILABLE_GROUPS.map((grp) => {
                const isSelected = selectedGroups.includes(grp.id);
                return (
                  <div
                    key={grp.id}
                    onClick={() => handleToggleGroup(grp.id)}
                    style={{
                      ...nb.cardInteractive,
                      backgroundColor: isSelected ? '#a8f0c6' : '#fff' // Verde neo-brutalist al seleccionar
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15px' }}>{grp.name}</div>
                      <div style={{ fontSize: '12px', color: '#444' }}>{grp.members}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      style={{ width: '20px', height: '20px', accentColor: '#000' }}
                    />
                  </div>
                );
              })}

              <div style={{
                backgroundColor: '#8cb7fc',
                border: '2.5px solid #000',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: '900',
                marginBottom: '14px'
              }}>
                <span>{selectedGroups.length} grupos elegidos</span>
                <span>Costo: {totalCost} PT</span>
              </div>

              <button onClick={handleNextStep3} style={nb.btnPrimary}>
                &gt; Continuar al resumen
              </button>
            </div>
          )}

          {/* ================= PASO 4: RESUMEN Y CONFIRMACIÓN ================= */}
          {step === 4 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <button onClick={() => setStep(3)} style={{ ...nb.btnLight, padding: '6px 12px' }}>&lt;</button>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Revisar y Publicar</h3>
              </div>

              <div style={nb.card}>
                <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', marginBottom: '6px' }}>VISTA PREVIA:</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', marginBottom: '10px' }}>{postText}</div>
                {imageUrl && (
                  <div style={{ fontSize: '12px', color: '#2b6cb0', marginBottom: '6px' }}>
                    🖼️ Imagen adjunta: {imageUrl.slice(0, 35)}...
                  </div>
                )}
                {buttonConfig.url && (
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: buttonConfig.color === 'blue' ? '#8cb7fc' : buttonConfig.color === 'green' ? '#a8f0c6' : '#fff'
                  }}>
                    🔗 {buttonConfig.text}
                  </div>
                )}
              </div>

              <div style={{ fontSize: '13px', marginBottom: '14px', padding: '0 4px' }}>
                • Tu saldo actual: <strong>{balance} PT</strong><br />
                • Costo total de envío: <strong>{totalCost} PT</strong><br />
                • Saldo restante estimado: <strong>{(balance - totalCost).toFixed(2)} PT</strong>
              </div>

              <button 
                onClick={handlePublish} 
                disabled={isPublishing} 
                style={{ ...nb.btnPrimary, backgroundColor: '#a8f0c6' }}
              >
                {isPublishing ? 'Enviando...' : '🚀 CONFIRMAR Y PUBLICAR'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Pestaña Mis Posts */}
      {activeTab === 'history' && (
        <div style={nb.card}>
          <h4 style={{ margin: '0 0 10px 0' }}>Historial reciente</h4>
          <p style={{ fontSize: '13px', color: '#666' }}>
            Aquí podrás consultar las campañas y anuncios enviados a los grupos.
          </p>
        </div>
      )}

      {/* ================= MODAL DE CONFIGURACIÓN DEL BOTÓN ================= */}
      {showButtonModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100
        }}>
          <div style={{ ...nb.card, width: '100%', maxWidth: '340px', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: '900' }}>Botón</h3>
              <button 
                onClick={() => setShowButtonModal(false)}
                style={{ ...nb.btnLight, padding: '4px 8px', backgroundColor: '#ff8a80' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>Texto del botón</label>
              <input
                style={nb.input}
                value={buttonConfig.text}
                onChange={(e) => setButtonConfig({ ...buttonConfig, text: e.target.value })}
                placeholder="Ej. Abrir App"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>A dónde lleva (URL)</label>
              <input
                style={nb.input}
                value={buttonConfig.url}
                onChange={(e) => setButtonConfig({ ...buttonConfig, url: e.target.value })}
                placeholder="https://t.me/..."
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>Color</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
                {[
                  { id: 'neutral', label: 'Neutro', bg: '#fff' },
                  { id: 'blue', label: 'Azul', bg: '#8cb7fc' },
                  { id: 'green', label: 'Verde', bg: '#a8f0c6' },
                  { id: 'red', label: 'Rojo', bg: '#ff8a80' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setButtonConfig({ ...buttonConfig, color: c.id })}
                    style={{
                      padding: '6px 2px',
                      fontSize: '11px',
                      fontWeight: '800',
                      backgroundColor: c.bg,
                      border: '2px solid #000',
                      borderRadius: '8px',
                      boxShadow: buttonConfig.color === c.id ? 'inset 0 0 0 2px #000' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setShowButtonModal(false)} style={nb.btnPrimary}>
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL DE IMAGEN ================= */}
      {showImageModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100
        }}>
          <div style={{ ...nb.card, width: '100%', maxWidth: '340px', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: '900' }}>Imagen</h3>
              <button 
                onClick={() => setShowImageModal(false)}
                style={{ ...nb.btnLight, padding: '4px 8px', backgroundColor: '#ff8a80' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>URL directa de la imagen</label>
              <input
                style={nb.input}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/foto.jpg"
              />
            </div>

            <button onClick={() => setShowImageModal(false)} style={nb.btnPrimary}>
              Guardar Imagen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
