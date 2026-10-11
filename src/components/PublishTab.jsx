import { useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';

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
  const [buttonConfig, setButtonConfig] = useState({ text: 'Abrir App', url: '', color: 'default' });
  const [selectedGroups, setSelectedGroups] = useState([]);

  const [showButtonModal, setShowButtonModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef(null);

  const balance = Number(userData?.balance || 0);
  
  // Costo ajustado a 10 CLICK por publicación para balancear la economía de la app.
  const COST_PER_GROUP = 10;
  const totalCost = selectedGroups.length * COST_PER_GROUP;

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

  const handleNextStep1 = () => { if (!postText.trim()) return toast.error("Escribe un mensaje para continuar."); setStep(2); };
  const handleNextStep2 = () => setStep(3);
  const handleNextStep3 = () => {
    if (selectedGroups.length === 0) return toast.error("Selecciona al menos un grupo o canal destino.");
    if (balance < totalCost) return toast.error(`Saldo insuficiente. Tienes ${balance} CLICK y necesitas ${totalCost} CLICK.`);
    setStep(4);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const tid = toast.loading("Transmitiendo señal...");

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
            link: buttonConfig.url || 'https://t.me/ClickNetworkbot/app',
            photoData: imageUrl || null,
            buttonConfig: buttonConfig.url ? buttonConfig : null
          })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Error al publicar.");
        if (data.balance !== undefined) setUserData((prev) => ({ ...prev, balance: data.balance }));
      }

      toast.success("¡Campaña Transmitida con Éxito!", { id: tid });
      setPostText(''); setImageUrl(''); setButtonConfig({ text: 'Abrir App', url: '', color: 'default' }); setSelectedGroups([]); setStep(1);
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
                  placeholder="Escribe tu anuncio aquí..."
                  maxLength={500} value={postText} onChange={(e) => setPostText(e.target.value)}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#ff99dd', marginTop: '6px', fontWeight: 'bold' }}>{postText.length} / 500</div>
                <button onClick={handleNextStep1} style={{ ...neonStyles.btnPrimary, marginTop: '14px' }}>SIGUIENTE PASO ➔</button>
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
              <p style={{ fontSize: '12px', color: '#ff99dd', marginBottom: '14px' }}>Añade una foto desde tu galería y configura un botón interactivo.</p>

              <div onClick={() => fileInputRef.current.click()} style={neonStyles.cardInteractive}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '28px' }}>🖼️</div>
                  <div>
                    <div style={{ fontWeight: '900', color: '#ffffff', fontSize: '15px' }}>Imagen del Dispositivo</div>
                    <div style={{ fontSize: '12px', color: imageUrl ? '#00f0ff' : '#aaa' }}>{imageUrl ? 'Imagen adjuntada ✓' : 'Subir desde la Galería'}</div>
                  </div>
                </div>
                <div style={{ color: '#00f0ff', fontWeight: '900', fontSize: '18px' }}>➔</div>
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

              <div onClick={() => setShowButtonModal(true)} style={neonStyles.cardInteractive}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '28px' }}>🔘</div>
                  <div>
                    <div style={{ fontWeight: '900', color: '#ffffff', fontSize: '15px' }}>Botón Interactivo</div>
                    <div style={{ fontSize: '12px', color: buttonConfig.url ? '#ff41b4' : '#aaa' }}>{buttonConfig.url ? `Texto: "${buttonConfig.text}"` : 'Añadir Enlace (Opcional)'}</div>
                  </div>
                </div>
                <div style={{ color: '#ff41b4', fontWeight: '900', fontSize: '18px' }}>➔</div>
              </div>

              <button onClick={handleNextStep2} style={{ ...neonStyles.btnPrimary, marginTop: '16px' }}>DESTINO DE TRANSMISIÓN ➔</button>
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
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isSelected ? '#00f0ff' : 'transparent', border: '2px solid #00f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050214', fontWeight: '900', fontSize: '14px' }}>
                      {isSelected ? '✓' : ''}
                    </div>
                  </div>
                );
              })}

              <div style={{ background: 'linear-gradient(90deg, #ff1493, #8a2be2)', borderRadius: '18px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '14px', marginBottom: '14px', boxShadow: '0 4px 15px rgba(255, 20, 147, 0.3)' }}>
                <span>🎯 {selectedGroups.length} seleccionados</span>
                <span>Costo: {totalCost} CLICK</span>
              </div>
              <button onClick={handleNextStep3} style={neonStyles.btnPrimary}>REVISAR PUBLICACIÓN ➔</button>
            </div>
          )}

          {step === 4 && (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <button onClick={() => setStep(3)} style={{ ...neonStyles.btnLight, padding: '6px 12px' }}>◀</button>
                <h3 style={{ fontSize: '17px', fontWeight: '900', margin: 0, color: '#ffe600' }}>Vista Previa</h3>
              </div>

              <div style={neonStyles.card}>
                <div style={{ fontSize: '11px', color: '#00f0ff', fontWeight: '900', marginBottom: '8px' }}>TU ANUNCIO:</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', marginBottom: '12px', color: '#fff', lineHeight: '1.4' }}>{postText}</div>
                {imageUrl && <div style={{ fontSize: '12px', color: '#ff99dd', marginBottom: '8px' }}>🖼️ Imagen cargada desde dispositivo</div>}

                {buttonConfig.url && (
                  <div style={{
                    display: 'inline-block', padding: '8px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '900',
                    background: buttonConfig.color === 'primary' ? '#00f0ff' : buttonConfig.color === 'success' ? '#00ffaa' : buttonConfig.color === 'danger' ? '#ff1493' : '#262626',
                    color: buttonConfig.color === 'default' ? '#fff' : '#050214',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                  }}>
                    {buttonConfig.text} 🔗
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px', color: '#fff', lineHeight: '1.7' }}>
                • Saldo actual: <strong style={{ color: '#00f0ff' }}>{balance} CLICK</strong><br />
                • Costo de operación: <strong style={{ color: '#ff41b4' }}>-{totalCost} CLICK</strong><br />
                • Saldo restante: <strong style={{ color: '#ffe600' }}>{(balance - totalCost).toFixed(2)} CLICK</strong>
              </div>

              <button onClick={handlePublish} disabled={isPublishing} style={{ ...neonStyles.btnPrimary, background: 'linear-gradient(180deg, #00ffaa, #00bb77)', boxShadow: '0 6px 0 #007744, 0 10px 20px rgba(0, 255, 170, 0.4)' }}>
                {isPublishing ? 'TRANSMITIENDO...' : '⚡ ¡LANZAR AHORA! ⚡'}
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="fade-in" style={neonStyles.card}>
          <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '10px' }}>📜</div>
          <h4 style={{ margin: '0 0 8px 0', color: '#ffe600', textAlign: 'center', fontSize: '18px' }}>Historial Vacío</h4>
          <p style={{ fontSize: '13px', color: '#ff99dd', textAlign: 'center', lineHeight: '1.5' }}>Aquí verás el registro de tus campañas cuando realices tu primera publicación.</p>
        </div>
      )}

      {/* ================= MODAL BOTÓN (Colores de Telegram) ================= */}
      {showButtonModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 2, 20, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100000, backdropFilter: 'blur(5px)' }}>
          <div style={{ ...neonStyles.card, width: '100%', maxWidth: '340px', marginBottom: 0, borderColor: '#00f0ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontWeight: '900', color: '#00f0ff', fontSize: '17px' }}>Configurar Botón</h3>
              <button onClick={() => setShowButtonModal(false)} style={{ ...neonStyles.btnLight, padding: '4px 10px', color: '#fff', borderColor: '#ff1493' }}>✕</button>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#ff99dd', fontWeight: '900' }}>TEXTO DEL BOTÓN</label>
              <input style={neonStyles.input} value={buttonConfig.text} onChange={(e) => setButtonConfig({ ...buttonConfig, text: e.target.value })} placeholder="Ej. Entrar al Enlace" />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#ff99dd', fontWeight: '900' }}>ENLACE (URL)</label>
              <input style={neonStyles.input} value={buttonConfig.url} onChange={(e) => setButtonConfig({ ...buttonConfig, url: e.target.value })} placeholder="https://t.me/..." />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#ff99dd', fontWeight: '900' }}>COLOR DEL BOTÓN</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
                {[
                  { id: 'default', label: 'Gris', bg: '#262626' },
                  { id: 'primary', label: 'Cian', bg: '#00f0ff' },
                  { id: 'success', label: 'Neón', bg: '#00ffaa' },
                  { id: 'danger', label: 'Rosa', bg: '#ff1493' }
                ].map((c) => (
                  <button
                    key={c.id} onClick={() => setButtonConfig({ ...buttonConfig, color: c.id })}
                    style={{
                      padding: '8px 2px', fontSize: '10px', fontWeight: '900',
                      backgroundColor: c.bg, color: c.id === 'default' ? '#fff' : '#050214',
                      border: buttonConfig.color === c.id ? '2px solid #ffffff' : '2px solid transparent',
                      borderRadius: '10px', cursor: 'pointer', boxShadow: buttonConfig.color === c.id ? `0 0 10px ${c.bg}` : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setShowButtonModal(false)} style={neonStyles.btnPrimary}>GUARDAR BOTÓN</button>
          </div>
        </div>
      )}
    </div>
  );
}
