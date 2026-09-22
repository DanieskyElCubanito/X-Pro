import DailyCheckIn from './DailyCheckIn';

export default function HomeTab({ userData, setUserData }) {
  return (
    <div style={{ marginTop: '10px' }}>
      <DailyCheckIn userData={userData} setUserData={setUserData} />
    </div>
  );
}
