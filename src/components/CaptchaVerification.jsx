import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { botApi } from '../api/botApi';
import { s } from '../styles/appStyles';

export default function CaptchaVerification({ userData, setIsHuman }) {
  const [captchaTarget, setCaptchaTarget] = useState(null);
  const [captchaOptions, setCaptchaOptions] = useState([]);

  const initCaptcha = () => {
    const items = [
      { icon: '🍎', name: 'la Manzana' }, { icon: '🚗', name: 'el Auto' },
      { icon: '🐶', name: 'el Perro' }, { icon: '🚀', name: 'el Cohete' },
      { icon: '🍕', name: 'la Pizza' }, { icon: '⚽', name: 'el Balón' }
    ];
    const shuffled = items.sort(() => 0.5 - Math.random());
    const selectedOptions = shuffled.slice(0, 4);
    setCaptchaOptions(selectedOptions);
    setCaptchaTarget(selectedOptions[Math.floor(Math.random() * selectedOptions.length)]);
  };

  useEffect(() => {
    initCaptcha();
  }, []);

  const handleValidate = async (item) => {
    if (item.icon === captchaTarget?.icon) {
      const tid = toast.loading("Validando seguridad...");
      try {
        const res = await botApi.verifyHuman(userData.id, 'app-verified-fast');
        if (res.success) {
          setIsHuman(true);
          toast.success("¡Acceso concedido!", { id: tid });
        }
      } catch (e) {
        toast.error("Validación fallida.", { id: tid });
      }
    } else {
      toast.error("Incorrecto, intenta de nuevo.");
      initCaptcha(); 
    }
  };

  return (
    <div style={{...s.container, padding: '50px 20px', textAlign: 'center'}}>
      <Toaster position="top-center" />
      <h2 style={{color: '#0088cc'}}>¡Verificación Rápida! ⚡</h2>
      <p style={{color: '#888', fontSize: '15px', marginBottom: '30px'}}>
        Demuestra que eres humano tocando <b>{captchaTarget?.name}</b>:
      </p>

      <div style={{display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '30px'}}>
        {captchaOptions.map((item, index) => (
          <button 
            key={index}
            onClick={() => handleValidate(item)}
            style={{
              fontSize: '40px', padding: '15px', borderRadius: '15px', 
              background: '#1a1a1a', border: '2px solid #333', cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <p style={{fontSize: '12px', color: '#555', marginTop: '40px'}}>
        Esta verificación solo aparece la primera vez que inicies.
      </p>
    </div>
  );
}
