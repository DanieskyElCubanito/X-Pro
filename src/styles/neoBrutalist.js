export const nb = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0314',
    backgroundImage: 'radial-gradient(circle at 50% 10%, #2b0b47 0%, #0a0314 80%)',
    padding: '16px 16px 90px 16px',
    color: '#ffffff',
    fontFamily: "'Fredoka', 'Quicksand', system-ui, -apple-system, sans-serif"
  },
  title: {
    fontSize: '24px',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#00f0ff',
    textShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
    margin: '10px 0 16px 0'
  },
  card: {
    background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.85), rgba(20, 8, 38, 0.95))',
    border: '2px solid #8a2be2',
    borderRadius: '24px',
    boxShadow: '0 8px 24px rgba(138, 43, 226, 0.2)',
    padding: '16px',
    marginBottom: '16px'
  },
  cardInteractive: {
    background: 'linear-gradient(135deg, rgba(38, 14, 66, 0.9), rgba(18, 7, 36, 0.9))',
    border: '2px solid #00f0ff',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0, 240, 255, 0.2)',
    padding: '14px 16px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  btnPrimary: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(180deg, #00f0ff 0%, #0099ff 100%)',
    color: '#050214',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 6px 0 #0066aa, 0 10px 20px rgba(0, 240, 255, 0.4)',
    fontWeight: '900',
    fontSize: '16px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  btnDark: {
    padding: '10px 18px',
    background: 'linear-gradient(180deg, #ff1493 0%, #d80073 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    boxShadow: '0 4px 0 #8b004b, 0 8px 15px rgba(255, 20, 147, 0.4)',
    fontWeight: '900',
    cursor: 'pointer',
    textTransform: 'uppercase'
  },
  btnLight: {
    padding: '10px 18px',
    backgroundColor: 'transparent',
    color: '#ff99dd',
    border: '2px solid #ff41b4',
    borderRadius: '14px',
    boxShadow: '0 0 10px rgba(255, 65, 180, 0.2)',
    fontWeight: '900',
    cursor: 'pointer',
    textTransform: 'uppercase'
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(15, 5, 28, 0.8)',
    border: '2px solid #8a2be2',
    borderRadius: '14px',
    padding: '12px',
    fontSize: '15px',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  progressBarContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    margin: '12px 0 18px 0'
  },
  progressStep: (active) => ({
    width: '45px',
    height: '6px',
    background: active ? 'linear-gradient(90deg, #ff1493, #00f0ff)' : 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    boxShadow: active ? '0 0 10px #00f0ff' : 'none',
    transition: 'all 0.3s ease'
  })
};
