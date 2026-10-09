import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';
import { botApi } from '../api/botApi';

const neon = {
  card: { 
    background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.85), rgba(20, 8, 38, 0.95))', 
    border: '2px solid #00f0ff', borderRadius: '24px', padding: '20px', 
    marginBottom: '16px', boxShadow: '0 8px 24px rgba(0, 240, 255, 0.15)' 
  },
  cardInteractive: { 
    background: 'linear-gradient(135deg, rgba(38, 14, 66, 0.9), rgba(18, 7, 36, 0.9))', 
    border: '2px solid #8a2be2', borderRadius: '20px', padding: '16px', 
    marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', 
    cursor: 'pointer', boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)', transition: 'all 0.2s ease' 
  },
  btnPrimary: { 
    width: '100%', padding: '14px', background: 'linear-gradient(180deg, #00f0ff 0%, #0099ff 100%)', 
    color: '#050214', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px', 
    cursor: 'pointer', boxShadow: '0 6px 0 #0066aa, 0 10px 20px rgba(0, 240, 255, 0.4)', 
    textTransform: 'uppercase', letterSpacing: '0.5px' 
  },
  btnSecondary: { 
    width: '100%', padding: '14px', background: 'transparent', color: '#ff99dd', 
    border: '2px dashed #ff41b4', borderRadius: '16px', fontWeight: '900', fontSize: '15px', 
    cursor: 'pointer', boxShadow: '0 0 15px rgba(255, 65, 180, 0.2)', textTransform: 'uppercase' 
  },
  btnAction: { 
    padding: '8px 16px', background: 'rgba(255, 65, 180, 0.1)', color: '#ff41b4', 
    border: '1px solid #ff41b4', borderRadius: '12px', fontWeight: '900', fontSize: '16px', 
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
  },
  input: { 
    width: '100%', background: 'rgba(15, 5, 28, 0.8)', border: '2px solid #8a2be2', 
    borderRadius: '16px', padding: '14px 16px', fontSize: '15px', color: '#ffffff', 
    outline: 'none', boxSizing: 'border-box' 
  },
  progressBox: { display: 'flex', justifyContent: 'center', gap: '8px', margin: '15px 0 25px 0' },
  progressStep: (active) => ({ 
    width: '40px', height: '6px', 
    background: active ? 'linear-gradient(90deg, #ff1493, #00f0ff)' : 'rgba(255, 255, 255, 0.1)', 
    borderRadius: '10px', boxShadow: active ? '0 0 10px #00f0ff' : 'none', transition: 'all 0.3s ease' 
  }),
  taskCard: {
    background: 'linear-gradient(145deg, #10061e, #1a0b33)',
    border: '1.5px solid rgba(138, 43, 226, 0.5)', borderRadius: '20px', padding: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    marginBottom: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 2px 10px rgba(138, 43, 226, 0.1)',
  },
  taskIconBox: {
    width: '48px', height: '48px', borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(138, 43, 226, 0.2))',
    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 240, 255, 0.3)'
  },
  taskButton: {
    background: 'linear-gradient(180deg, #ffe600, #ffaa00)', color: '#050214', border: 'none', 
    borderRadius: '14px', padding: '10px 14px', fontWeight: '900', fontSize: '13px', 
    boxShadow: '0 4px 0 #cc8800, 0 6px 15px rgba(255, 230, 0, 0.3)', cursor: 'pointer', whiteSpace: 'nowrap'
  },
  taskButtonDisabled: {
    background: '#2b0b47', color: '#00f0ff', border: '1px solid #8a2be2',
    borderRadius: '14px', padding: '10px 14px', fontWeight: '900', fontSize: '13px', whiteSpace: 'nowrap'
  }
};

const TaskIcons = {
  bot: (color) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" /></svg>,
  group: (color) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  channel: (color) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>,
  link: (color) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
};

const TASK_TYPES = [
  { id: 'bot', icon: TaskIcons.bot('#00f0ff'), title: 'Bot o Mini App', desc: 'La gente abre tu bot', color: '#00f0ff', autoName: 'Iniciar Bot' },
  { id: 'group', icon: TaskIcons.group('#00ffaa'), title: 'Miembros de grupo', desc: 'La gente entra en tu grupo', color: '#00ffaa', autoName: 'Unirse al Grupo' },
  { id: 'channel', icon: TaskIcons.channel('#ffe600'), title: 'Suscriptores', desc: 'La gente se suscribe al canal', color: '#ffe600', autoName: 'Suscribirse al Canal' },
  { id: 'link', icon: TaskIcons.link('#ff41b4'), title: 'Visitas a Enlace', desc: 'La gente abre tu enlace', color: '#ff41b4', autoName: 'Visitar Enlace' }
];

export default function AdsTab({ userData, setUserData }) {
  const [view, setView] = useState('list'); // 'list' | 'activity' | 'wizard'
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState(null);

  const [taskType, setTaskType] = useState(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [botToken, setBotToken] = useState('');
  const [completions, setCompletions] = useState(100);
  const [reward, setReward] = useState(0.1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const balance = Number(userData?.balance || 0);
  const totalCost = Number((completions * reward).toFixed(2));

  useEffect(() => {
    if (userData?.id && view === 'list') fetchTasks();
  }, [userData?.id, view]);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const data = await botApi.getTasks(userData?.id);
      if (data && data.success) setTasks(data.tasks || []);
    } catch (e) {
      console.error("Error al cargar tareas:", e);
    } finally {
      setLoadingTasks(false);
    }
  };

  const stepsFlow = taskType === 'bot' ? ['type', 'url', 'token', 'budget'] : ['type', 'url', 'budget'];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStepId = stepsFlow[currentStepIndex];
  const totalSteps = stepsFlow.length;

  const nextStep = () => setCurrentStepIndex(prev => Math.min(prev + 1, totalSteps - 1));
  const prevStep = () => setCurrentStepIndex(prev => Math.max(prev - 1, 0));

  const handleVerifyUrl = async () => {
    const val = targetUrl.trim();
    if (!val) return toast.error("Ingresa un enlace.");
    
    const isTelegramLink = val.startsWith('@') || val.includes('t.me/') || val.includes('telegram.me/');

    if (taskType === 'group' || taskType === 'channel') {
      if (!isTelegramLink) return toast.error("Debe ser un enlace válido de Telegram.");
      
      setIsVerifying(true);
      const tid = toast.loading("Verificando administrador...");
      try {
        const res = await botApi.verifyBotAdmin(val);
        if (res.success) {
          toast.success("¡El bot está configurado como admin!", { id: tid });
          nextStep();
        } else {
          toast.error("El bot no es admin de este chat. Añádelo y reintenta.", { id: tid });
        }
      } catch (e) {
        toast.error("Error al verificar el enlace.", { id: tid });
      } finally {
        setIsVerifying(false);
      }
    } else {
      nextStep();
    }
  };

  const handleCreateTask = async () => {
    if (balance < totalCost) return toast.error(`Saldo insuficiente.`);
    setIsCreating(true);
    const tid = toast.loading("Publicando tarea...");

    const fixedTitle = TASK_TYPES.find(t => t.id === taskType)?.autoName || 'Nueva Tarea';

    try {
      const res = await botApi.createTask({
        creator_id: userData?.id, type: taskType, title: fixedTitle,
        url: targetUrl, bot_token: botToken || null,
        completions_total: completions, reward: reward
      });
      if (!res.success) throw new Error(res.error);
      if (res.balance !== undefined) setUserData(prev => ({ ...prev, balance: res.balance }));
      toast.success("¡Campaña activada con éxito!", { id: tid });
      
      // Reiniciar Wizard
      setTaskType(null); setTargetUrl(''); setBotToken(''); setCompletions(100); setReward(0.1);
      setCurrentStepIndex(0); setView('list');
    } catch (err) {
      toast.error(err.message || "Error al procesar la campaña.", { id: tid });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDoTask = async (task) => {
    try {
      let finalUrl = task.url.trim();
      if (finalUrl.startsWith('@')) finalUrl = `https://t.me/${finalUrl.substring(1)}`;
      else if (!finalUrl.startsWith('http')) finalUrl = `https://${finalUrl}`;

      if (finalUrl.includes('t.me') || finalUrl.includes('telegram.me')) WebApp.openTelegramLink(finalUrl); 
      else WebApp.openLink(finalUrl, { try_instant_view: true }); 

      setCompletingTaskId(task.id);
      const tid = toast.loading("Validando acción en la red...");

      setTimeout(async () => {
        try {
          const res = await botApi.completeTask(userData?.id, task.id);
          if (res.success) {
            toast.success(`¡Completado! +${res.reward} CLICK`, { id: tid });
            if (res.balance !== undefined) setUserData(prev => ({ ...prev, balance: res.balance }));
            fetchTasks(); 
          } else {
            toast.error(res.error || "No validado. Asegúrate de completar la tarea.", { id: tid });
          }
        } catch (e) {
          toast.error("Error de conexión al validar.", { id: tid });
        } finally {
          setCompletingTaskId(null);
        }
      }, 5000);
    } catch (e) { setCompletingTaskId(null); }
  };

  const renderInstructionText = () => {
    if (taskType === 'bot') return "Usa tu enlace de Telegram para bots o Mini Apps (ej. @MiBot o https://t.me/MiBot).";
    if (taskType === 'group') return "Ingresa el enlace público de tu grupo (ej. @MiGrupo). Nuestro bot debe ser administrador.";
    if (taskType === 'channel') return "Ingresa el enlace público de tu canal (ej. @MiCanal). Nuestro bot debe ser administrador.";
    return "Ingresa un enlace válido para llevar tráfico hacia tu contenido (ej. https://x.com/post o https://t.me/MiPost).";
  };

  return (
    <div style={{ color: '#ffffff', paddingBottom: '20px' }}>

      {/* NAVEGACIÓN SUPERIOR (TAREAS / ACTIVIDAD) */}
      {(view === 'list' || view === 'activity') && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => setView('list')} 
            style={{ flex: 1, padding: '12px', borderRadius: '16px', fontWeight: '900', fontSize: '13px', border: 'none', cursor: 'pointer', transition: '0.2s',
              background: view === 'list' ? 'linear-gradient(90deg, #00f0ff, #0088ff)' : 'rgba(255,255,255,0.05)',
              color: view === 'list' ? '#050214' : '#00f0ff',
              boxShadow: view === 'list' ? '0 4px 15px rgba(0,240,255,0.3)' : 'none', letterSpacing: '0.5px'
            }}>
            ⚡ MERCADO
          </button>
          <button 
            onClick={() => setView('activity')} 
            style={{ flex: 1, padding: '12px', borderRadius: '16px', fontWeight: '900', fontSize: '13px', border: 'none', cursor: 'pointer', transition: '0.2s',
              background: view === 'activity' ? 'linear-gradient(90deg, #ff1493, #8a2be2)' : 'rgba(255,255,255,0.05)',
              color: view === 'activity' ? '#fff' : '#ff41b4',
              boxShadow: view === 'activity' ? '0 4px 15px rgba(255,20,147,0.3)' : 'none', letterSpacing: '0.5px'
            }}>
            📜 ACTIVIDAD
          </button>
        </div>
      )}

      {/* VISTA: LISTA DE TAREAS */}
      {view === 'list' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 5px' }}>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>Ganar CLICK</h4>
            <button onClick={fetchTasks} style={{ background: 'transparent', border: 'none', color: '#ff99dd', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔄 Actualizar</button>
          </div>

          {loadingTasks ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#00f0ff', fontSize: '14px', fontWeight: 'bold' }}>Sincronizando tareas...</div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🏜️</span>
              <p style={{ color: '#ff99dd', fontSize: '13px', fontWeight: 'bold', margin: 0, lineHeight: '1.5' }}>
                No hay tareas comunitarias activas.<br/>¡Crea la primera y recibe todo el tráfico!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tasks.map((task) => (
                <div key={task.id} style={neon.taskCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={neon.taskIconBox}>{TaskIcons[task.type] ? TaskIcons[task.type]('#00f0ff') : TaskIcons.link('#00f0ff')}</div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: '900', letterSpacing: '0.3px' }}>{task.title}</div>
                      <div style={{ color: '#00f0ff', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>
                        {task.completions_done} / {task.completions_total} completadas
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDoTask(task)} disabled={completingTaskId === task.id}
                    style={completingTaskId === task.id ? neon.taskButtonDisabled : neon.taskButton}
                  >
                    {completingTaskId === task.id ? 'ESPERANDO...' : `+${Number(task.reward).toFixed(2)} CLICK`}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* BOTÓN INFERIOR CREAR TAREA */}
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => setView('wizard')} style={neon.btnSecondary}>
              + CREAR CAMPAÑA DE TRÁFICO
            </button>
          </div>
        </div>
      )}

      {/* VISTA: ACTIVIDAD */}
      {view === 'activity' && (
        <div className="fade-in">
          <div style={neon.card}>
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: '46px', marginBottom: '10px', filter: 'drop-shadow(0 0 10px rgba(255, 65, 180, 0.5))' }}>📜</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#ff41b4', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase' }}>Registro de Actividad</h3>
              <p style={{ color: '#ff99dd', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                Aquí aparecerán las tareas que has completado y las campañas que has creado.
              </p>
              <div style={{ padding: '16px', background: 'rgba(15, 5, 28, 0.8)', borderRadius: '14px', border: '1px dashed #8a2be2', color: '#888', fontSize: '12px', fontWeight: 'bold' }}>
                No hay actividad reciente.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: WIZARD DE CREACIÓN DE TAREAS */}
      {view === 'wizard' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <button onClick={() => { setView('list'); setTaskType(null); setCurrentStepIndex(0); }} style={{ background: 'transparent', border: 'none', color: '#ff1493', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>✕ CANCELAR</button>
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#00f0ff', letterSpacing: '1px' }}>PASO {currentStepIndex + 1} DE {totalSteps}</div>
          </div>
          <div style={neon.progressBox}>{stepsFlow.map((step, idx) => <div key={idx} style={neon.progressStep(idx <= currentStepIndex)} />)}</div>

          {currentStepId === 'type' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', marginBottom: '16px', textTransform: 'uppercase' }}>¿Qué deseas impulsar?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {TASK_TYPES.map((type) => (
                  <div key={type.id} onClick={() => { setTaskType(type.id); nextStep(); }}
                    style={{ ...neon.cardInteractive, borderColor: taskType === type.id ? type.color : '#8a2be2', background: taskType === type.id ? `linear-gradient(135deg, ${type.color}22, rgba(18, 7, 36, 0.9))` : neon.cardInteractive.background }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>{type.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px' }}>{type.title}</div>
                      <div style={{ color: '#ff99dd', fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>{type.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStepId === 'url' && (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <button onClick={prevStep} style={{ background: 'transparent', border: 'none', color: '#00f0ff', fontSize: '20px', cursor: 'pointer' }}>◀</button>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', margin: 0, textTransform: 'uppercase' }}>Configurar Destino</h3>
              </div>
              <div style={neon.card}>
                <p style={{ color: '#ff99dd', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4', fontWeight: 'bold' }}>{renderInstructionText()}</p>
                <input style={neon.input} placeholder="@usuario o https://t.me/..." value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
                {(taskType === 'group' || taskType === 'channel') && (
                  <div style={{ background: 'rgba(255, 65, 180, 0.1)', border: '1px dashed #ff41b4', padding: '12px', borderRadius: '14px', marginTop: '16px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#fff', fontWeight: 'bold', lineHeight: '1.5' }}>⚠️ Debes añadir nuestro Bot Oficial como <span style={{color:'#ff41b4'}}>Administrador</span> en tu grupo/canal para verificar que los usuarios realmente se unan.</p>
                  </div>
                )}
              </div>
              <button onClick={handleVerifyUrl} disabled={isVerifying} style={neon.btnPrimary}>
                {isVerifying ? 'VERIFICANDO RED...' : 'VALIDAR Y CONTINUAR ➔'}
              </button>
            </div>
          )}

          {currentStepId === 'token' && (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <button onClick={prevStep} style={{ background: 'transparent', border: 'none', color: '#00f0ff', fontSize: '20px', cursor: 'pointer' }}>◀</button>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', margin: 0, textTransform: 'uppercase' }}>Token del Bot</h3>
              </div>
              <div style={{...neon.card, borderColor: '#ff41b4'}}>
                <p style={{ color: '#fff', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5', fontWeight: 'bold' }}>
                  <span style={{ color: '#00f0ff' }}>Opcional.</span> Ingresa el Token HTTP API de tu bot para validar de forma exacta si el usuario inició el bot, evitando fraudes.
                </p>
                <input style={{...neon.input, borderColor: '#ff41b4'}} placeholder="Ej: 123456:ABC-DEF1234..." value={botToken} onChange={(e) => setBotToken(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={nextStep} style={{...neon.btnSecondary, flex: 1, border: '1px solid #8a2be2', color: '#8a2be2'}}>OMITIR</button>
                <button onClick={nextStep} style={{...neon.btnPrimary, flex: 1}}>CONTINUAR ➔</button>
              </div>
            </div>
          )}

          {currentStepId === 'budget' && (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <button onClick={prevStep} style={{ background: 'transparent', border: 'none', color: '#00f0ff', fontSize: '20px', cursor: 'pointer' }}>◀</button>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', margin: 0, textTransform: 'uppercase' }}>Presupuesto</h3>
              </div>
              <div style={{...neon.card, padding: '16px'}}>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {[10, 50, 100, 500].map(val => (
                    <button key={val} onClick={() => setCompletions(val)}
                      style={{ flex: 1, padding: '10px 0', fontSize: '12px', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                        background: completions === val ? '#00f0ff' : 'rgba(15, 5, 28, 0.8)', color: completions === val ? '#050214' : '#fff', 
                        border: completions === val ? 'none' : '1px solid #8a2be2', boxShadow: completions === val ? '0 0 10px rgba(0, 240, 255, 0.5)' : 'none' }}>
                      {val}
                    </button>
                  ))}
                </div>

                <div style={{ background: 'rgba(15, 5, 28, 0.8)', borderRadius: '16px', padding: '14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #3a1a5c' }}>
                  <span style={{ fontSize: '12px', color: '#ff99dd', fontWeight: '900', textTransform: 'uppercase' }}>Total de Usuarios</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setCompletions(p => Math.max(5, p - 5))} style={neon.btnAction}>-</button>
                    <span style={{ fontWeight: '900', fontSize: '18px', color: '#fff', width: '40px', textAlign: 'center' }}>{completions}</span>
                    <button onClick={() => setCompletions(p => p + 5)} style={neon.btnAction}>+</button>
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 5, 28, 0.8)', borderRadius: '16px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #3a1a5c' }}>
                  <span style={{ fontSize: '12px', color: '#ff99dd', fontWeight: '900', textTransform: 'uppercase' }}>Pago x Usuario</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setReward(p => Math.max(0.1, Number((p - 0.1).toFixed(1))))} style={neon.btnAction}>-</button>
                    <span style={{ fontWeight: '900', fontSize: '18px', color: '#ffe600', width: '40px', textAlign: 'center' }}>{reward.toFixed(1)}</span>
                    <button onClick={() => setReward(p => Number((p + 0.1).toFixed(1)))} style={neon.btnAction}>+</button>
                  </div>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(90deg, #ff1493, #8a2be2)', borderRadius: '20px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(255, 20, 147, 0.3)', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#fff', fontWeight: '900', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inversión Total</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff', textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>{totalCost.toFixed(2)} CLICK</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#ff99dd', fontWeight: 'bold' }}>
                  Tu Saldo:<br/><strong style={{color: balance >= totalCost ? '#00ffaa' : '#ffe600', fontSize: '14px'}}>{balance.toFixed(2)} CLICK</strong>
                </div>
              </div>

              <button onClick={handleCreateTask} disabled={isCreating} style={{ ...neon.btnPrimary, background: 'linear-gradient(180deg, #00ffaa, #00bb77)', boxShadow: '0 6px 0 #007744, 0 10px 20px rgba(0, 255, 170, 0.4)' }}>
                {isCreating ? 'AUTORIZANDO...' : '⚡ CREAR Y PUBLICAR'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
