export const nb = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F7F4EB', // Tono crema de fondo de la app de referencia
    backgroundImage: 'radial-gradient(#d5d1c5 1.2px, transparent 1.2px)',
    backgroundSize: '16px 16px',
    padding: '16px 16px 90px 16px',
    color: '#000',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  title: {
    fontSize: '24px',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    margin: '10px 0 16px 0'
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '2.5px solid #000',
    borderRadius: '18px',
    boxShadow: '4px 4px 0px #000',
    padding: '16px',
    marginBottom: '16px'
  },
  cardInteractive: {
    backgroundColor: '#FFFFFF',
    border: '2.5px solid #000',
    borderRadius: '18px',
    boxShadow: '3px 3px 0px #000',
    padding: '14px 16px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer'
  },
  btnPrimary: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#8cb7fc', // Azul pastel neo-brutalist
    border: '2.5px solid #000',
    borderRadius: '16px',
    boxShadow: '4px 4px 0px #000',
    fontWeight: '800',
    fontSize: '16px',
    cursor: 'pointer'
  },
  btnDark: {
    padding: '10px 18px',
    backgroundColor: '#0d47a1',
    color: '#fff',
    border: '2.5px solid #000',
    borderRadius: '14px',
    boxShadow: '3px 3px 0px #000',
    fontWeight: '800',
    cursor: 'pointer'
  },
  btnLight: {
    padding: '10px 18px',
    backgroundColor: '#fff',
    color: '#000',
    border: '2.5px solid #000',
    borderRadius: '14px',
    boxShadow: '3px 3px 0px #000',
    fontWeight: '800',
    cursor: 'pointer'
  },
  input: {
    width: '100%',
    border: '2px solid #000',
    borderRadius: '14px',
    padding: '12px',
    fontSize: '15px',
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
    height: '8px',
    backgroundColor: active ? '#2b6cb0' : 'transparent',
    border: '2px solid #000',
    borderRadius: '10px',
    transition: 'all 0.2s ease'
  })
};
