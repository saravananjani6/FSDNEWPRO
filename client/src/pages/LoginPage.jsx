import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNetwork } from '../context/NetworkContext';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  ShieldCheck,
  Lock,
  Mail,
  WifiOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Stethoscope,
  Info
} from 'lucide-react';

export function LoginPage() {
  const { login, loading } = useAuth();
  const { isOnline } = useNetwork();
  const { lang, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@ruralcare.local');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [offlineNotice, setOfflineNotice] = useState(false);
  const passwordInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setOfflineNotice(false);

    if (!password.trim()) {
      setErrorMsg(
        lang === 'ta'
          ? 'நிர்வாக கடவுச்சொல்லை உள்ளிடவும். கடவுச்சொல் இல்லாமல் உள்நுழைய முடியாது.'
          : 'Please enter your administrator password.'
      );
      return;
    }

    const res = await login(email.trim(), password.trim());
    if (res.success) {
      if (res.offlineNotice) {
        setOfflineNotice(true);
        setTimeout(() => navigate('/'), 1000);
      } else {
        navigate('/');
      }
    } else {
      setErrorMsg(
        res.message ||
          (lang === 'ta'
            ? 'தவறான நிர்வாக மின்னஞ்சல் அல்லது கடவுச்சொல்.'
            : 'Invalid credentials. Please verify your admin email and password.')
      );
    }
  };

  const handleUseDemoPassword = () => {
    setPassword('AdminPass123');
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  return (
    <div
      className="login-page-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
      }}
    >
      <div
        className="login-card-shell"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          border: '1.5px solid #334155'
        }}
      >
        {/* Navigation Top Row */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#6366f1',
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} />
            <span>{lang === 'ta' ? 'நோயாளி முகப்பு' : 'Patient Home'}</span>
          </Link>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#7c3aed',
              backgroundColor: '#f5f3ff',
              border: '1px solid #ddd6fe',
              padding: '3px 10px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ShieldCheck size={13} />
            {lang === 'ta' ? 'பாதுகாக்கப்பட்ட நிர்வாகி தளம்' : 'Administrator Portal'}
          </span>
        </div>

        {/* Brand Header — Dedicated Administrator Look */}
        <div className="login-brand" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
              marginBottom: '12px'
            }}
          >
            <ShieldCheck size={38} />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {lang === 'ta' ? 'நிர்வாகி உள்நுழைவு' : 'Administrator Portal'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 16px 0', fontWeight: 500 }}>
            {lang === 'ta'
              ? 'கணினி அமைப்புகள், தணிக்கை பதிவுகள் மற்றும் தரவுத்தள மேலாண்மை'
              : 'Authorized healthcare system & database administration only'}
          </p>

          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => changeLanguage('ta')}
              style={{
                border: 'none',
                backgroundColor: lang === 'ta' ? '#7c3aed' : 'transparent',
                color: lang === 'ta' ? '#ffffff' : '#475569',
                padding: '5px 16px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => changeLanguage('en')}
              style={{
                border: 'none',
                backgroundColor: lang === 'en' ? '#7c3aed' : 'transparent',
                color: lang === 'en' ? '#ffffff' : '#475569',
                padding: '5px 16px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              English
            </button>
          </div>
        </div>

        {/* Offline indicator if disconnected */}
        {!isOnline && (
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              color: '#b45309'
            }}
          >
            <WifiOff size={16} />
            <span>
              {lang === 'ta'
                ? 'ஆஃப்லைன் முறை: சாதனத்தின் உள்ளூர் நிர்வாக கணக்கில் உள்நுழைகிறீர்கள்.'
                : 'Offline mode: Operating from local device authentication cache.'}
            </span>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#dc2626',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              marginBottom: '18px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Offline Unlock Notification */}
        {offlineNotice && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              color: '#16a34a',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              marginBottom: '18px',
              fontWeight: 600
            }}
          >
            {lang === 'ta' ? 'நிர்வாக அமர்வு வெற்றிகரமாக திறக்கப்பட்டது!' : 'Admin session successfully unlocked!'}
          </div>
        )}

        {/* Admin Login Form — Strictly Admin Credentials */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              {lang === 'ta' ? 'நிர்வாக மின்னஞ்சல் முகவரி' : 'Administrator Email'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ruralcare.local"
                required
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 40px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                {lang === 'ta' ? 'நிர்வாக கடவுச்சொல்' : 'Administrator Password'}
              </label>
              <button
                type="button"
                onClick={handleUseDemoPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7c3aed',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {lang === 'ta' ? 'கடவுச்சொல்: AdminPass123' : 'Fill: AdminPass123'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={lang === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும் (AdminPass123)' : 'Enter password (AdminPass123)'}
                required
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 40px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              padding: '13px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.98rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              marginTop: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>
              {loading
                ? (lang === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying credentials...')
                : (lang === 'ta' ? 'நிர்வாகியாக உள்நுழைக' : 'Sign In as Administrator')}
            </span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Link to Health Worker & Doctor Portal */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '8px' }}>
            {lang === 'ta' ? 'நீங்கள் சுகாதார பணியாளரா அல்லது மருத்துவரா?' : 'Are you a Health Worker or Doctor?'}
          </div>
          <Link
            to="/staff-login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0284c7',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none'
            }}
          >
            <Stethoscope size={16} />
            <span>{lang === 'ta' ? 'சுகாதார பணியாளர் & மருத்துவர் தளம் →' : 'Clinical Staff & Doctor Portal →'}</span>
          </Link>
        </div>

        <div style={{ marginTop: '20px' }}>
          <DisclaimerBanner />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
