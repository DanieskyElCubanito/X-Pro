import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { createClient } from '@supabase/supabase-js';
import { s } from '../styles/appStyles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://shfogfihzkwmusarhlxv.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "TU_CLAVE_ANONIMA_PUBLICA"; 
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ProfileHeader({ userData }) {
  // 1. Usamos 'balance' en lugar de 'points'
  const [ptBalance, setPtBalance] = useState(Number(userData?.balance || 0));

  // 2. Sincronizamos con userData?.balance
  useEffect(() => {
    if (userData?.balance !== undefined) {
      setPtBalance(Number(userData.balance));
    }
  }, [userData?.balance]);

  // 3. Escuchador en Tiempo Real apuntando a 'balance'
  useEffect(() => {
    if (!userData?.id) return;

    const channel = supabase
      .channel('actualizaciones-balance')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userData.id}`
        },
        (payload) => {
          console.log("Cambio en base de datos detectado:", payload.new);
          // Validamos contra payload.new.balance
          if (payload.new && payload.new.balance !== undefined) {
            setPtBalance(Number(payload.new.balance));
          }
        }
      )
      .subscribe();

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
