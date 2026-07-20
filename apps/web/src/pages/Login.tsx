import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, Lock, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Por favor completa todos los campos.'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', background: '#F8F7FC', fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '620px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '2.5rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #7C5CBF, #A07ADF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(124,92,191,0.4)',
          }}>
            <Heart size={26} color="white" fill="white" />
          </div>
          <span style={{ fontSize: '26px', fontWeight: 900, color: '#2D2640', letterSpacing: '-0.01em' }}>
            Iniciativa Baby
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: '32px',
          boxShadow: '0 12px 50px rgba(45,38,64,0.09)',
          padding: '4rem 4.5rem',
        }}>

          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '34px', fontWeight: 900, color: '#2D2640', marginBottom: '10px' }}>
              Bienvenida de vuelta
            </h1>
            <p style={{ fontSize: '18px', color: '#8A849C', fontWeight: 500 }}>
              Ingresa a tu espacio seguro
            </p>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '16px 20px', borderRadius: '16px',
              background: '#FFF0F0', border: '1px solid rgba(244,160,160,0.4)',
              marginBottom: '24px',
            }}>
              <AlertCircle size={22} color="#F4A0A0" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '16px', color: '#D97070', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D2640',
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px',
              }}>
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="tu.email@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '18px 22px',
                  border: '2px solid #EDE9F8', borderRadius: '18px',
                  fontSize: '18px', fontFamily: "'Nunito', sans-serif",
                  fontWeight: 500, color: '#2D2640', background: '#FDFCFF',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#7C5CBF'; e.target.style.boxShadow = '0 0 0 5px rgba(124,92,191,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#EDE9F8'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D2640',
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px',
              }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '18px 60px 18px 22px',
                    border: '2px solid #EDE9F8', borderRadius: '18px',
                    fontSize: '18px', fontFamily: "'Nunito', sans-serif",
                    fontWeight: 500, color: '#2D2640', background: '#FDFCFF',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#7C5CBF'; e.target.style.boxShadow = '0 0 0 5px rgba(124,92,191,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#EDE9F8'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                  position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9C94BC', padding: '4px',
                }}>
                  {showPwd ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '20px', borderRadius: '20px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#E5E3EC' : 'linear-gradient(135deg, #7C5CBF, #A07ADF)',
                color: loading ? '#B0ABC4' : 'white',
                fontSize: '20px', fontWeight: 800, fontFamily: "'Nunito', sans-serif",
                marginTop: '6px',
                boxShadow: loading ? 'none' : '0 12px 32px rgba(124,92,191,0.4)',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              {loading
                ? <><div style={{ width: '22px', height: '22px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Procesando...</>
                : <><LogIn size={24} /> Iniciar Sesión</>
              }
            </button>
          </form>

          {/* Trust row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #F0EEF8',
          }}>
            <Lock size={16} color="#8A849C" />
            <span style={{ fontSize: '14px', color: '#8A849C', fontWeight: 500 }}>
              Sesión encriptada con nivel bancario
            </span>
          </div>
        </div>

        {/* Register link */}
        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '17px', color: '#8A849C' }}>
          ¿Eres nueva aquí?{' '}
          <Link to="/registro" style={{ fontWeight: 800, color: '#7C5CBF', textDecoration: 'none' }}>
            Crea tu cuenta gratis
          </Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
