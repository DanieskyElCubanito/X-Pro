import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { createClient } from '@supabase/supabase-js';
import { s } from '../styles/appStyles';

// ⚠️ IMPORTANTE: Crea tu cliente de Supabase usando la URL y la clave ANÓNIMA (anon key).
// NO uses el "sb_secret..." aquí porque este código es público en el frontend.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://shfogfihzkwmusarhlxv.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "TU_CLAVE_ANONIMA_PUBLICA"; 
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ProfileHeader({ userData }) {
  // 1. Convertimos los puntos en un "Estado" de React para poder cambiarlos dinámicamente
  const [ptBalance, setPtBalance] = useState(Number(userData?.points || 0));

  // 2. Mantenemos sincronizado el balance si userData cambia al recargar el componente padre
  useEffect(() => {
    if (userData?.points !== undefined) {
      setPtBalance(Number(userData.points));
    }
  }, [userData?.points]);

  // 3. Escuchador en Tiempo Real de Supabase
  useEffect(() => {
    if (!userData?.id) return;

    // Nos suscribimos a los cambios de este usuario en la tabla 'users'
    const channel = supabase
      .channel('actualizaciones-puntos')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userData.id}` // Filtramos para que solo escuche a este usuario
        },
        (payload) => {
          console.log("Cambio en base de datos detectado:", payload.new);
          // Si el balance en la DB cambió, actualizamos la pantalla automáticamente
          if (payload.new && payload.new.points !== undefined) {
            setPtBalance(Number(payload.new.points));
          }
        }
      )
      .subscribe();

    // Limpiamos la conexión cuando el usuario se va de la pestaña
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  return (
    <div style={{ ...s.profileHeader, flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <img 
          src={WebApp.initDataUnsafe?.user?.photo_url || 'https://via.placeholder.com/100'} 
          style={s.profileAvatar} 
          alt="avatar" 
        />
        <div style={{ marginLeft: '15px' }}>
          <p style={s.profileName}>{userData?.username || 'Usuario'}</p>
          <p style={s.profileId}>ID: {userData?.id}</p>
        </div>
      </div>

      {/* Panel de Puntos (PT) */}
      <div style={{ backgroundColor: '#004466', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Mis Puntos Acumulados</p>
        <p style={{ margin: '5px 0 0', fontSize: '20px', color: '#FFD700', fontWeight: 'bold' }}>🪙 {ptBalance} PT</p>
      </div>
    </div>
  );
}