import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';
import { botApi } from '../api/botApi';

const neon = {
  card: {
    background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.85), rgba(20, 8, 38, 0.95))',
    border: '2px solid #00f0ff',
    borderRadius: '24px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 8px 24px rgba(0, 240, 255, 0.15)'
  },
  cardInteractive: {
    background: 'linear-gradient(135deg, rgba(38, 14, 66, 0.9), rgba(18, 7, 36, 0.9))',
    border: '2px solid #8a2be2',
    borderRadius: '20px',
    padding: '16px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)',
    transition: 'all 0.2s ease'
  },
  btnPrimary: {
    width: '100%', padding: '14px', background: 'linear-gradient(180deg, #00f0ff 0%, #0099ff 100%)',
    color: '#050214', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px',
    cursor: 'pointer', boxShadow: '0 6px 0 #0066aa, 0 10px 20px rgba(0, 240, 255, 0.4)',
    textTransform: 'uppercase', letterSpacing: '0.5px'
  },
  btnSecondary: {
    width: '100%', padding: '14px', background: 'transparent',
    color: '#ff99dd', border: '2px solid #ff41b4', borderRadius: '16px', fontWeight: '900', fontSize: '15px',
    cursor: 'pointer', boxShadow: '0 0 15px rgba(255, 65, 180, 0.2)', textTransform: 'uppercase'
  },
  btnAction: {
    padding: '8px 16px', background: 'rgba(255, 65, 180, 0.1)', color: '#ff41b4',
    border: '1px solid #ff41b4', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer'
  },
  input: {
    width: '100%', background: 'rgba(15, 5, 28, 0.8)', border: '2px solid #8a2be2', borderRadius: '16px',
    padding: '14px 16px', fontSize: '15px', color: '#ffffff', outline: 'none', boxSizing: 'border-box'
  },
  progressBox: { display: 'flex', justifyContent: 'center', gap: '8px', margin: '15px 0 25px 0' },
  progressStep: (active) => ({
    width: '40px', height: '6px',
    background: active ? 'linear-gradient(90deg, #ff1493, #00f0ff)' : 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px', boxShadow: active ? '0 0 10px #00f0ff' : 'none', transition: 'all 0.3s ease'
  })
};

// --- ICONOS VECTORIALES PROFESIONALES ---
const TaskIcons = {
  bot: (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8.01" y2="16" />
      <line x1="16" y1="16" x2="16.01" y2="16" />
    </svg>
  ),
  group: (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  channel: (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  ),
  link: (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
};

const TASK_TYPES = [
  { id: 'bot', icon: TaskIcons.bot('#00f0ff'), title: 'Bot o Mini App', desc: 'La gente abre tu bot', color: '#00f0ff' },
  { id: 'group', icon: TaskIcons.group('#00ffaa'), title: 'Miembros de grupo', desc: 'La gente entra en tu grupo', color: '#00ffaa' },
  { id: 'channel', icon: TaskIcons.channel('#ffe600'), title: 'Suscriptores de canal', desc: 'La gente se suscribe', color: '#ffe600' },
  { id: 'link', icon: TaskIcons.link('#ff41b4'), title: 'Visitas a un enlace', desc: 'La gente abre tu enlace', color: '#ff41b4' }
];

export default function AdsTab({ userData, setUserData }) {
  const [view, setView] = useState('list');
  
  // Lista de tareas activas reales
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState(null);

  // Estados del Wizard
  const [taskType, setTaskType] = useState(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [botToken, setBotToken] = useState('');
  const [taskName, setTaskName] = useState('');
  const [completions, setCompletions] = useState(100);
  const [reward, setReward] = useState(0.1);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const balance = Number(userData?.balance || 0);
  const totalCost = Number((completions * reward).toFixed(2));

  useEffect(() => {
    if (userData?.id) fetchTasks();
  }, [userData?.id]);

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

  const stepsFlow = taskType === 'bot' 
    ? ['type', 'url', 'token', 'name', 'budget'] 
    : ['type', 'url', 'name', 'budget'];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStepId = stepsFlow[currentStepIndex];
  const totalSteps = stepsFlow.length;

  const nextStep = () => setCurrentStepIndex(prev => Math.min(prev + 1, totalSteps - 1));
  const prevStep = () => setCurrentStepIndex(prev => Math.max(prev - 1, 0));

  const handleVerifyUrl = async () => {
    if (!targetUrl.trim()) return toast.error("Por favor, ingresa un enlace válido.");
    
    if (taskType === 'group' || taskType === 'channel') {
      setIsVerifying(true);
      const tid = toast.loading("Verificando permisos de administrador...");
      setTimeout(() => {
        setIsVerifying(false);
        toast.success("¡Verificación completada!", { id: tid });
        nextStep();
      }, 1500);
    } else {
      nextStep();
    }
  };

  const handleCreateTask = async () => {
    if (balance < totalCost) return toast.error(`Saldo insuficiente. Tienes ${balance} PT y requieres ${totalCost} PT.`);

    setIsCreating(true);
    const tid = toast.loading("Registrando campaña en la red...");

    try {
      const res = await botApi.createTask({
        creator_id: userData?.id,
        type: taskType,
        title: taskName,
        url: targetUrl,
        bot_token: botToken || null,
        completions_total: completions,
        reward: reward
      });

      if (!res.success) throw new Error(res.error || "Error al crear la tarea.");
      if (res.balance !== undefined) setUserData(prev => ({ ...prev, balance: res.balance }));

      toast.success("¡Campaña activada y disponible para la comunidad!", { id: tid });

      setTaskType(null); setTargetUrl(''); setBotToken(''); setTaskName(''); setCompletions(100); setReward(0.1);
      setCurrentStepIndex(0);
      setView('list');
      fetchTasks();
    } catch (err) {
      toast.error(err.message || "No se pudo crear la campaña.", { id: tid });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDoTask = async (task) => {
    try {
      let finalUrl = task.url.trim();

      if (finalUrl.startsWith('@')) {
        finalUrl = `https://t.me/${finalUrl.substring(1)}`;
      } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }

      if (finalUrl.includes('t.me') || finalUrl.includes('telegram.me')) {
        WebApp.openTelegramLink(finalUrl); 
      } else {
        WebApp.openLink(finalUrl, { try_instant_view: true }); 
      }

      setCompletingTaskId(task.id);
      const tid = toast.loading("Verificando tarea...");

      setTimeout(async () => {
        try {
          const res = await botApi.completeTask(userData?.id, task.id);
          if (res.success) {
            toast.success(`¡Tarea completada! +${res.reward} PT`, { id: tid });
            if (res.balance !== undefined) setUserData(prev => ({ ...prev, balance: res.balance }));
            fetchTasks(); 
          } else {
            toast.error(res.error || "No se pudo validar la tarea.", { id: tid });
          }
        } catch (e) {
          toast.error("Error al procesar la recompensa.", { id: tid });
        } finally {
          setCompletingTaskId(null);
        }
      }, 3000);

    } catch (e) {
      setCompletingTaskId(null);
    }
  };

  const getTaskIcon = (type) => {
    const item = TASK_TYPES.find(t => t.id === type);
    return item ? item.icon : TaskIcons.link('#ffffff');
  };

  const renderWizardStep = () => {
    switch (currentStepId) {
      case 'type':
        return (
          <div className="fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', marginBottom: '16px' }}>
              ¿Qué quieres conseguir?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {TASK_TYPES.map((type) => (
                <div 
                  key={type.id} 
                  onClick={() => { setTaskType(type.id); nextStep(); }}
                  style={{
                    ...neon.cardInteractive,
                    borderColor: taskType === type.id ? type.color : '#8a2be2',
                    background: taskType === type.id ? `linear-gradient(135deg, ${type.color}22, rgba(18, 7, 36, 0.9))` : neon.cardInteractive.background
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                    {type.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: '900' }}>{type.title}</div>
                    <div style={{ color: '#ff99dd', fontSize: '12px' }}>{type.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'url':
        return (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <button onClick={prevStep} style={{ background: 'transparent', border: 'none', color: '#00f0ff', fontSize: '20px', cursor: 'pointer' }}>◀</button>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', margin: 0 }}>
                ¿A dónde los mandamos?
              </h3>
            </div>
            
            <div style={neon.card}>
              <p style={{ color: '#ff99dd', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
                {taskType === 'link' || taskType === 'bot' 
                  ? 'Pega un enlace válido. Para bots o Mini Apps, usa tu enlace de Telegram (https://t.me/...).' 
                  : 'Ingresa el usuario o enlace público (ej. @MiGrupo o https://t.me/MiGrupo).'}
              </p>
              
              <input 
                style={neon.input} 
                placeholder="@usuario o https://t.me/..." 
                value={targetUrl} 
                onChange={(e) => setTargetUrl(e.target.value)} 
              />

              {(taskType === 'group' || taskType === 'channel') && (
                <div style={{ background: 'rgba(255, 65, 180, 0.1)', border: '1px dashed #ff41b4', padding: '12px', borderRadius: '12px', marginTop: '16px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                    ⚠️ Añade el bot oficial de la app como administrador de tu {taskType === 'group' ? 'grupo' : 'canal'} para validar las entradas.
                  </p>
                </div>
              )}
            </div>

            <button onClick={handleVerifyUrl} disabled={isVerifying} style={neon.btnPrimary}>
              {isVerifying ? 'Verificando...' : 'VERIFICAR Y CONTINUAR ➔'}
            </button>
          </div>
        );

      case 'token':
        return (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <button onClick={prevStep} style={{ background: 'transparent', border: 'none', color: '#00f0ff', fontSize: '20px', cursor: 'pointer' }}>◀</button>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', margin: 0 }}>
                ¿Verificar de verdad?
              </h3>
            </div>

            <div style={{...neon.card, borderColor: '#ff41b4'}}>
              <p style={{ color: '#fff', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
                <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>Opcional.</span> Pega el Token de tu bot para comprobar si el usuario lo inició. Sin él, se acredita solo con abrir el enlace.
              </p>
              <input 
                style={{...neon.input, borderColor: '#ff41b4'}} 
                placeholder="Token HTTP API (Opcional)" 
                value={botToken} 
                onChange={(e) => setBotToken(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={nextStep} style={{...neon.btnSecondary, flex: 1}}>OMITIR</button>
              <button onClick={nextStep} style={{...neon.btnPrimary, flex: 1}}>CONTINUAR</button>
            </div>
          </div>
        );

      case 'name':
        return (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <button onClick={prevStep} style={{ background: 'transparent', border: 'none', color: '#00f0ff', fontSize: '20px', cursor: 'pointer' }}>◀</button>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', margin: 0 }}>
                Ponle un nombre
              </h3>
            </div>

            <div style={neon.card}>
              <p style={{ color: '#ff99dd', fontSize: '13px', marginBottom: '16px' }}>
                Es lo que la gente verá en el listado de tareas disponibles.
              </p>
              <input 
                style={neon.input} 
                placeholder="Ej: Únete a mi canal VIP..." 
                value={taskName} 
                maxLength={45}
                onChange={(e) => setTaskName(e.target.value)} 
              />
            </div>

            <button onClick={() => { if(!taskName.trim()) toast.error("El nombre es obligatorio"); else nextStep(); }} style={neon.btnPrimary}>
              CONTINUAR ➔
            </button>
          </div>
        );

      case 'budget':
        return (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <button onClick={prevStep} style={{ background: 'transparent', border: 'none', color: '#00f0ff', fontSize: '20px', cursor: 'pointer' }}>◀</button>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', margin: 0 }}>
                ¿Cuánto tráfico?
              </h3>
            </div>

            <div style={{...neon.card, padding: '16px'}}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[10, 50, 100, 500].map(val => (
                  <button 
                    key={val} 
                    onClick={() => setCompletions(val)}
                    style={{
                      flex: 1, padding: '8px 0', fontSize: '12px', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer',
                      background: completions === val ? '#00f0ff' : '#1a0b2e',
                      color: completions === val ? '#000' : '#fff',
                      border: completions === val ? 'none' : '1px solid #8a2be2'
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <div style={{ background: '#120722', borderRadius: '14px', padding: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #3a1a5c' }}>
                <span style={{ fontSize: '12px', color: '#ff99dd', fontWeight: 'bold' }}>Completaciones</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => setCompletions(p => Math.max(5, p - 5))} style={neon.btnAction}>-</button>
                  <span style={{ fontWeight: '900', fontSize: '16px', color: '#fff', width: '40px', textAlign: 'center' }}>{completions}</span>
                  <button onClick={() => setCompletions(p => p + 5)} style={neon.btnAction}>+</button>
                </div>
              </div>

              <div style={{ background: '#120722', borderRadius: '14px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #3a1a5c' }}>
                <span style={{ fontSize: '12px', color: '#ff99dd', fontWeight: 'bold' }}>PT por completar</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => setReward(p => Math.max(0.1, Number((p - 0.1).toFixed(1))))} style={neon.btnAction}>-</button>
                  <span style={{ fontWeight: '900', fontSize: '16px', color: '#ffe600', width: '40px', textAlign: 'center' }}>{reward.toFixed(1)}</span>
                  <button onClick={() => setReward(p => Number((p + 0.1).toFixed(1)))} style={neon.btnAction}>+</button>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(90deg, #ff1493, #8a2be2)',
              borderRadius: '18px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 4px 15px rgba(255, 20, 147, 0.3)', marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', opacity: 0.8 }}>PRESUPUESTO TOTAL</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>{totalCost} PT</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#ff99dd' }}>
                Tu Saldo:<br/><strong style={{color: balance >= totalCost ? '#00ffaa' : '#ff41b4'}}>{balance.toFixed(2)} PT</strong>
              </div>
            </div>

            <button onClick={handleCreateTask} disabled={isCreating} style={{ ...neon.btnPrimary, background: 'linear-gradient(180deg, #00ffaa, #00bb77)', boxShadow: '0 6px 0 #007744' }}>
              {isCreating ? 'PROCESANDO PAGO...' : '⚡ CREAR Y PAGAR'}
            </button>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div style={{ color: '#ffffff', paddingBottom: '20px' }}>
      
      {view === 'list' && (
        <div className="fade-in">
          <div style={{...neon.card, borderColor: '#00f0ff', padding: '22px 18px', textAlign: 'center'}}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              {TaskIcons.channel('#00f0ff')}
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#00f0ff', fontSize: '18px', fontWeight: '900' }}>
              ¿Necesitas tráfico masivo?
            </h3>
            <p style={{ color: '#ff99dd', fontSize: '13px', lineHeight: '1.5', marginBottom: '18px' }}>
              Crea una campaña y consigue visitas o miembros reales en minutos.<br/>
              <span style={{ color: '#ffe600', fontWeight: 'bold' }}>✨ Las tareas pagadas salen primero</span>
            </p>
            <button onClick={() => setView('wizard')} style={{...neon.btnPrimary, background: 'linear-gradient(180deg, #ff1493, #8a2be2)', boxShadow: '0 6px 0 #4a157a'}}>
              + CREAR NUEVA TAREA
            </button>
          </div>

          <div style={{...neon.card, borderColor: '#3a1a5c', background: 'rgba(20, 8, 38, 0.6)'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, color: '#00f0ff', fontSize: '15px', fontWeight: '900' }}>
                ⚡ Tareas Disponibles ({tasks.length})
              </h4>
              <button onClick={fetchTasks} style={{ background: 'transparent', border: 'none', color: '#ff99dd', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                🔄 Actualizar
              </button>
            </div>

            {loadingTasks ? (
              <div style={{ textAlign: 'center', padding: '25px 0', color: '#ff99dd', fontSize: '13px', fontWeight: 'bold' }}>
                Cargando tareas activas...
              </div>
            ) : tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '25px 0', color: '#777', fontSize: '13px' }}>
                <span style={{ fontSize: '30px', display: 'block', marginBottom: '8px' }}>🏜️</span>
                No hay tareas activas disponibles por el momento.<br/>¡Crea la primera para conseguir tráfico!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    style={{
                      backgroundColor: '#120822',
                      border: '1px solid #3d1b63',
                      borderRadius: '16px',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px' }}>
                        {getTaskIcon(task.type)}
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{task.title}</div>
                        <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
                          Cupos: {task.completions_done}/{task.completions_total}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDoTask(task)}
                      disabled={completingTaskId === task.id}
                      style={{
                        background: 'linear-gradient(180deg, #00ffaa, #00aa77)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#050214',
                        fontWeight: '900',
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 3px 0 #006644',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {completingTaskId === task.id ? 'VERIFICANDO...' : `+${task.reward} PT`}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'wizard' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <button onClick={() => { setView('list'); setTaskType(null); setCurrentStepIndex(0); }} style={{ background: 'transparent', border: 'none', color: '#ff41b4', fontWeight: 'bold', cursor: 'pointer' }}>
              ✕ Cancelar
            </button>
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#00f0ff', letterSpacing: '1px' }}>
              PASO {currentStepIndex + 1} DE {totalSteps}
            </div>
          </div>
          
          <div style={neon.progressBox}>
            {stepsFlow.map((step, idx) => (
              <div key={idx} style={neon.progressStep(idx <= currentStepIndex)} />
            ))}
          </div>

          {renderWizardStep()}
        </div>
      )}

    </div>
  );
}
