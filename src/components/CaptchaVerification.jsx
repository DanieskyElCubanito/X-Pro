import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles.js';

export default function CaptchaVerification({ userData, setIsHuman }) {
  const [mathProblem, setMathProblem] = useState({ n1: 0, n2: 0, result: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [distortions, setDistortions] = useState([]);
  
  // Nuevos estados para los intentos y el bloqueo
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [isLocked, setIsLocked] = useState(false);

  const initCaptcha = () => {
    const n1 = Math.floor(Math.random() * 20) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setMathProblem({ n1, n2, result: n1 + n2 });
    setUserAnswer(''); 

    // Generamos distorsión aleatoria para los 3 elementos (n1, el signo +, y n2)
    const generateDistortion = () => ({
      rotate: Math.floor(Math.random() * 40) - 20, // Rota entre -20 y 20 grados
      skewX: Math.floor(Math.random() * 30) - 15,  // Inclina horizontalmente
      skewY: Math.floor(Math.random() * 30) - 15,  // Inclina verticalmente
    });

    setDistortions([generateDistortion(), generateDistortion(), generateDistortion()]);
  };

  useEffect(() => {
    initCaptcha();
  }, []);

  const handleValidate = async () => {
    if (isLocked) return;

    if (parseInt(userAnswer) === mathProblem.result) {
      const tid = toast.loading("Validando seguridad...");
      try {
        const res = await botApi.verifyHuman(userData.id, 'app-verified-math');
        if (res.success) {
          setIsHuman(true);
          toast.success("¡Acceso concedido!", { id: tid });
        }
      } catch (e) {
        toast.error("Validación fallida.", { id: tid });
      }
    } else {
      // Lógica de fallo y reducción de intentos
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);

      if (newAttempts <= 0) {
        setIsLocked(true);
        toast.error("Has fallado demasiadas veces. Acceso bloqueado.");
      } else {
        toast.error(`Incorrecto. Te quedan ${newAttempts} intentos.`);
        initCaptcha(); 
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  // Función para aplicar los estilos de distorsión a cada número
  const getDistortionStyle = (index) => {
    const d = distortions[index] || { rotate: 0, skewX: 0, skewY: 0 };
    return {
      display: 'inline-block',
      transform: `rotate(${d.rotate}deg) skewX(${d.skewX}deg) skewY(${d.skewY}deg)`,
      margin: '0 8px',
      fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif', // Fuente irregular
      userSelect: 'none' // Evita que el bot pueda copiar el texto
    };
  };

  return (
    <div style={{...s.container, padding: '50px 20px', textAlign: 'center'}}>
      <Toaster position="top-center" />
      <h2 style={{color: isLocked ? '#ff4444' : '#0088cc'}}>
        {isLocked ? '🚫 Acceso Bloqueado' : '¡Verificación Rápida! ⚡'}
      </h2>
      
      {!isLocked ? (
        <p style={{color: '#888', fontSize: '15px', marginBottom: '30px'}}>
          Demuestra que eres humano resolviendo esta suma:
        </p>
      ) : (
        <p style={{color: '#ff4444', fontSize: '15px', marginBottom: '30px', fontWeight: 'bold'}}>
          Has agotado tus 3 intentos.
        </p>
      )}

      {!isLocked && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
          
          {/* Contenedor del problema matemático con ruido de fondo y distorsión */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            fontSize: '38px', 
            fontWeight: 'bold', 
            color: '#fff', 
            background: 'repeating-linear-gradient(45deg, #111, #111 10px, #2a2a2a 10px, #2a2a2a 20px)', // Ruido de fondo para engañar al OCR
            padding: '20px 30px',
            borderRadius: '15px',
            border: '2px solid #444',
            boxShadow: 'inset 0px 0px 10px rgba(0,0,0,0.8)'
          }}>
            <span style={getDistortionStyle(0)}>{mathProblem.n1}</span>
            <span style={getDistortionStyle(1)}>+</span>
            <span style={getDistortionStyle(2)}>{mathProblem.n2}</span>
          </div>

          <input 
            type="number" 
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tu respuesta"
            style={{
              padding: '15px',
              fontSize: '20px',
              borderRadius: '10px',
              border: '2px solid #333',
              background: '#1a1a1a',
              color: '#fff',
              textAlign: 'center',
              width: '150px',
              outline: 'none'
            }}
          />

          <button 
            onClick={handleValidate}
            style={{
              ...s.btnGreen,
              padding: '12px 30px',
              fontSize: '16px',
              marginTop: '10px'
            }}
          >
            Verificar
          </button>
          
          <p style={{fontSize: '14px', color: attemptsLeft === 1 ? '#ffcc00' : '#888', fontWeight: 'bold'}}>
            Intentos restantes: {attemptsLeft}
          </p>
        </div>
      )}

      <p style={{fontSize: '12px', color: '#555', marginTop: '20px'}}>
        Esta verificación solo aparece la primera vez que inicies.
      </p>
    </div>
  );
}