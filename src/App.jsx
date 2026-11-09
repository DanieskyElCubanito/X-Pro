import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import toast, { Toaster } from 'react-hot-toast';  
 
import { translations } from './translations'; 

import HomeTab from './components/HomeTab';        
import GoodsTab from './components/GoodsTab';      
import TeamTab from './components/TeamTab';        
import EarnTab from './components/EarnTab';        
import UserTab from './components/UserTab';        
import BottomNav from './components/BottomNav';
import AdminDashboard from './components/AdminDashboard';

const neonTheme = {
  container: { 
    backgroundColor: '#05010d', 
    backgroundImage: 'radial-gradient(circle at 50% 10%, #1e053a 0%, #05010d 80%)', 
    minHeight: '100vh', height: 'var(--tg-viewport-height, 100vh)', 
    color: '#ffffff', fontFamily: "'Quicksand', system-ui, -apple-system, sans-serif", 
    display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden'
  },
  main: { 
    flex: 1, maxWidth: '520px', margin: '0 auto', width: '100%', 
    padding: '16px 16px 110px 16px', boxSizing: 'border-box', 
    overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    scrollBehavior: 'smooth'
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [userData, setUserData] = useState({
    id: "999999",
    username: "DevTester (Navegador)",
    balance: 5000, 
    total_earnings: 150,
    global_clicks: "1.5K",
    received_clicks: 250,
    is_human: true
  });

  const [lang, setLang] = useState(localStorage.getItem('click_lang') || 'es');

  const t = (key) => translations[lang]?.[key] || key;

  useEffect(() => {
    try {
      WebApp.ready(); 
      WebApp.expand();
      WebApp.setHeaderColor('#05010d');
      WebApp.setBackgroundColor('#05010d');
      if (WebApp.disableVerticalSwipes) WebApp.disableVerticalSwipes();
    } catch (e) { 
      console.log("No estamos en Telegram. Cargando en navegador..."); 
    }
  }, []);

  return (
    <div style={neonTheme.container}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#120422', color: '#fff', border: '2px solid #00f0ff', boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)', fontWeight: '900', fontSize: '14px', borderRadius: '16px' } }} />
      
      <div style={neonTheme.main}>
        <style>{`
          .fade-in { animation: fadeIn 0.4s ease-out forwards; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        {/* LAS PESTAÑAS (El perfil ahora solo vive dentro de UserTab) */}
        {activeTab === 'home' && <div className="fade-in"><HomeTab userData={userData} setUserData={setUserData} setActiveTab={setActiveTab} t={t} /></div>}
        {activeTab === 'goods' && <div className="fade-in"><GoodsTab userData={userData} setUserData={setUserData} t={t} /></div>}
        {activeTab === 'team' && <div className="fade-in"><TeamTab userData={userData} t={t} /></div>}
        {activeTab === 'earn' && <div className="fade-in"><EarnTab userData={userData} setUserData={setUserData} t={t} /></div>}
        {activeTab === 'user' && <div className="fade-in"><UserTab userData={userData} t={t} lang={lang} setLang={setLang} /></div>}
        {activeTab === 'admin' && <div className="fade-in"><AdminDashboard userData={userData} t={t} /></div>}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} userData={userData} t={t} />
    </div>
  );
}

export default App;
