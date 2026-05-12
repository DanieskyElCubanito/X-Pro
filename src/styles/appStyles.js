export const s = {
  // --- [ ESTADOS DE CARGA Y ERRORES ] ---
  center: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
    color: '#fff',
    textAlign: 'center'
  },
  loader: {
    width: '40px',
    height: '40px',
    border: '4px solid #222',
    borderTop: '4px solid #0088cc',
    borderRadius: '50%',
    marginBottom: '15px'
  },
  errorText: {
    color: '#ff4444',
    fontSize: '14px',
    marginTop: '10px',
    lineHeight: '1.4'
  },

  // --- [ CONTENEDORES GENERALES ] ---
  container: { 
    backgroundColor: '#050505', 
    color: '#ffffff', 
    minHeight: '100vh', 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif',
    display: 'flex', 
    flexDirection: 'column'
  },
  main: { 
    padding: '16px', 
    maxWidth: '500px', 
    margin: '0 auto', 
    width: '100%', 
    boxSizing: 'border-box', 
    paddingBottom: '120px' 
  }, 

  // --- [ PERFIL DE USUARIO ] ---
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    marginBottom: '20px'
  },
  profileAvatar: {
    width: '55px',
    height: '55px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #0088cc',
    marginRight: '15px'
  },
  profileName: { fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: 0 },
  profileId: { fontSize: '12px', color: '#888', margin: 0 },

  // --- [ TARJETAS Y BALANCE ] ---
  card: { 
    backgroundColor: '#121212', 
    padding: '20px', 
    borderRadius: '24px', 
    border: '1px solid #1f1f1f', 
    marginBottom: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
  },
  cardBalance: { 
    background: 'linear-gradient(145deg, #0088cc 0%, #005588 100%)', 
    padding: '35px 20px', 
    borderRadius: '28px', 
    textAlign: 'center', 
    marginBottom: '24px',
    boxShadow: '0 12px 24px rgba(0,136,204,0.3)'
  },
  balanceLabel: { fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', opacity: 0.8 },
  balanceValue: { fontSize: '42px', margin: '10px 0', fontWeight: '900' },
  balanceUnit: { fontSize: '18px' },
  balanceTag: { 
    fontSize: '12px', 
    background: 'rgba(255,255,255,0.1)', 
    padding: '4px 10px', 
    borderRadius: '10px', 
    display: 'inline-block' 
  },

  // --- [ MISIONES ] ---
  missionTitle: { fontSize: '15px', color: '#fff', marginBottom: '15px', marginTop: '25px' },
  missionCard: {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '10px', 
    padding: '15px', 
    backgroundColor: '#112233', 
    border: '1px solid #1a3a5a',
    borderRadius: '24px'
  },
  missionIconBox: {
    width: '40px', 
    height: '40px', 
    backgroundColor: '#004466', 
    borderRadius: '10px', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    fontSize: '20px'
  },
  missionInfo: { margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#fff' },
  missionReward: { margin: 0, color: '#00ccff', fontSize: '12px', fontWeight: 'bold', marginTop: '2px' },
  missionActionArea: { display: 'flex', flexDirection: 'column', gap: '8px' },
  missionBtnSmall: { padding: '6px 12px', fontSize: '12px' },

  // --- [ CAPTCHA ] ---
  captchaContainer: { display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '30px' },
  captchaBtn: {
    fontSize: '40px', 
    padding: '15px', 
    borderRadius: '15px', 
    background: '#1a1a1a', 
    border: '2px solid #333', 
    cursor: 'pointer',
    transition: 'transform 0.1s'
  },

  // --- [ ACCIONES RÁPIDAS ] ---
  actionGrid: { display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '20px' },
  actionCard: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: '18px', padding: '15px 10px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: '600'
  },

  // --- [ BOTONES ] ---
  btnGreen: { 
    width: '100%', padding: '18px', backgroundColor: '#28a745', color: '#fff', 
    border: 'none', borderRadius: '18px', fontWeight: '800', fontSize: '16px',
    boxShadow: '0 8px 20px rgba(40,167,69,0.2)', cursor: 'pointer'
  },
  btnOutline: { 
    width: '100%', padding: '14px', backgroundColor: 'transparent', color: '#888', 
    border: '1px solid #333', borderRadius: '16px', fontWeight: '600',
    fontSize: '14px', marginTop: '10px', cursor: 'pointer'
  },

  // --- [ NAVEGACIÓN ] ---
  bottomNav: { 
    position: 'fixed', bottom: 0, left: 0, right: 0, 
    backgroundColor: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(15px)', 
    display: 'flex', justifyContent: 'space-around', padding: '12px 10px 30px 10px', 
    borderTop: '1px solid #1f1f1f', zIndex: 100 
  },
  navItem: { color: '#555', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '11px', width: '33%', gap: '5px', cursor: 'pointer' },
  navItemActive: { color: '#0088cc', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '11px', width: '33%', gap: '5px', cursor: 'pointer' },

  // --- [ INPUTS ] ---
  input: {
    width: '100%', padding: '16px', backgroundColor: '#1a1a1a', border: '1px solid #333',
    borderRadius: '16px', color: '#fff', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box', marginBottom: '15px'
  },
  helpText: {
    fontSize: '11px', color: '#fff', 
    background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.2) 0%, rgba(40, 167, 69, 0.1) 100%)', 
    padding: '12px', borderRadius: '16px', border: '1px solid rgba(0, 136, 204, 0.3)', 
    marginBottom: '15px', lineHeight: '1.5'
  }
};