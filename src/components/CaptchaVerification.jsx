import { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles.js';

export default function CaptchaVerification({ userData, setIsHuman }) {
  const [mathProblem, setMathProblem] = useState({ result: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  
  // Referencia para controlar el elemento Canvas
  const canvasRef = useRef(null);

  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Limpiamos el canvas anterior
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Generamos los números
    const n1 = Math.floor(Math.random() * 20) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setMathProblem({ result: n1 + n2 });
    setUserAnswer('');

    // 2. Fondo del canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Dibujamos líneas de ruido (para confundir a los bots OCR si intentan leer la imagen)
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = ['#333', '#444', '#555'][Math.floor(Math.random() * 3)];
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineWidth = Math.random() * 3;
      ctx.stroke();
    }

    // 4. Función para dibujar texto distorsionado
    const drawDistortedText = (text, x) => {
      ctx.save();
      // Fuentes irregulares aleatorias
      const fonts = ['28px "Comic Sans MS"', '30px "Courier New"', '32px "Impact"'];
      ctx.font = fonts[Math.floor(Math.random() * fonts.length)];
      ctx.fillStyle = '#ffffff';
      
      // Distorsión: Rotación y movimiento aleatorio
      const angle = (Math.random() * 0.6) - 0.3; // Rotación leve
      const offsetY = (Math.random() * 10) - 5;
      
      ctx.translate(x, canvas.height / 2 + 10 + offsetY);
      ctx.rotate(angle);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    };

    // 5. Escribimos la operación en el canvas (separados para distorsionarlos distinto)
    drawDistortedText(n1.toString(), 40);
    drawDistortedText("+", 100);
    drawDistortedText(n2.toString(), 140);
    drawDistortedText("= ?", 190);
  };

  // Dibujar el captcha inicial cuando cargue el componente
  useEffect(() => {
    drawCaptcha();
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
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);

      if (newAttempts <= 0) {
        setIsLocked(true);
        toast.error("Has fallado demasiadas veces. Acceso bloqueado.");
      } else {
        toast.error(`Incorrecto. Te quedan ${newAttempts} intentos.`);
        drawCaptcha(); // Redibujamos un nuevo reto en el canvas si falla
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
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
          
          {/* Aquí está la magia: Un lienzo donde se PINTA la suma. Los bots no pueden leer esto en el código fuente */}
          <canvas 
            ref={canvasRef} 
            width={280} 
            height={80} 
            style={{
              borderRadius: '15px',
              border: '2px solid #444',
              boxShadow: 'inset 0px 0px 10px rgba(0,0,0,0.8)'
            }}
          />

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