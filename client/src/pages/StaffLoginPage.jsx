import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNetwork } from '../context/NetworkContext';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  Stethoscope,
  Activity,
  Lock,
  Mail,
  WifiOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export function StaffLoginPage() {
  const { login, loading } = useAuth();
  const { isOnline } = useNetwork();
  const { lang, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState('worker'); // 'worker' or 'doctor'
  const [email, setEmail] = useState('worker@ruralcare.local');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [offlineNotice, setOfflineNotice] = useState(false);
  const passwordInputRef = useRef(null);

  // Check URL query parameters (e.g. ?role=doctor)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get('role');
    if (r === 'doctor') {
      setRole('doctor');
      setEmail('doctor@ruralcare.local');
    } else {
      setRole('worker');
      setEmail('worker@ruralcare.local');
    }
  }, [location.search]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMsg('');
    setPassword('');
    if (newRole === 'doctor') {
      setEmail('doctor@ruralcare.local');
    } else {
      setEmail('worker@ruralcare.local');
    }
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 100);
  };

  const handleUseDemoPassword = () => {
    setPassword(role === 'doctor' ? 'DoctorPass123' : 'WorkerPass123');
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setOfflineNotice(false);

    if (!password.trim()) {
      setErrorMsg(
        lang === 'ta'
          ? 'கடவுச்சொல்லை உள்ளிடவும்.'
          : 'Please enter your password to sign in.'
      );
      return;
    }

    const res = await login(email.trim(), password.trim());
    if (res.success) {
      if (res.offlineNotice) {
        setOfflineNotice(true);
        setTimeout(() => navigate('/patients'), 1000);
      } else {
        navigate('/patients');
      }
    } else {
      setErrorMsg(
        res.message ||
          (lang === 'ta'
            ? 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். தயவுசெய்து சரிபார்க்கவும்.'
            : 'Invalid credentials. Please verify your email and password.')
      );
    }
  };

  return (
    <div
      className="staff-login-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #f8fafc 100%)'
      }}
    >
      <div
        className="staff-login-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(15, 118, 110, 0.25)',
          border: '1.5px solid #cbd5e1'
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
              color: '#0f766e',
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
              color: role === 'doctor' ? '#0284c7' : '#0f766e',
              backgroundColor: role === 'doctor' ? '#f0f9ff' : '#ecfdf5',
              border: role === 'doctor' ? '1px solid #bae6fd' : '1px solid #a7f3d0',
              padding: '3px 10px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <UserCheck size={13} />
            {role === 'doctor'
              ? (lang === 'ta' ? 'மருத்துவர் தளம்' : 'Doctor / PHC Portal')
              : (lang === 'ta' ? 'சுகாதார பணியாளர் தளம்' : 'Health Worker Portal')}
          </span>
        </div>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: role === 'doctor'
                ? 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)'
                : 'linear-gradient(135deg, #0f766e 0%, #059669 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: role === 'doctor'
                ? '0 8px 24px rgba(2, 132, 199, 0.35)'
                : '0 8px 24px rgba(15, 118, 110, 0.35)',
              marginBottom: '12px',
              transition: 'all 0.25s'
            }}
          >
            {role === 'doctor' ? <Activity size={36} /> : <Stethoscope size={36} />}
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {lang === 'ta'
              ? (role === 'doctor' ? 'மருத்துவர் உள்நுழைவு' : 'சுகாதார பணியாளர் உள்நுழைவு')
              : (role === 'doctor' ? 'Doctor & Medical Officer' : 'Health Worker Portal')}
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 16px 0', fontWeight: 500 }}>
            {role === 'doctor'
              ? (lang === 'ta' ? 'நோயாளி பரிசோதனை, சிகிச்சை மற்றும் பரிந்துரை' : 'Clinical reviews, queue management & prescriptions')
              : (lang === 'ta' ? 'கள மதிப்பீடு, புதிய நோயாளி பதிவு மற்றும் சர்வே' : 'Field triage assessments, surveys & patient registration')}
          </p>

          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => changeLanguage('ta')}
              style={{
                border: 'none',
                backgroundColor: lang === 'ta' ? '#0f766e' : 'transparent',
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
                backgroundColor: lang === 'en' ? '#0f766e' : 'transparent',
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
              marginBottom: '16px',
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
                ? 'ஆஃப்லைன் முறை: சாதனத்தின் உள்ளூர் பணியாளர் கணக்கில் உள்நுழைகிறீர்கள்.'
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
              marginBottom: '16px',
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
              marginBottom: '16px',
              fontWeight: 600
            }}
          >
            {lang === 'ta' ? 'அமர்வு வெற்றிகரமாக திறக்கப்பட்டது!' : 'Session successfully unlocked!'}
          </div>
        )}

        {/* Switch Between Health Worker & Doctor Tab */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '14px', padding: '14px', border: '1.5px solid #e2e8f0', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
            {lang === 'ta' ? 'பணியாளர் வகையைத் தேர்ந்தெடுக்கவும்:' : 'SELECT STAFF ROLE:'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleRoleChange('worker')}
              style={{
                backgroundColor: role === 'worker' ? '#f0fdf4' : '#ffffff',
                border: role === 'worker' ? '2px solid #0f766e' : '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 800,
                color: role === 'worker' ? '#0f766e' : '#64748b',
                fontSize: '0.85rem',
                transition: 'all 0.15s'
              }}
            >
              <Stethoscope size={18} />
              <span>{lang === 'ta' ? 'சுகாதார பணியாளர்' : 'Health Worker'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('doctor')}
              style={{
                backgroundColor: role === 'doctor' ? '#f0f9ff' : '#ffffff',
                border: role === 'doctor' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 800,
                color: role === 'doctor' ? '#0284c7' : '#64748b',
                fontSize: '0.85rem',
                transition: 'all 0.15s'
              }}
            >
              <Activity size={18} />
              <span>{lang === 'ta' ? 'மருத்துவர் / PHC' : 'Doctor / PHC'}</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              {role === 'doctor'
                ? (lang === 'ta' ? 'மருத்துவர் மின்னஞ்சல்' : 'Doctor / PHC Email')
                : (lang === 'ta' ? 'பணியாளர் மின்னஞ்சல்' : 'Health Worker Email')}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                {lang === 'ta' ? 'கடவுச்சொல்' : 'Password'}
              </label>
              <button
                type="button"
                onClick={handleUseDemoPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: role === 'doctor' ? '#0284c7' : '#0f766e',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {role === 'doctor'
                  ? (lang === 'ta' ? 'கடவுச்சொல்: DoctorPass123' : 'Fill: DoctorPass123')
                  : (lang === 'ta' ? 'கடவுச்சொல்: WorkerPass123' : 'Fill: WorkerPass123')}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  role === 'doctor'
                    ? (lang === 'ta' ? 'கடவுச்சொல் (DoctorPass123)' : 'Enter password (DoctorPass123)')
                    : (lang === 'ta' ? 'கடவுச்சொல் (WorkerPass123)' : 'Enter password (WorkerPass123)')
                }
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
              backgroundColor: role === 'doctor' ? '#0284c7' : '#0f766e',
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
              boxShadow: role === 'doctor'
                ? '0 4px 14px rgba(2, 132, 199, 0.35)'
                : '0 4px 14px rgba(15, 118, 110, 0.35)',
              marginTop: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>
              {loading
                ? (lang === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying credentials...')
                : role === 'doctor'
                ? (lang === 'ta' ? 'மருத்துவராக உள்நுழைக' : 'Sign In as Doctor')
                : (lang === 'ta' ? 'பணியாளராக உள்நுழைக' : 'Sign In as Health Worker')}
            </span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Link to Admin Portal */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '8px' }}>
            {lang === 'ta' ? 'கணினி அமைப்புகளுக்கான நிர்வாக அணுகலா?' : 'Need system administration & database access?'}
          </div>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#7c3aed',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none'
            }}
          >
            <ShieldCheck size={16} />
            <span>{lang === 'ta' ? 'நிர்வாகி போர்டல் திறக்க →' : 'Administrator Portal →'}</span>
          </Link>
        </div>

        <div style={{ marginTop: '20px' }}>
          <DisclaimerBanner />
        </div>
      </div>
    </div>
  );
}

export default StaffLoginPage;
