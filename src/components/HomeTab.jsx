import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';
import { botApi } from '../api/botApi';

const neon = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
  iconBtn: { width: '46px', height: '46px', background: 'rgba(15, 5, 28, 0.8)', border: '2px solid #8a2be2', borderRadius: '14px', boxShadow: '0 0 10px rgba(138, 43, 226, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', color: '#ffffff' },
  title: { fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', textTransform: 'uppercase', color: '#00f0ff', margin: 0, textShadow: '0 0 15px rgba(0, 240, 255, 0.4)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' },
  statCard: (borderColor, bgColor, glowColor) => ({ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '20px', boxShadow: `0 4px 15px ${glowColor}`, padding: '16px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }),
  statInnerIcon: { width: '36px', height: '36px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '10px' },
  statNumber: { fontSize: '22px', fontWeight: '900', lineHeight: '1.1', marginBottom: '6px', color: '#ffffff' },
  statDesc: { fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.2', color: '#ff99dd' },
  infoCard: { background: 'linear-gradient(145deg, rgba(46, 16, 77, 0.6), rgba(20, 8, 38, 0.8))', border: '2px solid #8a2be2', borderRadius: '26px', boxShadow: '0 8px 24px rgba(138, 43, 226, 0.2)', padding: '20px 18px', marginBottom: '20px' },
  howTitle: { fontSize: '14px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#ffe600', marginBottom: '16px' },
  howStep: { display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0' },
  howStepIcon: (bgColor, textColor, glowColor) => ({ width: '44px', height: '44px', background: bgColor, color: textColor, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', flexShrink: 0, boxShadow: `0 0 15px ${glowColor}` }),
  howStepText: { fontSize: '14px', fontWeight: '800', lineHeight: '1.3', color: '#ffffff' },
  dashedDivider: { border: 'none', borderTop: '2px dashed rgba(255, 65, 180, 0.4)', margin: '6px 0' },
  btnClick: { width: '100%', background: 'linear-gradient(180deg, #ff1493 0%, #d80073 100%)', color: '#ffffff', border: 'none', borderRadius: '20px', boxShadow: '0 6px 0 #8b004b, 0 10px 20px rgba(255, 20, 147, 0.4)', padding: '16px', fontSize: '15px', fontWeight: '900', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', marginBottom: '12px' },
  btnCrypto: { width: '100%', background: 'linear-gradient(180deg, #00f0ff 0%, #0088ff 100%)', color: '#050214', border: 'none', borderRadius: '20px', boxShadow: '0 6px 0 #0055aa, 0 10px 25px rgba(0, 240, 255, 0.5)', padding: '16px', fontSize: '15px', fontWeight: '900', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 2, 20, 0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100000 },
  modalContent: { width: '100%', height: '80vh', background: 'linear-gradient(180deg, rgba(46, 16, 77, 0.95), rgba(20, 8, 38, 1))', borderTop: '2px solid #00f0ff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 30px rgba(0, 240, 255, 0.2)' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(15, 5, 28, 0.8)', borderRadius: '12px', border: '1px solid rgba(138, 43, 226, 0.5)', marginBottom: '8px' },
  
  packCard: (active) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: active ? 'rgba(0, 240, 255, 0.15)' : 'rgba(15, 5, 28, 0.8)', border: active ? '2px solid #00f0ff' : '2px solid #8a2be2', borderRadius: '16px', marginBottom: '12px', cursor: 'pointer', transition: '0.2s', boxShadow: active ? 'inset 0 0 15px rgba(0, 240, 255, 0.3)' : 'none' }),
  methodCard: (active) => ({ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: active ? 'rgba(255, 20, 147, 0.15)' : 'rgba(15, 5, 28, 0.8)', border: active ? '2px solid #ff1493' : '2px solid #8a2be2', borderRadius: '16px', marginBottom: '12px', cursor: 'pointer', transition: '0.2s', boxShadow: active ? 'inset 0 0 15px rgba(255, 20, 147, 0.3)' : 'none' })
};

const PACKAGES = [
  { id: 1, clicks: 100, priceGram: 0.5, priceStars: 50 },
  { id: 2, clicks: 500, priceGram: 2.5, priceStars: 250 },
  { id: 3, clicks: 1000, priceGram: 5.0, priceStars: 500, popular: true }
];

const METHODS = [
  { id: 'stars', name: 'Telegram Stars', icon: '⭐', desc: 'Pago nativo sin salir de la app', color: '#ffe600' },
  { id: 'gram', name: 'GRAM', icon: '💎', desc: 'Moneda nativa de la Red TON', color: '#00f0ff' }
];

// Agregado setUserData en los parámetros para poder actualizar el saldo
export default function HomeTab({ userData, setUserData, setActiveTab }) {
  const [showHistory, setShowHistory] = useState(false);
  const [realHistory, setRealHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Estados de la pasarela
  const [showCryptoGateway, setShowCryptoGateway] = useState(false);
  const [payStep, setPayStep] = useState(1); 
  const [selectedPack, setSelectedPack] = useState(PACKAGES[0]);
  const [selectedMethod, setSelectedMethod] = useState(METHODS[0]);

  // Estados para Billeteras Únicas Generadas
  const [isGenerating, setIsGenerating] = useState(false);
  const [tempWallet, setTempWallet] = useState('');
  const [intentId, setIntentId] = useState(null);

  const clickBalance = Number(userData?.balance || 0).toFixed(2);
  const globalClicks = userData?.global_clicks || '0';
  const clicksReceived = userData?.clicks_received || '0';

  const openHistory = async () => {
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const res = await botApi.getHistory(userData.id);
      if (res.success) setRealHistory(res.history);
    } catch (e) {
      toast.error("Error al cargar historial");
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  // Función que intercepta el paso 2 y llama al backend para crear la billetera
  const handleProceedToPay = async () => {
    if (selectedMethod.id === 'gram') {
      setIsGenerating(true);
      const tid = toast.loading("Generando tu billetera única de pago...");
      try {
        const res = await botApi.generatePaymentWallet({
          userId: userData.id,
          packageId: selectedPack.id,
          price: selectedPack.priceGram,
          clicks: selectedPack.clicks
        });
        
        if (res.success) {
          setTempWallet(res.wallet);
          setIntentId(res.intentId);
          toast.dismiss(tid);
          setPayStep(3);
        }
      } catch (e) {
        toast.error(e.message || "Error al conectar con la blockchain. Reintenta.", { id: tid });
      } finally {
        setIsGenerating(false);
      }
    } else {
      setPayStep(3); // Para Stars pasa directo al paso 3
    }
  };

  const copyWallet = () => {
    navigator.clipboard.writeText(tempWallet);
    toast.success("Billetera copiada al portapapeles");
  };

  const openTonkeeper = () => {
    const amountStr = selectedPack.priceGram * 1e9; 
    // Ya no requerimos MEMO, la billetera es única
    const url = `ton://transfer/${tempWallet}?amount=${amountStr}`;

    try {
      WebApp.openLink(url);
    } catch (error) {
      toast.error("Tu dispositivo no encontró una billetera compatible instalada.");
    }
  };

  // Función de Verificación Real en Blockchain
  const handleVerifyPayment = async () => {
    const tid = toast.loading("Verificando transacción en la blockchain...");
    try {
      const res = await botApi.verifyCryptoPayment({
        userId: userData.id,
        intentId: intentId,
        clicks: selectedPack.clicks
      });

      if (res.success) {
        toast.success(`¡Pago Exitoso! Añadimos ${selectedPack.clicks} CLICKs a tu saldo.`, { id: tid, duration: 4000 });
        // Actualizamos el saldo visualmente
        if (setUserData) {
          setUserData(prev => ({ ...prev, balance: res.balance }));
        }
        setShowCryptoGateway(false);
        setPayStep(1);
      }
    } catch (e) {
      toast.error(e.message || "Aún no detectamos el pago. Si ya enviaste los fondos, espera 1 minuto y vuelve a presionar.", { id: tid, duration: 6000 });
    }
  };

  const handleStarsPayment = async () => {
    const tid = toast.loading("Conectando con Telegram...");
    setTimeout(() => {
      toast.error("El servidor backend aún no tiene la ruta para generar facturas de Stars. Contáctate con el desarrollador.", { id: tid, duration: 5000 });
    }, 2000);
  };

  return (
    <div className="fade-in" style={neon.container}>

      {/* Esto asegura que las notificaciones salgan por encima de todo */}
      <Toaster containerStyle={{ zIndex: 9999999 }} />

      <div style={neon.header}>
        <div onClick={openHistory} style={neon.iconBtn}>🕒</div>
        <h1 style={neon.title}>INICIO</h1>
        <div style={{ width: '46px' }}></div> 
      </div>

      <div style={neon.statsGrid}>
        <div style={neon.statCard('#8a2be2', 'rgba(138, 43, 226, 0.2)', 'rgba(138, 43, 226, 0.3)')}>
          <div style={neon.statInnerIcon}>🌐</div>
          <div style={neon.statNumber}>{globalClicks}</div>
          <div style={{...neon.statDesc, color: '#ff99dd'}}>Clicks Globales</div>
        </div>
        <div style={neon.statCard('#00f0ff', 'rgba(0, 240, 255, 0.1)', 'rgba(0, 240, 255, 0.3)')}>
          <div style={neon.statInnerIcon}>⚡</div>
          <div style={{...neon.statNumber, color: '#00f0ff'}}>{clickBalance}</div>
          <div style={{...neon.statDesc, color: '#ffffff'}}>Saldo</div>
        </div>
        <div style={neon.statCard('#ff1493', 'rgba(255, 20, 147, 0.2)', 'rgba(255, 20, 147, 0.3)')}>
          <div style={neon.statInnerIcon}>📥</div>
          <div style={neon.statNumber}>{clicksReceived}</div>
          <div style={{...neon.statDesc, color: '#ff99dd'}}>Recibidos</div>
        </div>
      </div>

      <div style={neon.infoCard}>
        <div style={neon.howTitle}>MERCADO DE TRÁFICO</div>
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#00f0ff', '#050214', 'rgba(0, 240, 255, 0.4)')}>+</div>
          <div style={neon.howStepText}>Crea una campaña y atrae usuarios a tu Bot o Grupo.</div>
        </div>
        <hr style={neon.dashedDivider} />
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#ffe600', '#050214', 'rgba(255, 230, 0, 0.4)')}>⚡</div>
          <div style={neon.howStepText}>Completa tareas de otros para ganar saldo CLICK gratis.</div>
        </div>
        <hr style={neon.dashedDivider} />
        <div style={neon.howStep}>
          <div style={neon.howStepIcon('#ff1493', '#ffffff', 'rgba(255, 20, 147, 0.4)')}>💎</div>
          <div style={neon.howStepText}>Recarga saldo con Stars o GRAM para campañas grandes.</div>
        </div>
      </div>

      <button onClick={() => setActiveTab ? setActiveTab('tasks') : toast('Toca ⚡ MERCADO abajo.', {icon: '⚡'})} style={neon.btnClick}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>+</span> IR AL MERCADO 1x1
        </div>
        <span style={{ fontSize: '10px', color: '#ffb3d9', fontWeight: 'bold', textTransform: 'none' }}>Usa tu saldo CLICK</span>
      </button>

      <button onClick={() => setShowCryptoGateway(true)} style={neon.btnCrypto}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💎</span> RECARGAR SALDO CLICK
        </div>
        <span style={{ fontSize: '10px', color: '#050214', fontWeight: 'bold', textTransform: 'none' }}>Paga con Stars / GRAM</span>
      </button>

      {/* MODAL DE PASARELA DE PAGOS */}
      {showCryptoGateway && (
        <div className="fade-in" style={neon.modalOverlay}>
          <div style={neon.modalContent}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              {payStep > 1 ? (
                <button onClick={() => setPayStep(payStep - 1)} style={{ background: 'transparent', border: 'none', color: '#00f0ff', fontSize: '20px', cursor: 'pointer' }}>◀</button>
              ) : <div></div>}
              <h3 style={{ margin: 0, color: '#ffe600', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase' }}>
                {payStep === 1 ? 'Adquirir Saldo' : payStep === 2 ? 'Método de Pago' : 'Finalizar Pago'}
              </h3>
              <button onClick={() => { setShowCryptoGateway(false); setPayStep(1); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
            </div>

            {/* PASO 1 */}
            {payStep === 1 && (
              <div className="fade-in" style={{ flex: 1, overflowY: 'auto' }}>
                <p style={{ color: '#ff99dd', fontSize: '13px', marginBottom: '16px', fontWeight: 'bold' }}>Elige cuántos CLICKs necesitas para tus campañas de tráfico:</p>
                {PACKAGES.map((pkg) => (
                  <div key={pkg.id} onClick={() => setSelectedPack(pkg)} style={neon.packCard(selectedPack.id === pkg.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '24px', filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.5))' }}>⚡</div>
                      <div>
                        <div style={{ color: '#fff', fontSize: '18px', fontWeight: '900' }}>{pkg.clicks} CLICK</div>
                        {pkg.popular && <span style={{ background: 'linear-gradient(90deg, #ff1493, #d80073)', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>Más Popular</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#00f0ff', fontWeight: '900', fontSize: '14px' }}>~ {pkg.priceGram} GRAM</div>
                      <div style={{ color: '#888', fontSize: '10px' }}>o {pkg.priceStars} ⭐</div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setPayStep(2)} style={{ width: '100%', padding: '14px', marginTop: '10px', background: 'linear-gradient(90deg, #00f0ff, #0088ff)', color: '#050214', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px' }}>CONTINUAR ➔</button>
              </div>
            )}

            {/* PASO 2 */}
            {payStep === 2 && (
              <div className="fade-in" style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '16px', borderRadius: '16px', border: '1px dashed #00f0ff', marginBottom: '16px', textAlign: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>Paquete seleccionado:</span><br/>
                  <span style={{ color: '#00f0ff', fontSize: '24px', fontWeight: '900' }}>{selectedPack.clicks} CLICK</span>
                </div>
                <p style={{ color: '#ff99dd', fontSize: '13px', marginBottom: '16px', fontWeight: 'bold' }}>¿Cómo deseas pagar?</p>
                {METHODS.map((method) => (
                  <div key={method.id} onClick={() => setSelectedMethod(method)} style={neon.methodCard(selectedMethod.id === method.id)}>
                    <div style={{ fontSize: '30px', filter: `drop-shadow(0 0 10px ${method.color})` }}>{method.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '15px', fontWeight: '900' }}>{method.name}</div>
                      <div style={{ color: '#aaa', fontSize: '11px' }}>{method.desc}</div>
                    </div>
                    <div style={{ color: method.color, fontWeight: '900', fontSize: '16px' }}>
                      {method.id === 'gram' ? selectedPack.priceGram : selectedPack.priceStars}
                    </div>
                  </div>
                ))}
                <button onClick={handleProceedToPay} disabled={isGenerating} style={{ width: '100%', padding: '14px', marginTop: '10px', background: 'linear-gradient(90deg, #ff1493, #d80073)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px' }}>
                  {isGenerating ? 'GENERANDO BILLETERA...' : 'PROCEDER AL PAGO ➔'}
                </button>
              </div>
            )}

            {/* PASO 3 */}
            {payStep === 3 && (
              <div className="fade-in" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'rgba(15, 5, 28, 0.8)', padding: '20px', borderRadius: '16px', border: '1px solid #8a2be2', textAlign: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px', filter: `drop-shadow(0 0 15px ${selectedMethod.color})` }}>{selectedMethod.icon}</span>
                  <div style={{ color: '#aaa', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Total a pagar</div>
                  <div style={{ color: selectedMethod.color, fontSize: '32px', fontWeight: '900', margin: '4px 0' }}>
                    {selectedMethod.id === 'gram' ? selectedPack.priceGram : selectedPack.priceStars} {selectedMethod.id.toUpperCase()}
                  </div>
                  <div style={{ color: '#00f0ff', fontSize: '13px', fontWeight: 'bold' }}>Recibes: {selectedPack.clicks} CLICK ⚡</div>
                </div>

                {selectedMethod.id === 'stars' ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                    <p style={{ textAlign: 'center', color: '#ff99dd', fontSize: '13px', lineHeight: '1.5', fontWeight: 'bold' }}>
                      Se generará una factura segura mediante la API oficial de Telegram.
                    </p>
                    <button onClick={handleStarsPayment} style={{ width: '100%', padding: '16px', background: 'linear-gradient(90deg, #ffe600, #ffaa00)', color: '#050214', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '16px', boxShadow: '0 6px 0 #cc8800' }}>
                      ⭐ PAGAR {selectedPack.priceStars} STARS
                    </button>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid #00f0ff', textAlign: 'center' }}>
                      <span style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>🛡️ Billetera Única Segura</span>
                      <p style={{ color: '#fff', fontSize: '11px', margin: '6px 0 0 0' }}>Esta dirección fue generada exclusivamente para ti. Envía el monto exacto y verificaremos tu pago automáticamente.</p>
                    </div>

                    <div style={{ background: '#0a0314', padding: '16px', borderRadius: '12px', border: '1px dashed #00f0ff', wordBreak: 'break-all', textAlign: 'center', color: '#fff', fontFamily: 'monospace', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {tempWallet}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={copyWallet} style={{ flex: 1, padding: '12px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', border: '1px solid #00f0ff', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>📋 COPIAR DIRECCIÓN</button>
                      <button onClick={openTonkeeper} style={{ flex: 1, padding: '12px', background: '#0088cc', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>💎 ABRIR TONKEEPER</button>
                    </div>
                    
                    <button onClick={handleVerifyPayment} style={{ width: '100%', padding: '16px', marginTop: 'auto', background: 'linear-gradient(180deg, #00ffaa, #00bb77)', color: '#050214', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px', boxShadow: '0 6px 0 #007744' }}>
                      ✅ YA PAGUÉ, VERIFICAR
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE HISTORIAL */}
      {showHistory && (
        <div className="fade-in" style={neon.modalOverlay} onClick={() => setShowHistory(false)}>
          <div style={neon.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#00f0ff', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>
                🕒 Mi Historial
              </h3>
              <button onClick={() => setShowHistory(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#00f0ff', fontWeight: 'bold' }}>Cargando transacciones...</div>
              ) : realHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#ff99dd', fontWeight: 'bold' }}>Aún no hay movimientos recientes.</div>
              ) : (
                realHistory.map((item) => (
                  <div key={item.id} style={neon.historyItem}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}>{item.title}</div>
                      <div style={{ color: '#ff99dd', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>{formatDate(item.date)}</div>
                    </div>
                    <div style={{ color: item.type === 'earn' ? '#00ffaa' : '#ffe600', fontSize: '16px', fontWeight: '900', textShadow: item.type === 'earn' ? '0 0 5px rgba(0,255,170,0.5)' : 'none' }}>
                      {item.amount}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
