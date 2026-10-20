import { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';

const ADMIN_ID = '8968109534'; 

const neon = {
  card: { background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.85), rgba(20, 8, 38, 0.95))', border: '2px solid #00f0ff', borderRadius: '24px', padding: '20px', marginBottom: '16px', boxShadow: '0 8px 24px rgba(0, 240, 255, 0.15)' },
  cardInteractive: { background: 'linear-gradient(135deg, rgba(38, 14, 66, 0.9), rgba(18, 7, 36, 0.9))', border: '2px solid #8a2be2', borderRadius: '20px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)', transition: 'all 0.2s ease' },
  btnPrimary: { width: '100%', padding: '14px', background: 'linear-gradient(180deg, #00f0ff 0%, #0099ff 100%)', color: '#050214', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 0 #0066aa, 0 10px 20px rgba(0, 240, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  btnSecondary: { width: '100%', padding: '14px', background: 'transparent', color: '#ff99dd', border: '2px dashed #ff41b4', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 0 15px rgba(255, 65, 180, 0.2)', textTransform: 'uppercase' },
  input: { width: '100%', background: 'rgba(15, 5, 28, 0.8)', border: '2px solid #8a2be2', borderRadius: '16px', padding: '14px 16px', fontSize: '15px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
  progressBox: { display: 'flex', justifyContent: 'center', gap: '8px', margin: '15px 0 25px 0' },
  progressStep: (active) => ({ width: '40px', height: '6px', background: active ? 'linear-gradient(90deg, #ff1493, #00f0ff)' : 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', boxShadow: active ? '0 0 10px #00f0ff' : 'none', transition: 'all 0.3s ease' }),
  taskCard: { background: 'linear-gradient(145deg, #10061e, #1a0b33)', border: '1.5px solid rgba(138, 43, 226, 0.5)', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 2px 10px rgba(138, 43, 226, 0.1)' },
  taskIconBox: { width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(138, 43, 226, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 240, 255, 0.3)', flexShrink: 0 },
  taskButton: { background: 'linear-gradient(180deg, #ffe600, #ffaa00)', color: '#050214', border: 'none', borderRadius: '14px', padding: '10px 14px', fontWeight: '900', fontSize: '13px', boxShadow: '0 4px 0 #cc8800, 0 6px 15px rgba(255, 230, 0, 0.3)', cursor: 'pointer', whiteSpace: 'nowrap' },
  taskButtonRejoin: { background: 'transparent', color: '#ffe600', border: '2px solid #ffe600', borderRadius: '14px', padding: '10px 14px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' },
  taskButtonDisabled: { background: '#2b0b47', color: '#00f0ff', border: '1px solid #8a2be2', borderRadius: '14px', padding: '10px 14px', fontWeight: '900', fontSize: '13px', whiteSpace: 'nowrap', cursor: 'not-allowed' },
  taskButtonCheck: { background: 'linear-gradient(180deg, #00ffaa, #00bb77)', color: '#050214', border: 'none', borderRadius: '14px', padding: '10px 14px', fontWeight: '900', fontSize: '13px', boxShadow: '0 4px 0 #007744, 0 6px 15px rgba(0, 255, 170, 0.3)', cursor: 'pointer', whiteSpace: 'nowrap' },
  calcContainer: { background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.85), rgba(20, 8, 38, 0.95))', border: '2px solid #8a2be2', borderRadius: '24px', padding: '20px', color: '#ffffff', boxShadow: '0 8px 24px rgba(138, 43, 226, 0.15)' },
  pillButton: (active) => ({ flex: 1, padding: '10px 0', fontSize: '14px', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', background: active ? 'linear-gradient(90deg, #00f0ff, #0088ff)' : 'rgba(15, 5, 28, 0.8)', color: active ? '#050214' : '#ffffff', border: active ? 'none' : '1px solid #8a2be2', boxShadow: active ? '0 0 10px rgba(0, 240, 255, 0.5)' : 'none' }),
  label: { fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#ff99dd', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' },
  btnActionCalc: { width: '45px', height: '45px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', border: '2px solid #00f0ff', borderRadius: '12px', fontWeight: '900', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  inputCalc: { flex: 1, background: 'rgba(15, 5, 28, 0.8)', border: '2px solid #8a2be2', borderRadius: '12px', padding: '10px', fontSize: '18px', fontWeight: '900', color: '#fff', outline: 'none', boxSizing: 'border-box', textAlign: 'center' },
  summaryBox: { background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.1), rgba(138, 43, 226, 0.1))', border: '1px dashed #00f0ff', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', boxShadow: 'inset 0 0 10px rgba(0, 240, 255, 0.1)' },
  actionBtn: { width: '100%', padding: '16px', background: 'linear-gradient(180deg, #00f0ff 0%, #0099ff 100%)', color: '#050214', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '16px', boxShadow: '0 6px 0 #0066aa, 0 10px 20px rgba(0, 240, 255, 0.4)', cursor: 'pointer', transition: 'all 0.1s', textTransform: 'uppercase' }
};

const TaskIcons = {
  group: (color) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  channel: (color) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  bot: (color) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" /></svg>,
  promo: (color) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
};

const TASK_TYPES = [
  { id: 'bot', icon: TaskIcons.bot('#ffe600'), title: 'Bots & Mini Apps', desc: 'Usuarios inician tu bot o app', color: '#ffe600', autoName: 'Iniciar Bot/App' },
  { id: 'channel', icon: TaskIcons.channel('#00ffaa'), title: 'Canales & Grupos', desc: 'Suma miembros a tu comunidad', color: '#00ffaa', autoName: 'Unirse al Chat' },
  { id: 'promo', icon: TaskIcons.promo('#ff1493'), title: 'Vistas & Promos', desc: 'Consigue referidos o tráfico', color: '#ff1493', autoName: 'Visitar Promo' }
];

export default function AdsTab({ userData, setUserData }) {
  const [view, setView] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [fixedTasksLoading, setFixedTasksLoading] = useState(false);
  
  const [fixedCompleted, setFixedCompleted] = useState([]); 
  const [actualMembership, setActualMembership] = useState({ channel1: false, channel2: false });

  const [taskStatus, setTaskStatus] = useState({}); 
  const [countdown, setCountdown] = useState({});

  const [taskType, setTaskType] = useState(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [botToken, setBotToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [completions, setCompletions] = useState(100);
  const [rewardPerClick, setRewardPerClick] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('balance');

  const [checkoutView, setCheckoutView] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tempWallet, setTempWallet] = useState('');
  const [intentId, setIntentId] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [liveGramUsd, setLiveGramUsd] = useState(5.00);

  const balance = Number(userData?.balance || 0);
  const isAdmin = String(userData?.id) === ADMIN_ID;

  const apiHeaders = { 
    'Content-Type': 'application/json', 
    'X-Telegram-Init-Data': WebApp.initData || '' 
  };

  useEffect(() => {
    const fetchLivePrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
        const data = await res.json();
        if (data && data['the-open-network'] && data['the-open-network'].usd) {
          setLiveGramUsd(data['the-open-network'].usd);
        }
      } catch (error) {}
    };
    fetchLivePrice();
  }, []);

  const totalClicksCost = completions * rewardPerClick;
  const usdPrice = totalClicksCost * 0.0025;
  const gramPrice = (usdPrice / liveGramUsd).toFixed(2);
  const starsPrice = Math.ceil(usdPrice / 0.013);

  useEffect(() => {
    if (userData?.id && (view === 'list' || view === 'activity')) {
      fetchTasks();
      verifyActualMembership();
    }
  }, [userData?.id, view]);

  useEffect(() => {
    const activeTasks = Object.keys(taskStatus).filter(id => taskStatus[id] === 'waiting');
    if (activeTasks.length > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          const next = { ...prev };
          activeTasks.forEach(id => {
            if (next[id] > 1) next[id] -= 1;
            else { setTaskStatus(ts => ({ ...ts, [id]: 'ready' })); delete next[id]; }
          });
          return next;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [taskStatus]);

  const verifyActualMembership = async () => {
    try {
      const res = await fetch('/api', {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ action: 'check-channels', userId: userData.id })
      });
      const data = await res.json();
      if (data.success) {
        setActualMembership({ channel1: data.channel1, channel2: data.channel2 });
      }
    } catch (e) {}
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch('/api', {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ action: 'get-tasks', userId: userData.id })
      });
      const data = await res.json();
      if (data && data.success) {
        setTasks(data.tasks || []);
        setFixedCompleted(data.fixed_completed || []); 
      }
    } catch (e) { console.error(e); } finally { setLoadingTasks(false); }
  };

  const stepsFlow = taskType === 'bot' ? ['type', 'url', 'token', 'budget'] : ['type', 'url', 'budget'];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStepId = stepsFlow[currentStepIndex];
  const totalSteps = stepsFlow.length;

  const nextStep = () => setCurrentStepIndex(prev => Math.min(prev + 1, totalSteps - 1));
  const prevStep = () => setCurrentStepIndex(prev => Math.max(prev - 1, 0));

  const handleVerifyUrl = async () => {
    let val = targetUrl.trim();
    if (!val) return toast.error("Ingresa tu enlace.");

    if (taskType === 'channel' || taskType === 'bot') {
      const isTelegramLink = val.startsWith('@') || val.startsWith('t.me/') || val.startsWith('https://t.me/');
      if (!isTelegramLink) return toast.error("El enlace debe empezar con @, t.me/ o https://t.me/");
    }

    if (taskType === 'channel') {
      if (val.includes('+') || val.includes('joinchat')) return toast.error("No se aceptan enlaces privados.");
      setIsVerifying(true);
      const tid = toast.loading("Verificando permisos...");
      try {
        const res = await fetch('/api', {
          method: 'POST', headers: apiHeaders,
          body: JSON.stringify({ action: 'verify-admin', url: val })
        });
        const data = await res.json();
        if (data.success) { toast.success("¡Bot es admin!", { id: tid }); nextStep(); } 
        else { toast.error("El bot no es admin. Añádelo y reintenta.", { id: tid }); }
      } catch (e) { toast.error("Error al verificar.", { id: tid }); } finally { setIsVerifying(false); }
    } else if (taskType === 'bot') {
      // 🔥 VALIDACIÓN ESTRICTA DE BOTS
      if (!val.toLowerCase().includes('bot')) return toast.error("El enlace debe pertenecer a un Bot.");
      if (!val.includes('start=') && !val.includes('startapp=')) return toast.error("Los enlaces de bots deben incluir ?start= (o ?startapp= para Mini Apps)");
      toast.success("¡Bot detectado!"); nextStep();
    } else {
      if (!val.startsWith('http') && !val.startsWith('@')) val = 'https://' + val;
      setTargetUrl(val); nextStep();
    }
  };

  const handleCheckout = () => {
    if (paymentMethod === 'balance') {
      if (balance < totalClicksCost) return toast.error(`Saldo insuficiente. Necesitas ${totalClicksCost} CLICK.`);
      handleCreateTaskPaid();
    } else if (paymentMethod === 'gram') generateGramWallet();
    else if (paymentMethod === 'stars') handleStarsPayment();
  };

  const handleCreateTaskPaid = async () => {
    setIsGenerating(true);
    const tid = toast.loading("Publicando campaña...");
    const fixedTitle = TASK_TYPES.find(t => t.id === taskType)?.autoName || 'Nueva Tarea';

    try {
      const res = await fetch('/api', {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ creator_id: userData?.id, action: 'create-task', type: taskType, title: fixedTitle, url: targetUrl, bot_token: botToken || null, completions_total: completions, reward: rewardPerClick })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.balance !== undefined) setUserData(prev => ({ ...prev, balance: data.balance }));
      toast.success("¡Campaña activada con éxito!", { id: tid });
      setTaskType(null); setTargetUrl(''); setBotToken(''); setCompletions(100); setCurrentStepIndex(0); setCheckoutView(false); setView('activity');
    } catch (err) { toast.error(err.message || "Error al procesar.", { id: tid }); } finally { setIsGenerating(false); }
  };

  const generateGramWallet = async () => {
    setIsGenerating(true);
    const tid = toast.loading("Generando billetera...");
    try {
      const res = await fetch('/api', {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ action: 'generate-payment-wallet', userId: userData.id, packageId: 0, price: gramPrice, clicks: totalClicksCost })
      });
      const data = await res.json();
      if (data.success) { setTempWallet(data.wallet); setIntentId(data.intentId); toast.dismiss(tid); setCheckoutView(true); }
    } catch (e) { toast.error("Error conectando a la blockchain.", { id: tid }); } finally { setIsGenerating(false); }
  };

  const copyWallet = () => { navigator.clipboard.writeText(tempWallet); toast.success("Billetera copiada."); };
  const openTonkeeper = () => { try { WebApp.openLink(`ton://transfer/${tempWallet}?amount=${gramPrice * 1e9}`); } catch (e) { toast.error("Billetera no instalada."); } };

  const handleVerifyGramPayment = async () => {
    const tid = toast.loading("Verificando en la blockchain...");
    try {
      const res = await fetch('/api', {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ action: 'verify-crypto-payment', userId: userData.id, intentId: intentId, clicks: totalClicksCost })
      });
      const data = await res.json();
      if (data.success) { toast.success(`Pago Exitoso.`, { id: tid }); await handleCreateTaskPaid(); }
      else throw new Error(data.error);
    } catch (e) { toast.error(e.message || "Aún no detectamos el pago.", { id: tid, duration: 6000 }); }
  };

  const handleStarsPayment = async () => {
    setIsGenerating(true);
    const tid = toast.loading("Generando factura...");
    try {
      const res = await fetch('/api', {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ action: 'generate-stars-invoice', userId: userData.id, packageId: 0, stars: starsPrice, clicks: totalClicksCost })
      });
      const data = await res.json();
      if (data.success) {
        toast.dismiss(tid);
        WebApp.openInvoice(data.invoiceUrl, async (status) => {
          if (status === 'paid') {
            const confirmTid = toast.loading("Confirmando...");
            try {
              const confirmRes = await fetch('/api', {
                method: 'POST', headers: apiHeaders,
                body: JSON.stringify({ action: 'confirm-stars-payment', userId: userData.id, intentId: data.intentId, clicks: totalClicksCost })
              });
              const confirmData = await confirmRes.json();
              if (confirmData.success) { toast.success(`Pago exitoso.`, { id: confirmTid }); await handleCreateTaskPaid(); }
            } catch (err) { toast.error("Error al acreditar.", { id: confirmTid }); }
          } else { toast.error("Pago no completado."); }
        });
      }
    } catch (e) { toast.error("No se pudo generar factura.", { id: tid }); } finally { setIsGenerating(false); }
  };

  const cancelCheckout = () => { setCheckoutView(false); setIntentId(null); setTempWallet(''); };

  const handleStartTask = (task) => {
    try {
      let finalUrl = task.url.trim();
      if (finalUrl.startsWith('@')) finalUrl = `https://t.me/${finalUrl.substring(1)}`;
      else if (!finalUrl.startsWith('http')) finalUrl = `https://${finalUrl}`;

      if (finalUrl.includes('t.me') || finalUrl.includes('telegram.me')) WebApp.openTelegramLink(finalUrl);
      else WebApp.openLink(finalUrl, { try_instant_view: true });

      setTaskStatus(prev => ({ ...prev, [task.id]: 'waiting' }));
      setCountdown(prev => ({ ...prev, [task.id]: 5 }));
    } catch (e) { toast.error("Error al abrir el enlace."); }
  };

  const handleCheckTask = async (task) => {
    const tid = toast.loading("Verificando tarea...");
    setTaskStatus(prev => ({ ...prev, [task.id]: 'verifying' }));
    try {
      const res = await fetch('/api', {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ action: 'complete-task', userId: userData.id, taskId: task.id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`+${data.reward} CLICK`, { id: tid });
        if (data.balance !== undefined) setUserData(prev => ({ ...prev, balance: data.balance }));
        setTaskStatus(prev => ({ ...prev, [task.id]: 'completed' }));
      } else {
        toast.error(data.error || "Aún no has completado la tarea.", { id: tid });
        setTaskStatus(prev => ({ ...prev, [task.id]: 'ready' }));
        if (data.error && data.error.includes('pausada')) fetchTasks();
      }
    } catch (e) { toast.error("Error de conexión al verificar.", { id: tid }); setTaskStatus(prev => ({ ...prev, [task.id]: 'ready' })); } 
  };

  const claimFixedTask = async (taskId, url) => {
    try { WebApp.openTelegramLink(url); } catch (e) {}
    setTimeout(async () => {
      const tid = toast.loading("Comprobando suscripción...");
      setFixedTasksLoading(true);
      try {
        const res = await fetch('/api', {
          method: 'POST', headers: apiHeaders,
          body: JSON.stringify({ action: 'claim-fixed-task', userId: userData.id, taskId: taskId })
        });
        const data = await res.json();
        
        if (data.success) {
          if (data.is_rejoin) {
            toast.success("¡Unión Restaurada!", { id: tid });
          } else {
            toast.success("+1.00 CLICK", { id: tid });
            if (data.balance !== undefined) setUserData(prev => ({ ...prev, balance: data.balance }));
          }
          
          setFixedCompleted(prev => [...prev, taskId]); 
          if(taskId === 'channel1') setActualMembership(prev => ({...prev, channel1: true}));
          if(taskId === 'channel2') setActualMembership(prev => ({...prev, channel2: true}));
          
        } else {
          toast.error(data.error || "Debes unirte al canal primero.", { id: tid });
        }
      } catch (e) { toast.error("Error de conexión.", { id: tid }); } finally { setFixedTasksLoading(false); }
    }, 4000);
  };

  const handleWatchAd = () => {
    if (typeof window.showGiga !== 'function') return toast.error("Servidor no disponible.");
    if (adLoading) return;
    setAdLoading(true);
    const tid = toast.loading("Sintonizando anuncio...");
    window.showGiga().then(async () => {
        toast.loading("Acreditando +0.50 CLICK...", { id: tid });
        try {
          const res = await fetch('/api', {
            method: 'POST', headers: apiHeaders,
            body: JSON.stringify({ action: 'claim-bonus', userId: userData.id })
          });
          const data = await res.json();
          if (data.success) {
            toast.success("+0.50 CLICK", { id: tid });
            if (data.balance !== undefined) setUserData(prev => ({ ...prev, balance: data.balance }));
          } else toast.error("Error al procesar el pago.", { id: tid });
        } catch (error) { toast.error("Error de conexión.", { id: tid }); }
        finally { setAdLoading(false); }
      }).catch(() => { toast.error("Cancelado.", { id: tid }); setAdLoading(false); });
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta campaña? El saldo no gastado será reembolsado.")) return;
    const tid = toast.loading("Eliminando campaña...");
    try {
      const res = await fetch('/api', {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ action: 'delete-task', taskId: taskId, requestingUserId: userData.id, isAdminAction: isAdmin })
      });
      const data = await res.json();
      if (data.success) { toast.success("Campaña eliminada.", { id: tid }); fetchTasks(); } 
      else { throw new Error(data.error); }
    } catch (err) { toast.error(err.message || "Error al eliminar.", { id: tid }); }
  };

  const handleToggleStatus = async (task) => {
    const isPausing = task.status === 'active';
    const tid = toast.loading(isPausing ? "Pausando campaña..." : "Reanudando campaña...");
    try {
      const res = await fetch('/api', {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ action: 'toggle-task-status', taskId: task.id, requestingUserId: userData.id })
      });
      const data = await res.json();
      if (data.success) { 
        toast.success(isPausing ? "Campaña en pausa." : "Campaña activa de nuevo.", { id: tid }); 
        fetchTasks(); 
      } else { throw new Error(data.error); }
    } catch (err) { toast.error(err.message || "Error al cambiar estado.", { id: tid }); }
  };

  const handleOpenEdit = (task) => { setEditingTask({ id: task.id, title: task.title, url: task.url }); setShowEditModal(true); };

  const handleSaveEdit = async () => {
    const tid = toast.loading("Guardando cambios...");
    try {
      const res = await fetch('/api', {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ action: 'edit-task', taskId: editingTask.id, requestingUserId: userData.id, newTitle: editingTask.title, newUrl: editingTask.url, isAdminAction: isAdmin })
      });
      const data = await res.json();
      if (data.success) { toast.success("Campaña actualizada.", { id: tid }); setShowEditModal(false); fetchTasks(); } 
      else { throw new Error(data.error); }
    } catch (err) { toast.error(err.message || "Error al actualizar.", { id: tid }); }
  };

  const getTaskLabel = (type) => {
    switch (type) {
      case 'group':
      case 'channel': return '📢 Canales & Grupos';
      case 'bot': return '🤖 Bots & Mini Apps';
      case 'promo': return '⚡ Vistas & Promos';
      default: return '⚡ Tarea';
    }
  };

  const myTasks = tasks.filter(t => t.creator_id === String(userData?.id));
  
  const communityTasks = tasks.filter(t => t.creator_id !== String(userData?.id) && t.status === 'active')
    .sort((a, b) => { if (a.is_completed === b.is_completed) return 0; return a.is_completed ? 1 : -1; });

  const renderTaskButton = (task) => {
    const status = taskStatus[task.id];
    if (task.is_completed || status === 'completed') return <button disabled style={neon.taskButtonDisabled}>✅ COMPLETADA</button>;
    if (status === 'waiting') return <button disabled style={neon.taskButtonDisabled}>ESPERANDO ({countdown[task.id] || 0}s)</button>;
    if (status === 'ready') return <button onClick={() => handleCheckTask(task)} style={neon.taskButtonCheck}>✅ COMPROBAR</button>;
    if (status === 'verifying') return <button disabled style={neon.taskButtonDisabled}>VALIDANDO...</button>;
    return <button onClick={() => handleStartTask(task)} style={neon.taskButton}>{`+${Number(task.reward).toFixed(2)} CLICK`}</button>;
  };

  const renderFixedButton = (taskId, link) => {
    const isCheckedInBackend = fixedCompleted.includes(taskId);
    if (taskId === 'daily') {
      return (
        <button onClick={() => claimFixedTask(taskId, link)} disabled={fixedTasksLoading || isCheckedInBackend} style={(fixedTasksLoading || isCheckedInBackend) ? neon.taskButtonDisabled : {...neon.taskButton, background: 'linear-gradient(180deg, #00ffaa, #00bb77)', color: '#050214', boxShadow: '0 4px 0 #007744'}}>
          {isCheckedInBackend ? '⏳ VUELVE MAÑANA' : '+1.00 CLICK'}
        </button>
      );
    }
    const isMemberCurrently = actualMembership[taskId];
    if (isCheckedInBackend && !isMemberCurrently) return <button onClick={() => claimFixedTask(taskId, link)} disabled={fixedTasksLoading} style={neon.taskButtonRejoin}>VOLVER A ENTRAR</button>;
    if (isCheckedInBackend && isMemberCurrently) return <button disabled style={neon.taskButtonDisabled}>✅ COMPLETADA</button>;
    return <button onClick={() => claimFixedTask(taskId, link)} disabled={fixedTasksLoading} style={neon.taskButton}>+1.00 CLICK</button>;
  };

  return (
    <div style={{ color: '#ffffff', paddingBottom: '20px' }}>
      <Toaster containerStyle={{ zIndex: 9999999 }} />

      {(view === 'list' || view === 'activity') && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setView('list')}
            style={{ flex: 1, padding: '12px', borderRadius: '16px', fontWeight: '900', fontSize: '13px', border: 'none', cursor: 'pointer', transition: '0.2s', background: view === 'list' ? 'linear-gradient(90deg, #00f0ff, #0088ff)' : 'rgba(255,255,255,0.05)', color: view === 'list' ? '#050214' : '#00f0ff', boxShadow: view === 'list' ? '0 4px 15px rgba(0,240,255,0.3)' : 'none', letterSpacing: '0.5px' }}>
            ⚡ MERCADO
          </button>
          <button onClick={() => setView('activity')}
            style={{ flex: 1, padding: '12px', borderRadius: '16px', fontWeight: '900', fontSize: '13px', border: 'none', cursor: 'pointer', transition: '0.2s', background: view === 'activity' ? 'linear-gradient(90deg, #ff1493, #8a2be2)' : 'rgba(255,255,255,0.05)', color: view === 'activity' ? '#fff' : '#ff41b4', boxShadow: view === 'activity' ? '0 4px 15px rgba(255,20,147,0.3)' : 'none', letterSpacing: '0.5px' }}>
            📋 MIS ANUNCIOS
          </button>
        </div>
      )}

      {view === 'list' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 5px' }}>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>Misiones Fijas</h4>
            <button onClick={() => { fetchTasks(); verifyActualMembership(); }} style={{ background: 'transparent', border: 'none', color: '#ff99dd', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔄 Actualizar</button>
          </div>

          <div style={{...neon.taskCard, borderColor: '#ffe600', background: 'linear-gradient(145deg, rgba(255, 230, 0, 0.1), #1a0b33)'}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{...neon.taskIconBox, borderColor: '#ffe600'}}>{TaskIcons.channel('#ffe600')}</div>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}>@AirdropsCriptoES</div>
                <div style={{ color: '#ffe600', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>🔓 Desbloquear para publicar</div>
              </div>
            </div>
            {renderFixedButton('channel1', 'https://t.me/AirdropsCriptoES')}
          </div>

          <div style={{...neon.taskCard, borderColor: '#ffe600', background: 'linear-gradient(145deg, rgba(255, 230, 0, 0.1), #1a0b33)'}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{...neon.taskIconBox, borderColor: '#ffe600'}}>{TaskIcons.channel('#ffe600')}</div>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}>@TONAirdropsES</div>
                <div style={{ color: '#ffe600', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>🔓 Desbloquear para publicar</div>
              </div>
            </div>
            {renderFixedButton('channel2', 'https://t.me/TONAirdropsES')}
          </div>

          <div style={{...neon.taskCard, borderColor: '#00ffaa', background: 'linear-gradient(145deg, rgba(0, 255, 170, 0.1), #1a0b33)'}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{...neon.taskIconBox, borderColor: '#00ffaa'}}><span style={{fontSize: '24px'}}>🎁</span></div>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}>Crypto Web3</div>
                <div style={{ color: '#00ffaa', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>⏳ Check-in Diario</div>
              </div>
            </div>
            {renderFixedButton('daily', 'https://t.me/CryptoWeb3Pay')}
          </div>

          <div style={{...neon.taskCard, borderColor: '#ff1493', background: 'linear-gradient(145deg, rgba(255, 20, 147, 0.1), #1a0b33)'}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{...neon.taskIconBox, borderColor: '#ff1493'}}><span style={{fontSize: '24px'}}>📺</span></div>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}>Anuncio Patrocinado</div>
                <div style={{ color: '#ff99dd', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>Disponible ilimitadamente</div>
              </div>
            </div>
            <button onClick={handleWatchAd} disabled={adLoading} style={adLoading ? neon.taskButtonDisabled : {...neon.taskButton, background: 'linear-gradient(180deg, #ff1493, #d80073)', color: '#fff', boxShadow: '0 4px 0 #8b004b'}}>{adLoading ? 'CARGANDO...' : '+0.50 CLICK'}</button>
          </div>

          <h4 style={{ margin: '20px 0 16px', color: '#fff', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', padding: '0 5px' }}>Comunidad</h4>

          {loadingTasks ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#00f0ff', fontSize: '14px', fontWeight: 'bold' }}>Sincronizando mercado...</div>
          ) : communityTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p style={{ color: '#ff99dd', fontSize: '13px', fontWeight: 'bold', margin: 0, lineHeight: '1.5' }}>No hay campañas activas.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {communityTasks.map((task) => (
                <div key={task.id} style={{ ...neon.taskCard, flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={neon.taskIconBox}>{TaskIcons[task.type] ? TaskIcons[task.type]('#00f0ff') : TaskIcons.promo('#00f0ff')}</div>
                      <div>
                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '900', letterSpacing: '0.3px' }}>{task.title}</div>
                        <div style={{ color: '#00f0ff', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>{getTaskLabel(task.type)} • {task.completions_done} / {task.completions_total}</div>
                      </div>
                    </div>
                    {renderTaskButton(task)}
                  </div>
                  {isAdmin && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteTask(task.id)} style={{ background: '#ff1493', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Eliminar (Admin)</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button onClick={() => setView('wizard')} style={neon.btnSecondary}>+ CREAR CAMPAÑA DE REFERIDOS</button>
          </div>
        </div>
      )}

      {view === 'activity' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 5px' }}>
            <h4 style={{ margin: 0, color: '#ff41b4', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>Tus Campañas</h4>
            <button onClick={() => { fetchTasks(); verifyActualMembership(); }} style={{ background: 'transparent', border: 'none', color: '#ff99dd', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔄 Actualizar</button>
          </div>

          {loadingTasks ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#ff41b4', fontSize: '14px', fontWeight: 'bold' }}>Buscando...</div>
          ) : myTasks.length === 0 ? (
            <div style={{...neon.card, textAlign: 'center', padding: '30px 20px', borderColor: '#ff1493' }}>
              <div style={{ fontSize: '46px', marginBottom: '10px', filter: 'drop-shadow(0 0 10px rgba(255, 65, 180, 0.5))' }}>📋</div>
              <p style={{ color: '#ff99dd', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px 0' }}>Aún no has creado ningún anuncio.</p>
              <button onClick={() => setView('wizard')} style={{...neon.btnPrimary, background: 'linear-gradient(180deg, #ff1493, #d80073)', boxShadow: '0 4px 15px rgba(255, 20, 147, 0.4)'}}>CREAR MI PRIMER ANUNCIO</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {myTasks.map((task) => {
                const percent = Math.floor((task.completions_done / task.completions_total) * 100);
                const isPaused = task.status === 'paused';
                const isCompleted = task.status === 'completed' || task.completions_done >= task.completions_total;
                
                return (
                  <div key={task.id} style={{...neon.taskCard, borderColor: isCompleted ? '#00ffaa' : isPaused ? '#ffaa00' : '#ff41b4', opacity: (isPaused || isCompleted) ? 0.7 : 1}}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                        <div style={{...neon.taskIconBox, borderColor: isCompleted ? '#00ffaa' : isPaused ? '#ffaa00' : '#ff1493', background: isCompleted ? 'rgba(0, 255, 170, 0.1)' : isPaused ? 'rgba(255, 170, 0, 0.1)' : 'rgba(255, 20, 147, 0.1)'}}>
                          {TaskIcons[task.type] ? TaskIcons[task.type](isCompleted ? '#00ffaa' : isPaused ? '#ffaa00' : '#ff1493') : TaskIcons.promo(isCompleted ? '#00ffaa' : isPaused ? '#ffaa00' : '#ff1493')}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}>
                            {task.title} 
                            {isPaused && <span style={{ color: '#ffaa00', fontSize: '10px', verticalAlign: 'top', marginLeft: '4px' }}>(PAUSADA)</span>}
                            {isCompleted && <span style={{ color: '#00ffaa', fontSize: '10px', verticalAlign: 'top', marginLeft: '4px' }}>(COMPLETADA)</span>}
                          </div>
                          <div style={{ color: isCompleted ? '#00ffaa' : isPaused ? '#ffaa00' : '#ff99dd', fontSize: '11px', marginTop: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>{task.url.substring(0, 25)}...</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                        <span style={{ color: isCompleted ? '#00ffaa' : isPaused ? '#ffaa00' : '#ff41b4' }}>Progreso</span>
                        <span style={{ color: '#fff' }}>{task.completions_done} / {task.completions_total} referidos</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: isCompleted ? 'linear-gradient(90deg, #00ffaa, #00bb77)' : isPaused ? 'linear-gradient(90deg, #ffaa00, #ffe600)' : 'linear-gradient(90deg, #ff1493, #ff66cc)', boxShadow: isCompleted ? '0 0 10px #00ffaa' : isPaused ? '0 0 10px #ffaa00' : '0 0 10px #ff1493', transition: 'width 0.3s ease' }}></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {!isCompleted && (
                          <button onClick={() => handleToggleStatus(task)} style={{ background: isPaused ? '#00ffaa' : '#ffaa00', color: '#050214', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {isPaused ? '▶️ Reanudar' : '⏸ Pausar'}
                          </button>
                        )}
                        <button onClick={() => handleOpenEdit(task)} style={{ background: '#00f0ff', color: '#050214', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ Editar</button>
                        <button onClick={() => handleDeleteTask(task.id)} style={{ background: '#ff1493', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Eliminar</button>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {view === 'wizard' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            {currentStepIndex > 0 && !checkoutView ? (
              <button onClick={prevStep} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', padding: '6px 12px', color: '#fff', fontWeight: '900', cursor: 'pointer' }}>◀</button>
            ) : <div />}
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#00f0ff', letterSpacing: '1px' }}>PASO {currentStepIndex + 1} DE {totalSteps}</div>
            <button onClick={() => { setView('list'); setTaskType(null); setCurrentStepIndex(0); setCompletions(100); setCheckoutView(false); }} style={{ background: '#ff1493', border: 'none', borderRadius: '10px', padding: '6px 12px', color: '#fff', fontWeight: '900', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={neon.progressBox}>{stepsFlow.map((step, idx) => <div key={idx} style={neon.progressStep(idx <= currentStepIndex)} />)}</div>

          {currentStepId === 'type' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', marginBottom: '16px', textTransform: 'uppercase' }}>¿Qué vas a impulsar?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {TASK_TYPES.map((type) => (
                  <div key={type.id} onClick={() => { setTaskType(type.id); nextStep(); }}
                    style={{ ...neon.cardInteractive, borderColor: taskType === type.id ? type.color : '#8a2be2', background: taskType === type.id ? `linear-gradient(135deg, ${type.color}22, rgba(18, 7, 36, 0.9))` : neon.cardInteractive.background }}>
                    <div style={{ width: '44px', height: '44px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{type.icon}</div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '15px', fontWeight: '900', lineHeight: '1.2' }}>{type.title}</div>
                      <div style={{ color: '#ff99dd', fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>{type.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStepId === 'url' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', marginBottom: '16px', textTransform: 'uppercase' }}>Pega tu Enlace</h3>
              <div style={neon.card}>
                <p style={{ color: '#ff99dd', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4', fontWeight: 'bold' }}>Ingresa la URL pública de tu proyecto o tu enlace de afiliado.</p>
                <input style={neon.input} placeholder="https://t.me/..." value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
              </div>
              <button onClick={handleVerifyUrl} disabled={isVerifying} style={neon.btnPrimary}>{isVerifying ? 'VERIFICANDO RED...' : 'VALIDAR ENLACE ➔'}</button>
            </div>
          )}

          {currentStepId === 'token' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffe600', marginBottom: '16px', textTransform: 'uppercase' }}>Token del Bot</h3>
              <div style={{...neon.card, borderColor: '#ff41b4'}}>
                <input style={{...neon.input, borderColor: '#ff41b4'}} placeholder="Ej: 123456:ABC-DEF1234..." value={botToken} onChange={(e) => setBotToken(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={nextStep} style={{...neon.btnSecondary, flex: 1, border: '1px solid #8a2be2', color: '#8a2be2'}}>OMITIR</button>
                <button onClick={nextStep} style={{...neon.btnPrimary, flex: 1}}>CONTINUAR ➔</button>
              </div>
            </div>
          )}

          {currentStepId === 'budget' && (
            <div className="fade-in" style={neon.calcContainer}>
              {checkoutView ? (
                <div className="fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#00f0ff', textTransform: 'uppercase' }}>Pago Seguro</h3>
                    <button onClick={cancelCheckout} style={{ background: 'rgba(255, 65, 180, 0.2)', border: '1px solid #ff1493', borderRadius: '10px', width: '30px', height: '30px', color: '#ff99dd', fontWeight: '900', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#ff99dd', textTransform: 'uppercase' }}>Envía exactamente</div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#00f0ff', margin: '8px 0', textShadow: '0 0 15px rgba(0,240,255,0.5)' }}>{gramPrice} GRAM</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>A tu billetera generada:</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '16px', border: '1px dashed #ff1493', wordBreak: 'break-all', textAlign: 'center', fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold', marginBottom: '20px', color: '#ffffff' }}>
                    {tempWallet}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button onClick={copyWallet} style={{ flex: 1, padding: '14px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', border: '2px solid #00f0ff', borderRadius: '12px', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}>📋 COPIAR</button>
                    <button onClick={openTonkeeper} style={{ flex: 1, padding: '14px', background: 'linear-gradient(90deg, #00f0ff, #0088ff)', color: '#050214', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,240,255,0.4)' }}>💎 TONKEEPER</button>
                  </div>
                  <button onClick={handleVerifyGramPayment} style={{ width: '100%', padding: '16px', background: 'linear-gradient(180deg, #00ffaa, #00bb77)', color: '#050214', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '16px', boxShadow: '0 6px 0 #007744', cursor: 'pointer' }}>
                    ✅ YA PAGUÉ, VERIFICAR
                  </button>
                </div>
              ) : (
                <div className="fade-in">
                  <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px', color: '#ffffff' }}>¿Cuánto tráfico?</h2>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <button onClick={() => setCompletions(100)} style={neon.pillButton(completions === 100)}>100</button>
                    <button onClick={() => setCompletions(500)} style={neon.pillButton(completions === 500)}>500</button>
                    <button onClick={() => setCompletions(1000)} style={neon.pillButton(completions === 1000)}>1K</button>
                    <button onClick={() => setCompletions(5000)} style={neon.pillButton(completions === 5000)}>5K</button>
                  </div>
                  <span style={neon.label}>Cuántas Completaciones</span>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button onClick={() => setCompletions(p => Math.max(10, p - 10))} style={neon.btnActionCalc}>-</button>
                    <input type="number" value={completions} onChange={(e) => setCompletions(Number(e.target.value) || 0)} style={neon.inputCalc} />
                    <button onClick={() => setCompletions(p => p + 10)} style={neon.btnActionCalc}>+</button>
                  </div>
                  <span style={neon.label}>Click por Completar</span>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button onClick={() => setRewardPerClick(p => Math.max(1, p - 1))} style={neon.btnActionCalc}>-</button>
                    <input type="number" value={rewardPerClick} onChange={(e) => setRewardPerClick(Number(e.target.value) || 0)} style={neon.inputCalc} />
                    <button onClick={() => setRewardPerClick(p => p + 1)} style={neon.btnActionCalc}>+</button>
                  </div>
                  <div style={{ display: 'flex', background: 'rgba(15, 5, 28, 0.8)', borderRadius: '12px', border: '2px solid #8a2be2', overflow: 'hidden', marginBottom: '20px' }}>
                    <button onClick={() => setPaymentMethod('balance')} style={{ flex: 1, padding: '12px', border: 'none', background: paymentMethod === 'balance' ? 'linear-gradient(90deg, #ff1493, #8a2be2)' : 'transparent', color: paymentMethod === 'balance' ? '#ffffff' : '#ff99dd', fontWeight: '900', cursor: 'pointer', transition: '0.2s' }}>MI SALDO</button>
                    <button onClick={() => setPaymentMethod('gram')} style={{ flex: 1, padding: '12px', borderLeft: '1px solid #8a2be2', borderRight: '1px solid #8a2be2', background: paymentMethod === 'gram' ? 'linear-gradient(90deg, #ff1493, #8a2be2)' : 'transparent', color: paymentMethod === 'gram' ? '#ffffff' : '#ff99dd', fontWeight: '900', cursor: 'pointer', transition: '0.2s' }}>GRAM</button>
                    <button onClick={() => setPaymentMethod('stars')} style={{ flex: 1, padding: '12px', border: 'none', background: paymentMethod === 'stars' ? 'linear-gradient(90deg, #ff1493, #8a2be2)' : 'transparent', color: paymentMethod === 'stars' ? '#ffffff' : '#ff99dd', fontWeight: '900', cursor: 'pointer', transition: '0.2s' }}>STARS</button>
                  </div>
                  <div style={neon.summaryBox}>
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '14px', marginBottom: '4px', color: '#ffffff' }}>Pagas</div>
                      <div style={{ fontSize: '10px', fontWeight: '800', opacity: 0.8, color: '#ff99dd' }}>Presupuesto: {totalClicksCost} CLICK</div>
                    </div>
                    <div style={{ fontWeight: '900', fontSize: '16px', textAlign: 'right', color: '#00f0ff' }}>
                      {paymentMethod === 'balance' && `${totalClicksCost} CLICK • $0.00`}
                      {paymentMethod === 'gram' && `${gramPrice} GRAM • $${usdPrice.toFixed(2)}`}
                      {paymentMethod === 'stars' && `${starsPrice} ⭐ • $${usdPrice.toFixed(2)}`}
                    </div>
                  </div>
                  <button onClick={handleCheckout} disabled={isGenerating} style={neon.actionBtn}>{isGenerating ? 'PROCESANDO...' : '+ Crear y pagar'}</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showEditModal && editingTask && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 2, 20, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100000, backdropFilter: 'blur(5px)' }}>
          <div style={{ ...neon.card, width: '100%', maxWidth: '340px', marginBottom: 0, borderColor: '#ffe600' }}>
            <h3 style={{ margin: '0 0 14px 0', color: '#ffe600', fontSize: '17px', fontWeight: '900' }}>Editar Campaña</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={neon.label}>TÍTULO</label>
              <input style={neon.input} value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={neon.label}>ENLACE (URL)</label>
              <input style={neon.input} value={editingTask.url} onChange={(e) => setEditingTask({ ...editingTask, url: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowEditModal(false)} style={{ ...neon.btnSecondary, flex: 1 }}>CANCELAR</button>
              <button onClick={handleSaveEdit} style={{ ...neon.btnPrimary, flex: 2, background: 'linear-gradient(180deg, #ffe600, #ffaa00)', color: '#050214', boxShadow: '0 6px 0 #cc8800' }}>ACTUALIZAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
