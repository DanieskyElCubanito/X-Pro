import { s } from '../styles/appStyles';
import DailyCheckIn from './DailyCheckIn';

export default function HomeTab({ userData, setView, setUserData }) {
  return (
    <>
      <div style={s.cardBalance}>
        <p style={{fontSize:'12px', fontWeight:'bold', letterSpacing:'1px', opacity:0.8}}>SALDO DISPONIBLE</p>
        <h1 style={{fontSize:'42px', margin:'10px 0', fontWeight:'900'}}>
          {Number(userData?.balance || 0).toFixed(4)} <span style={{fontSize:'18px'}}>TON</span>
        </h1>
        <div style={{fontSize:'12px', background:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:'10px', display:'inline-block'}}>Nivel: Usuario Elite ⚡</div>
      </div>

      <div style={{...s.actionGrid, gridTemplateColumns: '1fr 1fr'}}>
        <div style={s.actionCard} onClick={() => setView('withdraw')}>
          <span style={{fontSize:'26px', marginBottom:'5px'}}>💸</span>RETIRO
        </div>
        <div style={s.actionCard} onClick={() => setView('history')}>
          <span style={{fontSize:'26px', marginBottom:'5px'}}>📜</span>HISTORIAL
        </div>
      </div>

      <DailyCheckIn userData={userData} setUserData={setUserData} />
    </>
  );
        }
