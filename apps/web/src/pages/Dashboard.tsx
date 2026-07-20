import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, Baby, LogOut, Calendar, Shield, TrendingUp, ChevronRight, Bell } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

function getBabyAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 1) return 'Recién nacido';
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} año${years > 1 ? 's' : ''} y ${rem} mes${rem > 1 ? 'es' : ''}` : `${years} año${years > 1 ? 's' : ''}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [babies, setBabies] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) { navigate('/'); return; }
    setUser(JSON.parse(storedUser));
    axios.get(`${API_URL}/profiles/babies`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBabies(res.data))
      .catch(err => { if (err.response?.status === 401) { localStorage.clear(); navigate('/'); } });
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F7FC', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header style={{
        background: 'white', borderBottom: '1px solid #EDE9F8',
        boxShadow: '0 2px 16px rgba(45,38,64,0.04)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2.5rem', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'linear-gradient(135deg, #7C5CBF, #A07ADF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,92,191,0.3)' }}>
              <Heart size={18} color="white" fill="white" />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#2D2640', letterSpacing: '-0.01em' }}>Iniciativa Baby</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ width: '40px', height: '40px', borderRadius: '12px', border: '2px solid #EDE9F8', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Bell size={18} color="#8A849C" />
            </button>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px', border: '2px solid #EDE9F8', background: 'white', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#5a5a5a', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8F7FC'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}
            >
              <LogOut size={16} color="#8A849C" /> Salir
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '3rem 2.5rem' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#2D2640', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            ¡Hola, {user.nombre}! 👋
          </h1>
          <p style={{ fontSize: '18px', color: '#8A849C', fontWeight: 500 }}>Aquí tienes el resumen de tu familia.</p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '3rem' }}>
          {[
            { label: 'Bebés registrados', value: babies.length.toString(), icon: Baby, color: '#F4A0A0', bg: 'linear-gradient(135deg, #FFF0F0, #FFE5E5)' },
            { label: 'Próximas vacunas', value: '—', icon: Shield, color: '#7C5CBF', bg: 'linear-gradient(135deg, #F0EBF8, #E5DBF5)' },
            { label: 'Próximos controles', value: '—', icon: Calendar, color: '#6DBE9E', bg: 'linear-gradient(135deg, #EBF7F2, #DBF0EA)' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{
              background: 'white', borderRadius: '24px', padding: '2rem 2.5rem',
              boxShadow: '0 4px 20px rgba(45,38,64,0.05)', border: '1px solid #F0EEF8',
              display: 'flex', alignItems: 'center', gap: '20px',
            }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={28} color={color} />
              </div>
              <div>
                <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2D2640', lineHeight: 1, marginBottom: '6px' }}>{value}</p>
                <p style={{ fontSize: '14px', color: '#8A849C', fontWeight: 600 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bebés */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#2D2640' }}>Tus bebés</h2>
            {babies.length > 0 && (
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '14px', border: '2px solid #EDE9F8', background: 'white', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#7C5CBF' }}>
                Agregar bebé <ChevronRight size={16} />
              </button>
            )}
          </div>

          {babies.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '28px', padding: '4rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(45,38,64,0.05)', border: '2px dashed #EDE9F8' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#EDE9F8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Baby size={36} color="#7C5CBF" />
              </div>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#2D2640', marginBottom: '8px' }}>Aún no hay perfiles registrados</p>
              <p style={{ fontSize: '16px', color: '#8A849C', marginBottom: '2rem' }}>Registra a tu bebé para comenzar el seguimiento.</p>
              <button
                onClick={() => navigate('/registro')}
                style={{ padding: '14px 32px', borderRadius: '16px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7C5CBF, #A07ADF)', color: 'white', fontSize: '16px', fontWeight: 800, fontFamily: "'Nunito', sans-serif", boxShadow: '0 8px 24px rgba(124,92,191,0.35)' }}
              >
                Agregar bebé
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {babies.map(baby => (
                <div key={baby.id}
                  style={{ background: 'white', borderRadius: '28px', padding: '2rem 2.5rem', boxShadow: '0 4px 20px rgba(45,38,64,0.05)', border: '1px solid #F0EEF8', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(124,92,191,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(45,38,64,0.05)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'linear-gradient(135deg, #F4A0A0, #f9c5c5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Baby size={28} color="white" />
                    </div>
                    <ChevronRight size={20} color="#DDD9F0" />
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#2D2640', marginBottom: '4px' }}>{baby.nombre}</h3>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#7C5CBF', marginBottom: '12px' }}>{getBabyAge(baby.fecha_nacimiento)}</p>
                  <div style={{ height: '1px', background: '#F0EEF8', marginBottom: '14px' }} />
                  <p style={{ fontSize: '13px', color: '#8A849C', fontWeight: 600 }}>
                    Nacido el {new Date(baby.fecha_nacimiento).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>

                  {/* Mini stats */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '1.25rem' }}>
                    {[{ label: 'Vacunas', icon: Shield, color: '#7C5CBF' }, { label: 'Controles', icon: TrendingUp, color: '#6DBE9E' }].map(({ label, icon: Icon, color }) => (
                      <div key={label} style={{ flex: 1, padding: '10px 14px', borderRadius: '14px', background: '#F8F7FC', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={15} color={color} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#8A849C' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
