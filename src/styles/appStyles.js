export const s = {
  // Contenedor principal
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

  // Tarjetas Modernas
  card: { 
    backgroundColor: '#121212', 
    padding: '20px', 
    borderRadius: '24px', 
    border: '1px solid #1f1f1f', 
    marginBottom: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
  },

  // Diseño de la Red (Grid de 3 columnas)
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '20px'
  },

  statCol: {
    backgroundColor: '#1a1a1a',
    padding: '12px 5px',
    borderRadius: '18px',
    textAlign: 'center',
    border: '1px solid #252525'
  },

  statLabel: { fontSize: '10px', color: '#888', fontWeight: 'bold', margin: '0 0 5px 0', textTransform: 'uppercase' },
  statValue: { fontSize: '18px', fontWeight: '800', margin: '0', color: '#fff' },
  statCom: { fontSize: '10px', margin: '5px 0 0 0', color: '#0088cc', fontWeight: '600' },

  // Fila de Comisión
  row: { display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '20px' },
  
  box: { 
    flex: 1, 
    padding: '10px', 
    backgroundColor: '#161616', 
    borderRadius: '14px', 
    fontSize: '10px', 
    textAlign: 'center', 
    color: '#666',
    border: '1px dashed #333'
  },

  // Resaltado de Total
  totalCard: {
    background: 'linear-gradient(90deg, #121212 0%, #1a1a1a 100%)',
    padding: '15px 20px',
    borderRadius: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #28a74544'
  },

  // Botones
  btnGreen: { 
    width: '100%', 
    padding: '18px', 
    backgroundColor: '#28a745', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '18px', 
    fontWeight: '800', 
    fontSize: '16px',
    boxShadow: '0 8px 20px rgba(40,167,69,0.2)',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },

  btnWhite: { 
    width: '100%', 
    padding: '16px', 
    backgroundColor: '#fff', 
    color: '#000', 
    borderRadius: '16px', 
    fontWeight: '700',
    border: 'none'
  },

  btnOutline: { 
    width: '100%', 
    padding: '14px', 
    backgroundColor: 'transparent', 
    color: '#888', 
    border: '1px solid #333', 
    borderRadius: '16px', 
    fontWeight: '600',
    fontSize: '14px',
    marginTop: '10px'
  },

  cardBalance: { 
    background: 'linear-gradient(145deg, #0088cc 0%, #005588 100%)', 
    padding: '35px 20px', 
    borderRadius: '28px', 
    textAlign: 'center', 
    marginBottom: '24px',
    boxShadow: '0 12px 24px rgba(0,136,204,0.3)'
  },

  // Navegación
  bottomNav: { 
    position: 'fixed', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(5, 5, 5, 0.8)', 
    backdropFilter: 'blur(15px)', 
    display: 'flex', 
    justifyContent: 'space-around', 
    padding: '12px 10px 30px 10px', 
    borderTop: '1px solid #1f1f1f', 
    zIndex: 100 
  },

  navItem: { color: '#555', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '11px', width: '33%', gap: '5px' },
  navItemActive: { color: '#0088cc', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '11px', width: '33%', gap: '5px' },

  // Estilos de Retiro
  withdrawContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '10px 5px'
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'left'
  },

  input: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },

  helpText: {
    fontSize: '11px',
    color: '#fff', // Texto en blanco para que resalte
    background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.2) 0%, rgba(40, 167, 69, 0.1) 100%)', // Gradiente azul a verde muy suave
    padding: '12px',
    borderRadius: '16px',
    border: '1px solid rgba(0, 136, 204, 0.3)', // Borde sutil azul
    marginBottom: '15px',
    lineHeight: '1.5'
  },

  label: {
    fontSize: '12px',
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase'
  }
};
