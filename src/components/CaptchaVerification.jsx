import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles.js';

export default function CaptchaVerification({ userData, setIsHuman }) {
  const [step, setStep] = useState(1);

  // --- ESTADO PARA EL PASO 1 (CHECKBOX) ---
  const [isChecked, setIsChecked] = useState(false);

  // --- ESTADOS PARA EL PASO 2 (PUZZLE) ---
  const [targetPosition, setTargetPosition] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);

  // --- ESTADOS PARA EL PASO 3 (ICONOS) ---
  const [targetIcons, setTargetIcons] = useState([]);
  const [shuffledIcons, setShuffledIcons] = useState([]);
  const [selectedIcons, setSelectedIcons] = useState([]);

  useEffect(() => {
    setTargetPosition(Math.floor(Math.random() * 40) + 40);

    const allIcons = ['⭐', '🛒', '📅', '🍎', '🚀', '🍕', '⚽', '🚗'];
    const shuffledAll = [...allIcons].sort(() => 0.5 - Math.random());
    
    const targets = shuffledAll.slice(0, 3);
    setTargetIcons(targets);
    
    const displayIcons = shuffledAll.slice(0, 6).sort(() => 0.5 - Math.random());
    setShuffledIcons(displayIcons);
  }, []);

  // --- LÓGICA PASO 1 ---
  const handleCheckboxClick = () => {
    // Marcamos la casilla visualmente
    setIsChecked(true);
    // Esperamos medio segundo para que el usuario vea el check antes de cambiar de pantalla
    setTimeout(() => {
      setStep(2);
    }, 500);
  };

  // --- LÓGICA PASO 2 ---
  const handleSliderRelease = () => {
    if (Math.abs(sliderValue - targetPosition) < 5) {
      toast.success("¡Puzzle completado!");
      setTimeout(() => setStep(3), 500);
    } else {
      toast.error("Posición incorrecta, intenta de nuevo.");
      setSliderValue(0);
      setTargetPosition(Math.floor(Math.random() * 40) + 40);
    }
  };

  // --- LÓGICA PASO 3 ---
  const handleIconSelect = async (icon) => {
    if (selectedIcons.includes(icon)) return;

    const newSelection = [...selectedIcons, icon];
    setSelectedIcons(newSelection);

    if (newSelection.length === 3) {
      const isCorrect = newSelection.every((val, index) => val === targetIcons[index]);
      
      // En handleIconSelect dentro de CaptchaVerification.jsx:
if (isCorrect) {
  const tid = toast.loading("Verificando seguridad...");
  try {
    const res = await botApi.verifyHuman(userData.id, 'app-verified-3step');
    if (res.success) {
      setIsHuman(true);
      toast.success("¡Verificación exitosa!", { id: tid });
    } else {
      toast.error(res.error || "Falló la verificación en servidor.", { id: tid });
      resetStep3();
    }
  } catch (e) {
    toast.error("Error en el servidor.", { id: tid });
    resetStep3();
  }
} else {
        toast.error("Orden incorrecto.");
        resetStep3();
      }
    }
  };

  const resetStep3 = () => {
    setTimeout(() => {
      setSelectedIcons([]);
      setShuffledIcons([...shuffledIcons].sort(() => 0.5 - Math.random()));
    }, 1000);
  };

  return (
    <div style={{...s.container, padding: '40px 20px', textAlign: 'center'}}>
      <Toaster position="top-center" />
      <h2 style={{color: '#fff', marginBottom: '30px'}}>Verificación de Seguridad</h2>

      {/* --- PASO 1: CHECKBOX --- */}
      {step === 1 && (
        <div className="fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
              display: 'flex', alignItems: 'center', gap: '15px', 
              padding: '20px', background: '#1a1a1a', borderRadius: '8px', 
              border: '1px solid #333', width: '250px'
            }}
          >
            {/* Solo esta pequeña casilla tiene el evento onClick ahora */}
            <div 
              onClick={handleCheckboxClick}
              style={{ 
                width: '28px', height: '28px', border: '2px solid #888', borderRadius: '4px',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                cursor: 'pointer', background: isChecked ? '#00ccff' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              {isChecked && <span style={{ color: '#000', fontWeight: 'bold', fontSize: '18px' }}>✓</span>}
            </div>
            
            {/* Si quieres que el texto también sea clickeable, puedes agregarle el onClick también al span */}
            <span style={{ color: '#fff', fontSize: '16px' }}>Soy humano</span>
          </div>
        </div>
      )}

      {/* --- PASO 2: PUZZLE SLIDER --- */}
      {step === 2 && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <p style={{color: '#aaa'}}>Desliza para completar la imagen</p>
          
          <div style={{ 
            width: '280px', height: '150px', background: 'linear-gradient(45deg, #2a3b4c, #112233)', 
            borderRadius: '10px', position: 'relative', overflow: 'hidden', border: '2px solid #333'
          }}>
            <div style={{
              width: '40px', height: '40px', background: 'rgba(0,0,0,0.6)', 
              position: 'absolute', top: '55px', left: `${targetPosition}%`, 
              boxShadow: 'inset 0 0 10px #000', borderRadius: '5px'
            }}></div>

            <div style={{
              width: '40px', height: '40px', background: '#00ccff', 
              position: 'absolute', top: '55px', left: `${sliderValue}%`, 
              boxShadow: '0 0 10px #00ccff', borderRadius: '5px', opacity: 0.9,
              transition: 'left 0.1s ease-out'
            }}></div>
          </div>

          <input 
            type="range" 
            min="0" max="85" 
            value={sliderValue} 
            onChange={(e) => setSliderValue(e.target.value)}
            onMouseUp={handleSliderRelease}
            onTouchEnd={handleSliderRelease}
            style={{ width: '280px', marginTop: '10px' }}
          />
        </div>
      )}

      {/* --- PASO 3: ORDEN DE ICONOS --- */}
      {step === 3 && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: '#111', padding: '15px', borderRadius: '10px', width: '280px', border: '1px solid #333' }}>
            <p style={{color: '#888', margin: '0 0 10px 0'}}>Selecciona en este orden:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '24px' }}>
              {targetIcons.map((icon, i) => (
                <span key={i} style={{ opacity: selectedIcons.length > i ? 0.3 : 1 }}>{icon}</span>
              ))}
            </div>
          </div>

          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', 
            marginTop: '30px', width: '280px' 
          }}>
            {shuffledIcons.map((icon, i) => {
              const isSelected = selectedIcons.includes(icon);
              return (
                <button
                  key={i}
                  onClick={() => handleIconSelect(icon)}
                  disabled={isSelected}
                  style={{
                    fontSize: '30px', padding: '15px 0', borderRadius: '10px',
                    background: isSelected ? '#004466' : '#1a1a1a',
                    border: isSelected ? '2px solid #00ccff' : '2px solid #333',
                    opacity: isSelected ? 0.5 : 1, cursor: 'pointer', transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {icon}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: '5px', right: '5px', background: '#00ccff',
                      color: '#000', borderRadius: '50%', width: '20px', height: '20px',
                      fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                    }}>
                      {selectedIcons.indexOf(icon) + 1}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

    </div>
  );
}