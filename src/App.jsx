import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { s } from './styles/appStyles';
import { botApi } from './api/botApi'; 
import toast, { Toaster } from 'react-hot-toast'; 

import ShareTab from './components/ShareTab';

function App() {
  const [status, setStatus] = useState('loading'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState(null);
  const [errorInfo, setErrorInfo] = useState('');
  const [stats, setStats] = useState({ n1: 0, c1: "0.000" });
  
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState(0.1);
  const [isSending, setIsSending] = useState(false);

  const verifyUser = async (user, startParam) => {
    try {
      const data = await botApi.verifyUser(user, startParam);
      if (data.success) {
        setUserData(data.user);
        setStats(data.stats);
        setStatus('member');
      } else {
        setStatus('error');
        setErrorInfo(data.error || 'Error de acceso');
      }
    } catch (err) {
      setStatus('error');
      setErrorInfo(err.response?.data?.error || err.message);
    }
  };

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    const user = WebApp.initDataUnsafe?.user;
    if (!user) {
      setStatus('error');
      setErrorInfo('Abre la app desde Telegram');
      return;
    }
    verifyUser(user, WebApp.initDataUnsafe?.start_param);
  }, []);

  const processWithdraw = async () => {
    if (!withdrawAddress.startsWith('U') && !withdrawAddress.startsWith('E')) {
      return toast.error("Wallet TON inválida");
    }
    setIsSending(true);
    try {
      const data = await botApi.withdraw(userData.id, withdrawAddress, withdrawAmount);
      if (data.success) {
        setUserData(prev => ({ ...prev, balance: prev.balance - withdrawAmount }));
        setIsWithdrawing(false);
        toast.success("Retiro solicitado");
      }
    } catch (e) {
      toast.error("Error en el proceso");
    } finally {
      setIsSending(false);
    }
  };

  const handleShare = () => {
    const link = `https://t.me/IAProfitTonBot/app?startapp=${userData?.id}`;
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=¡Únete y gana TON!`);
  };

  if (status === 'loading') return <div style={s.center}><div style={s.loader}></div></div>;
  if (status === 'error') return <div style={s.center}><p style={s.errorText}>{errorInfo}</p></div>;

  return (
    <div style={s.container}>
      <Toaster position="top-center" />
      <div style={s.main}>
        {isWithdrawing ? (
          <div style={{padding:'20px'}}>
            <h3 style={{color:'#fff', textAlign:'center'}}>Retirar Balance</h3>
            <input style={s.input} placeholder="Wallet TON (UQ...)" value={withdrawAddress} onChange={e=>setWithdrawAddress(e.target.value)} />
            <input style={s.input} type="number" value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)} />
            <button style={s.btnGreen} onClick={processWithdraw} disabled={isSending}>
              {isSending ? 'PROCESANDO...' : 'CONFIRMAR RETIRO'}
            </button>
            <button style={s.btnOutline} onClick={()=>setIsWithdrawing(false)}>VOLVER</button>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <div style={s.cardBalance}>
                <p style={{fontSize:'12px', opacity:0.8}}>SALDO ACTUAL</p>
                <h1 style={{fontSize:'40px', margin:'10px 0'}}>
                  {Number(userData?.balance || 0).toFixed(4)} <span style={{fontSize:'16px'}}>TON</span>
                </h1>
                <button style={s.btnWhite} onClick={()=>setIsWithdrawing(true)}>SOLICITAR RETIRO</button>
              </div>
            )}
            {activeTab === 'share' && <ShareTab stats={stats} handleShare={handleShare} />}
          </>
        )}
      </div>

      {!isWithdrawing && (
        <div style={s.bottomNav}>
          <div onClick={()=>setActiveTab('home')} style={activeTab === 'home' ? s.navItemActive : s.navItem}>
             <span>🏠</span><span>Inicio</span>
          </div>
          <div onClick={()=>setActiveTab('share')} style={activeTab === 'share' ? s.navItemActive : s.navItem}>
             <span>👥</span><span>Amigos</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;