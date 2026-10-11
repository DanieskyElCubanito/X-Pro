import { useState, useRef, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ADMIN_ID = '8968109534';

const neonStyles = {
  container: { color: '#ffffff', paddingBottom: '20px' },
  title: {
    fontSize: '24px', fontWeight: '900', textAlign: 'center', letterSpacing: '1.5px', textTransform: 'uppercase',
    margin: '10px 0 16px 0', background: 'linear-gradient(90deg, #ff41b4, #00f0ff, #ffe600)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 20px rgba(255, 65, 180, 0.4)'
  },
  card: {
    background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.85), rgba(20, 8, 38, 0.95))',
    border: '2px solid #ff41b4', borderRadius: '24px', padding: '18px', marginBottom: '16px',
    boxShadow: '0 8px 24px rgba(255, 65, 180, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
  },
  cardInteractive: {
    background: 'linear-gradient(135deg, rgba(38, 14, 66, 0.9), rgba(18, 7, 36, 0.9))',
    border: '2px solid #8a2be2', borderRadius: '20px', padding: '14px 18px', marginBottom: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)', transition: 'all 0.2s ease'
  },
  btnPrimary: {
    width: '100%', padding: '15px', background: 'linear-gradient(180deg, #ff66cc 0%, #ff1493 50%, #d80073 100%)',
    color: '#ffffff', border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '16px',
    letterSpacing: '0.5px', cursor: 'pointer', boxShadow: '0 6px 0 #8b004b, 0 10px 20px rgba(255, 20, 147, 0.4)'
  },
  btnDark: {
    padding: '12px 18px', background: 'linear-gradient(180deg, #00ffff, #00aaff)', color: '#050214',
    border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '13px', cursor: 'pointer',
    boxShadow: '0 4px 0 #0077aa, 0 6px 15px rgba(0, 255, 255, 0.4)'
  },
  btnLight: {
    padding: '12px 18px', background: 'rgba(255, 255, 255, 0.08)', color: '#ff99dd',
    border: '2px solid rgba(255, 65, 180, 0.3)', borderRadius: '16px', fontWeight: '800', fontSize: '13px', cursor: 'pointer'
  },
  input: {
    width: '100%', background: 'rgba(15, 5, 28, 0.8)', border: '2px solid #8a2be2', borderRadius: '16px',
    padding: '12px 14px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box'
  },
  progressBarContainer: { display: 'flex', justifyContent: 'center', gap: '8px', margin: '10px 0 20px 0' },
  progressStep: (active) => ({
    width: '45px', height: '8px',
    background: active ? 'linear-gradient(90deg, #ff1493, #00f0ff)' : 'rgba(255, 255, 255, 0.1)',
    borderRadius: '20px', boxShadow: active ? '0 0 10px #00f0ff' : 'none', transition: 'all 0.3s ease'
  })
};

const TEMPLATES = [
  { title: 'Airdrop Boom', icon: '🚀', accent: '#ff007f', text: '🚀 Nuevo Airdrop confirmado. Participa gratis completando las tareas y asegura tus tokens.' },
  { title: 'Sorteo Neón', icon: '💎', accent: '#00f0ff', text: '💎 Gran recompensa activa para la comunidad. Entra al enlace y participa ahora mismo.' },
  { title: 'Red de Tráfico', icon: '⚡', accent: '#ffe600', text: '⚡ Únete a nuestra red. Gana CLICK gratis todos los días completando tareas simples.' }
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
  const [buttonConfig, setButtonConfig] = useState({ text: '', url: '' });
  const [selectedGroups, setSelectedGroups] = useState([]);

  const [myCampaigns, setMyCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Estados de modales
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef(null);

  const balance = Number(userData?.balance || 0);
  const COST_PER_GROUP = 10;
  const totalCost = selectedGroups.length * COST_PER_GROUP;
  const isAdmin = String(userData?.id) === ADMIN_ID;

  useEffect(() => {
    if (activeTab === 'history' && userData?.id) {
      loadMyCampaigns();
    }
  }, [activeTab, userData?.id]);

  const loadMyCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-tasks', userId: userData.id })
      });
      const data = await res.json();
      if (data.success) {
        // Filtramos las tareas creadas por el usuario actual o mostramos todas si es Admin
        const filtered = isAdmin 
          ? (data.tasks || []) 
          : (data.tasks || []).filter(t => String(t.creator_id) === String(userData.id));
        setMyCampaigns(filtered);
      }
    } catch (e) {
      console.error("Error cargando anuncios", e);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleToggleGroup = (groupId) => {
    setSelectedGroups(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) return toast.error("La imagen debe pesar menos de 3MB.");
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveButton = () => {
    if (buttonConfig.text && !buttonConfig.url) return toast.error("Debes ingresar un enlace válido.");
    if (buttonConfig.url) {
      const urlPattern = /^(https?:\/\/|t\.me\/).+/i;
      if (!urlPattern.test(buttonConfig.url)) return toast.error("El enlace debe comenzar con http://, https:// o t.me/");
      if (!buttonConfig.text.trim()) setButtonConfig(prev => ({ ...prev, text: "Abrir Enlace" }));
    }
    setShowButtonModal(false);
    toast.success("Botón guardado");
  };

  const handleClearButton = () => {
    setButtonConfig({ text: '', url: '' });
    setShowButtonModal(false);
    toast.success("Botón eliminado");
  };

  // Acciones de Gestión de Campañas (Eliminar / Editar)
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta campaña? Se reembolsará el saldo no gastado.")) return;
    const tid = toast.loading("Eliminando campaña...");
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-task',
          taskId: taskId,
          requestingUserId: userData.id,
          isAdminAction: isAdmin
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Campaña eliminada con éxito.", { id: tid });
        loadMyCampaigns();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err.message || "Error al eliminar", { id: tid });
    }
  };

  const handleOpenEdit = (task) => {
    setEditingTask({ id: task.id, title: task.title, url: task.url });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const tid = toast.loading("Guardando cambios...");
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit-task',
          taskId: editingTask.id,
          requestingUserId: userData.id,
          newTitle: editingTask.title,
          newUrl: editingTask.url,
          isAdminAction: isAdmin
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Campaña actualizada.", { id: tid });
        setShowEditModal(false);
        loadMyCampaigns();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err.message || "Error al actualizar", { id: tid });
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const tid = toast.loading("Transmitiendo señal...");

    const finalButtonConfig = buttonConfig.url ? {
      text: buttonConfig.text || "Abrir Enlace",
      url: buttonConfig.url
    } : null;

    try {
      for (const chatId of selectedGroups) {
        const response = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'publish-post',
            userId: userData?.id,
            chatId: chatId,
            text: postText,
            photoData: imageUrl || null,
            buttonConfig: finalButtonConfig,
            link: buttonConfig.url || null
          })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Error al publicar.");
        if (data.balance !== undefined) setUserData((prev) => ({ ...prev, balance: data.balance }));
      }

      toast.success("¡Campaña Transmitida con Éxito!", { id: tid });
      setPostText(''); setImageUrl(''); setButtonConfig({ text: '', url: '' }); setSelectedGroups([]); setStep(1);
    } catch (err) {
      toast.error(err.message || "Error de red", { id: tid });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={neonStyles.container}>
      <Toaster position="top-center" />
      <h2 style={neonStyles.title}>CREAR CAMPAÑA</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button onClick={() => setActiveTab('create')} style={activeTab === 'create' ? { ...neonStyles.btnDark, flex: 1 } : { ...neonStyles.btnLight, flex: 1 }}>
          🚀 Nueva Campaña
        </button>
        <button onClick={() => setActiveTab('history')} style={activeTab === 'history' ? { ...neonStyles.btnDark, flex: 1 } : { ...neonStyles.btnLight, flex: 1 }}>
          📋 Mis Anuncios
        </button>
      </div>

      {activeTab === 'create' && (
        <>
          <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '900', color: '#ff66cc', letterSpacing: '1px' }}>PASO {step} DE 4</div>
          <div style={neonStyles.progressBarContainer}>
            <div style={neonStyles.progressStep(step >= 1)} />
            <div style={neonStyles.progressStep(step >= 2)} />
            <div style={neonStyles.progressStep(step >= 3)} />
            <div style={neonStyles.progressStep(step >= 4)} />
          </div>

          {step === 1 && (
            <div className="fade-in">
              <h3 style={{ fontSize: '17px', fontWeight: '900', marginBottom: '10px', color: '#ffe600' }}>¿Qué quieres promocionar?</h3>
              <div style={neonStyles.card}>
                <textarea
                  style={{ ...neonStyles.input, height: '115px', resize: 'none', border: 'none', background: 'transparent', padding: 0, fontSize: '15px' }}
                  placeholder="Escribe tu anuncio en formato HTML (ej. <b>Negrita</b>)..."
                  maxLength={1000} value={postText} onChange={(e) => setPostText(e.target.value)}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#ff99dd', marginTop: '6px', fontWeight: 'bold' }}>{postText.length} / 1000</div>
                <button onClick={() => { if (!postText.trim()) return toast.error("Escribe un mensaje."); setStep(2); }} style={{ ...neonStyles.btnPrimary, marginTop: '14px' }}>SIGUIENTE PASO ➔</button>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '900', color: '#00f0ff', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>⚡ Plantillas Rápidas</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {TEMPLATES.map((tmpl, idx) => (
                  <div key={idx} onClick={() => setPostText(tmpl.text)} style={{ ...neonStyles.card, padding: '12px 8px', cursor: 'pointer', marginBottom: 0, borderColor: tmpl.accent, textAlign: 'center' }}>
                    <div style={{ fontSize: '26px', marginBottom: '4px' }}>{tmpl.icon}</div>
                    <div style={{ fontWeight: '900', fontSize: '11px', color: '#fff' }}>{tmpl.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <button onClick={() => setStep(1)} style={{ ...neonStyles.btnLight, padding: '6px 12px' }}>◀</button>
                <h3 style={{ fontSize: '17px', fontWeight: '900', margin: 0, color: '#ffe600' }}>Configuración Multimedia</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#ff99dd', marginBottom: '14px' }}>Añade una foto desde tu galería y/o un botón. (Opcional)</p>

              <div onClick={() => fileInputRef.current.click()} style={neonStyles.cardInteractive}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '28px' }}>🖼️</div>
                  <div>
                    <div style={{ fontWeight: '900', color: '#ffffff', fontSize: '15px' }}>Imagen del Anuncio</div>
                    <div style={{ fontSize: '12px', color: imageUrl ? '#00f0ff' : '#aaa' }}>{imageUrl ? 'Imagen adjuntada ✓' : 'Subir desde la Galería'}</div>
                  </div>
                </div>
                {imageUrl && <button onClick={(e) => { e.stopPropagation(); setImageUrl(''); }} style={{ background: 'transparent', border: 'none', color: '#ff1493', fontWeight: 'bold' }}>✕</button>}
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

              <div onClick={() => setShowButtonModal(true)} style={neonStyles.cardInteractive}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '28px' }}>🔘</div>
                  <div>
                    <div style={{ fontWeight: '900', color: '#ffffff', fontSize: '15px' }}>Botón Interactivo</div>
                    <div style={{ fontSize: '12px', color: buttonConfig.url ? '#ff41b4' : '#aaa' }}>{buttonConfig.url ? `Configurado: "${buttonConfig.text}"` : 'Añadir Enlace (Opcional)'}</div>
                  </div>
                </div>
                <div style={{ color: '#ff41b4', fontWeight: '900', fontSize: '18px' }}>➔</div>
              </div>

              <button onClick={() => setStep(3)} style={{ ...neonStyles.btnPrimary, marginTop: '16px' }}>DESTINO DE TRANSMISIÓN ➔</button>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <button onClick={() => setStep(2)} style={{ ...neonStyles.btnLight, padding: '6px 12px' }}>◀</button>
                <h3 style={{ fontSize: '17px', fontWeight: '900', margin: 0, color: '#ffe600' }}>¿Dónde lo publicamos?</h3>
              </div>

              {AVAILABLE_GROUPS.map((grp) => {
                const isSelected = selectedGroups.includes(grp.id);
                return (
                  <div key={grp.id} onClick={() => handleToggleGroup(grp.id)} style={{ ...neonStyles.cardInteractive, borderColor: isSelected ? '#00f0ff' : '#8a2be2', background: isSelected ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(46, 16, 77, 0.9))' : neonStyles.cardInteractive.background }}>
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '15px', color: '#ffffff' }}>{grp.name}</div>
                      <div style={{ fontSize: '12px', color: '#ff99dd' }}>{grp.members}</div>
                    </div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isSelected ? '#00f0ff' : 'transparent', border: '2px solid #00f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050214', fontWeight: '900' }}>
                      {isSelected ? '✓' : ''}
                    </div>
                  </div>
                );
              })}

              <div style={{ background: 'linear-gradient(90deg, #ff1493, #8a2be2)', borderRadius: '18px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '14px', marginBottom: '14px' }}>
                <span>🎯 {selectedGroups.length} seleccionados</span>
                <span>Costo: {totalCost} CLICK</span>
              </div>
              <button onClick={() => { if (selectedGroups.length === 0) return toast.error("Selecciona un grupo."); if (balance < totalCost) return toast.error("Saldo insuficiente."); setStep(4); }} style={neonStyles.btnPrimary}>REVISAR ➔</button>
            </div>
          )}

          {step === 4 && (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <button onClick={() => setStep(3)} style={{ ...neonStyles.btnLight, padding: '6px 12px' }}>◀</button>
                <h3 style={{ fontSize: '17px', fontWeight: '900', margin: 0, color: '#ffe600' }}>Vista Previa</h3>
              </div>

              <div style={neonStyles.card}>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', marginBottom: '12px', color: '#fff' }} dangerouslySetInnerHTML={{ __html: postText.replace(/\n/g, '<br/>') }} />
                {imageUrl && <div style={{ fontSize: '12px', color: '#ff99dd', marginBottom: '12px' }}>🖼️ [Imagen Adjunta]</div>}
                {buttonConfig.url && (
                  <div style={{ padding: '10px', background: '#2F3A4C', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' }}>{buttonConfig.text || "Abrir Enlace"}</div>
                )}
              </div>

              <button onClick={handlePublish} disabled={isPublishing} style={{ ...neonStyles.btnPrimary, background: 'linear-gradient(180deg, #00ffaa, #00bb77)' }}>
                {isPublishing ? 'TRANSMITIENDO...' : '⚡ ¡LANZAR AHORA! ⚡'}
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="fade-in">
          <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#ffe600', marginBottom: '12px' }}>Tus Campañas Activas</h3>
          {loadingCampaigns ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#00f0ff' }}>Cargando anuncios...</div>
          ) : myCampaigns.length === 0 ? (
            <div style={{ ...neonStyles.card, textAlign: 'center' }}>
              <p style={{ color: '#ff99dd', margin: 0 }}>No tienes campañas activas en este momento.</p>
            </div>
          ) : (
            myCampaigns.map((task) => (
              <div key={task.id} style={{ ...neonStyles.card, borderColor: '#00f0ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '900', color: '#00f0ff', fontSize: '14px' }}>{task.title || 'Campaña'}</span>
                  <span style={{ fontSize: '11px', color: '#ffe600', textTransform: 'uppercase' }}>{task.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#ff99dd', wordBreak: 'break-all', marginBottom: '10px' }}>🔗 {task.url}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                  <span>Progreso: {task.completions_done} / {task.completions_total}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleOpenEdit(task)} style={{ background: '#00f0ff', color: '#050214', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ Editar</button>
                    <button onClick={() => handleDeleteTask(task.id)} style={{ background: '#ff1493', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Eliminar</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL CONFIGURAR BOTÓN */}
      {showButtonModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 2, 20, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100000, backdropFilter: 'blur(5px)' }}>
          <div style={{ ...neonStyles.card, width: '100%', maxWidth: '340px', marginBottom: 0, borderColor: '#00f0ff' }}>
            <h3 style={{ margin: '0 0 14px 0', color: '#00f0ff', fontSize: '17px' }}>Configurar Botón</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#ff99dd', fontWeight: '900' }}>TEXTO DEL BOTÓN</label>
              <input style={neonStyles.input} value={buttonConfig.text} onChange={(e) => setButtonConfig({ ...buttonConfig, text: e.target.value })} placeholder="Ej. 🚀 Entrar" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#ff99dd', fontWeight: '900' }}>ENLACE (URL)</label>
              <input style={neonStyles.input} value={buttonConfig.url} onChange={(e) => setButtonConfig({ ...buttonConfig, url: e.target.value })} placeholder="https://t.me/..." />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleClearButton} style={{ ...neonStyles.btnLight, flex: 1, color: '#ff1493', borderColor: '#ff1493' }}>BORRAR</button>
              <button onClick={handleSaveButton} style={{ ...neonStyles.btnPrimary, flex: 2 }}>GUARDAR</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR TAREA */}
      {showEditModal && editingTask && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 2, 20, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100000, backdropFilter: 'blur(5px)' }}>
          <div style={{ ...neonStyles.card, width: '100%', maxWidth: '340px', marginBottom: 0, borderColor: '#ffe600' }}>
            <h3 style={{ margin: '0 0 14px 0', color: '#ffe600', fontSize: '17px' }}>Editar Campaña</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#ff99dd', fontWeight: '900' }}>TÍTULO</label>
              <input style={neonStyles.input} value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#ff99dd', fontWeight: '900' }}>ENLACE (URL)</label>
              <input style={neonStyles.input} value={editingTask.url} onChange={(e) => setEditingTask({ ...editingTask, url: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowEditModal(false)} style={{ ...neonStyles.btnLight, flex: 1 }}>CANCELAR</button>
              <button onClick={handleSaveEdit} style={{ ...neonStyles.btnPrimary, flex: 2, background: 'linear-gradient(180deg, #00ffff, #00aaff)' }}>ACTUALIZAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
