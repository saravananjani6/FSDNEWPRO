import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from '../../context/SyncContext';
import {
  HeartPulse,
  Users,
  UserPlus,
  Stethoscope,
  RefreshCw,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Globe,
  Menu,
  X,
  Lock,
  Download,
  Activity,
  FileText,
  MapPin,
  PhoneCall,
  Compass,
  AlertTriangle,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const { lang, changeLanguage, t } = useLanguage();
  const { pendingCount } = useSync();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isAdmin = user && user.role === 'admin';
  const isStaff = user && (user.role === 'health_worker' || user.role === 'doctor');

  // Listen for PWA Install Prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Close drawer on route change or Escape key
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        lang === 'ta'
          ? 'செயலியை உங்கள் சாதனத்தில் நிறுவ உலாவி மெனுவில் "Install App" அல்லது "Add to Home Screen" கிளிக் செய்யவும்.'
          : 'To install this app on Windows or mobile, click "Install App" or "Add to Home screen" in your browser address bar/menu.'
      );
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          {/* Brand & App Mode Badge */}
          <Link to="/" className="brand-logo" onClick={() => setMenuOpen(false)}>
            <div className="brand-icon-wrapper">
              <HeartPulse size={26} className="brand-pulse" />
            </div>
            <div className="brand-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="brand-title">{t('app_title')}</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: isAdmin ? '#0284c7' : '#10b981',
                    color: '#ffffff',
                    letterSpacing: '0.04em'
                  }}
                >
                  {isAdmin ? 'ADMIN' : 'PATIENT APP'}
                </span>
              </div>
              <span className="brand-subtitle">{t('app_subtitle')}</span>
            </div>
          </Link>

          {/* Quick Action Shortcuts & 3-Line Menu Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Quick 108 Emergency Call Button */}
            {false && <a
              href="tel:108"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 800,
                textDecoration: 'none'
              }}
              title={lang === 'ta' ? 'அவசர 108 ஆம்புலன்ஸ்' : 'Emergency 108 Ambulance'}
            >
              <PhoneCall size={14} />
              <span>108</span>
            </a>}

            {/* Sync Status Button */}
            <Link
              to="/sync"
              className={`btn-sync-pill ${pendingCount > 0 ? 'has-pending' : ''}`}
              title={t('nav_sync')}
            >
              <RefreshCw size={15} />
              <span>{pendingCount > 0 ? `${pendingCount}` : (lang === 'ta' ? 'இணைப்பு' : 'Sync')}</span>
            </Link>

            {/* Language Toggle Button */}
            <button
              onClick={() => changeLanguage(lang === 'ta' ? 'en' : 'ta')}
              className="btn-lang-toggle"
              title="Switch Language / மொழியை மாற்றுக"
            >
              <Globe size={16} />
              <span className="lang-code">{lang === 'ta' ? 'தமிழ்' : 'English'}</span>
            </button>

            {/* THE 3-LINE MENU ICON BUTTON (Requested by User) */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="btn-nav-hamburger"
              aria-label="Toggle navigation menu"
              title="Open Navigation Menu / மெனு திறக்க"
            >
              <Menu size={20} />
              <span>{lang === 'ta' ? 'மெனு' : 'Menu'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* FULL SLIDE-OUT NAVIGATION DRAWER */}
      {menuOpen && (
        <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <div
            className="drawer-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7, #0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <HeartPulse size={22} />
                </div>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block' }}>
                    {t('app_title')}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {isAdmin ? 'Administrator Mode' : 'Offline Patient Care'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Options Body */}
            <div className="drawer-body">
              {/* SECTION 1: PRIMARY PATIENT & HEALTHCARE SERVICES */}
              <div>
                <div className="drawer-section-title">
                  {lang === 'ta' ? 'முக்கிய சேவைகள்' : 'Health Services'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Home */}
                  <Link
                    to="/"
                    className={`drawer-item ${isActive('/') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="drawer-item-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                      <LayoutDashboard size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        {lang === 'ta' ? 'முகப்பு பலகை' : 'Home Dashboard'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {lang === 'ta' ? 'பரிசோதனை கண்ணோட்டம்' : 'Overview & quick triage'}
                      </div>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </Link>

                  {/* Symptom Self-Triage */}
                  <Link
                    to="/triage"
                    className={`drawer-item ${isActive('/triage') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="drawer-item-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                      <Stethoscope size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        {lang === 'ta' ? 'அறிகுறி பரிசோதனை' : 'Symptom Triage'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {lang === 'ta' ? 'அவசர நிலை மதிப்பீடு & ஆலோசனைகள்' : 'Evaluate symptoms & vital signs'}
                      </div>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </Link>

                  {/* Senior Voice Mode */}
                  <Link
                    to="/senior-triage"
                    className={`drawer-item ${isActive('/senior-triage') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="drawer-item-icon" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                      <span style={{ fontSize: '18px' }}>👴👵</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#92400e' }}>
                        {lang === 'ta' ? 'முதியோர் குரல் முறை' : 'Senior Voice & Touch Mode'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#78350f' }}>
                        {lang === 'ta' ? 'படிக்கவோ எழுதவோ தேவையில்லை' : 'Zero-typing voice questions'}
                      </div>
                    </div>
                    <ChevronRight size={16} color="#b45309" />
                  </Link>

                  {/* Nearest Clinics & Hospitals GPS Map */}
                  <Link
                    to="/clinics"
                    className={`drawer-item ${isActive('/clinics') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="drawer-item-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                      <MapPin size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#166534' }}>
                        {lang === 'ta' ? 'அருகிலுள்ள மருத்துவமனைகள்' : 'Clinics & Hospitals Map'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                        {lang === 'ta' ? 'ஜிபிஎஸ் நேரடி தூரம் & வழித்தடம்' : 'GPS distance, PHCs & 108 route'}
                      </div>
                    </div>
                    <span style={{ backgroundColor: '#16a34a', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      GPS
                    </span>
                  </Link>

                  {/* My Health Records */}
                  <Link
                    to="/my-records"
                    className={`drawer-item ${isActive('/my-records') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="drawer-item-icon" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
                      <FileText size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        {lang === 'ta' ? 'என் மருத்துவ பதிவுகள்' : 'My Health Records'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {lang === 'ta' ? 'முந்தைய பரிசோதனை வரலாறு' : 'Search past triage logs offline'}
                      </div>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </Link>

                  {/* Register New Patient */}
                  <Link
                    to="/register"
                    className={`drawer-item ${isActive('/register') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="drawer-item-icon" style={{ backgroundColor: '#ccfbf1', color: '#0f766e' }}>
                      <UserPlus size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        {lang === 'ta' ? 'புதிய நோயாளி பதிவு' : 'Register New Patient'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {lang === 'ta' ? 'கிராம நோயாளி தகவல்கள்' : 'Save contact & village profile'}
                      </div>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </Link>
                </div>
              </div>

              {/* SECTION 2: CLINICAL STAFF & FIELD WORKERS (Dedicated Standalone Section) */}
              <div>
                <div className="drawer-section-title" style={{ color: '#0f766e' }}>
                  {lang === 'ta' ? 'சுகாதார பணியாளர் & மருத்துவர் தளம்' : 'Clinical Staff & Field Workers'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Health Worker Access */}
                  <Link
                    to="/staff-login?role=worker"
                    className={`drawer-item ${location.pathname === '/staff-login' && !location.search.includes('doctor') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="drawer-item-icon" style={{ backgroundColor: '#ccfbf1', color: '#0f766e' }}>
                      <Stethoscope size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        {lang === 'ta' ? 'சுகாதார பணியாளர் உள்நுழைவு' : 'Health Worker Access'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {lang === 'ta' ? 'கள ஆய்வு, பரிசோதனை & நோயாளி பதிவு' : 'Field triage, surveys & patient registry'}
                      </div>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </Link>

                  {/* Doctor / PHC Medical Officer */}
                  <Link
                    to="/staff-login?role=doctor"
                    className={`drawer-item ${location.pathname === '/staff-login' && location.search.includes('doctor') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="drawer-item-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                      <Activity size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        {lang === 'ta' ? 'மருத்துவர் / PHC தளம்' : 'Doctor / PHC Portal'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {lang === 'ta' ? 'நோயாளி பரிசோதனை, சிகிச்சை & பரிந்துரை' : 'Clinical review, prescriptions & referrals'}
                      </div>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </Link>

                  {/* If user is logged in as staff (worker or doctor), show direct clinical shortcuts */}
                  {isStaff && (
                    <>
                      <Link
                        to="/queue"
                        className={`drawer-item ${isActive('/queue') ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="drawer-item-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                          <Activity size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                            {lang === 'ta' ? 'பரிசோதனை வரிசை' : 'Active Triage Queue'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {lang === 'ta' ? 'முன்னுரிமை நோயாளிகள்' : 'Manage urgent & red-flag cases'}
                          </div>
                        </div>
                        <ChevronRight size={16} color="#94a3b8" />
                      </Link>

                      <Link
                        to="/patients"
                        className={`drawer-item ${isActive('/patients') ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="drawer-item-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                          <Users size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                            {lang === 'ta' ? 'கிராம நோயாளிகள் பட்டியல்' : 'Patient Directory'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {lang === 'ta' ? 'முழு நோயாளி விபரம்' : 'View full village directory offline'}
                          </div>
                        </div>
                        <ChevronRight size={16} color="#94a3b8" />
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* SECTION 3: SYSTEM ADMINISTRATION & DATA */}
              <div>
                <div className="drawer-section-title" style={{ color: '#7c3aed' }}>
                  {lang === 'ta' ? 'கணினி நிர்வாகம் & தரவு' : 'Administration & Data'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {isAdmin ? (
                    <>
                      <Link
                        to="/queue"
                        className={`drawer-item ${isActive('/queue') ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="drawer-item-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                          <Activity size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                            {lang === 'ta' ? 'பரிசோதனை வரிசை' : 'Triage Queue'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {lang === 'ta' ? 'அவசர வழக்குகள் மேலாண்மை' : 'Review priority triage cases'}
                          </div>
                        </div>
                        <ChevronRight size={16} color="#94a3b8" />
                      </Link>

                      <Link
                        to="/patients"
                        className={`drawer-item ${isActive('/patients') ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="drawer-item-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                          <Users size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                            {lang === 'ta' ? 'அனைத்து நோயாளிகள்' : 'Patient Directory'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {lang === 'ta' ? 'கிராம வாரியான பட்டியல்' : 'Complete village database'}
                          </div>
                        </div>
                        <ChevronRight size={16} color="#94a3b8" />
                      </Link>

                      <Link
                        to="/conflicts"
                        className={`drawer-item ${isActive('/conflicts') ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="drawer-item-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                          <ShieldCheck size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                            {lang === 'ta' ? 'முரண்பாடுகள் தீர்வு' : 'Conflict Resolution'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {lang === 'ta' ? 'ஒத்திசைவு முரண்பாடுகள்' : 'Multi-device sync audits'}
                          </div>
                        </div>
                        <ChevronRight size={16} color="#94a3b8" />
                      </Link>

                      <Link
                        to="/audit"
                        className={`drawer-item ${isActive('/audit') ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="drawer-item-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                          <ShieldAlert size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                            {lang === 'ta' ? 'தணிக்கை பதிவுகள்' : 'Audit Logs'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {lang === 'ta' ? 'பாதுகாப்பு & அமைப்புகள் பதிவு' : 'System & triage history'}
                          </div>
                        </div>
                        <ChevronRight size={16} color="#94a3b8" />
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className={`drawer-item ${isActive('/login') ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="drawer-item-icon" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                        <Lock size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                          {lang === 'ta' ? 'நிர்வாகி உள்நுழைவு (பாதுகாக்கப்பட்டது)' : 'Admin Login (Protected)'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {lang === 'ta' ? 'நிர்வாக அனுமதி தேவை' : 'Restricted to system administrators'}
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </Link>
                  )}

                  {/* Sync Center */}
                  <Link
                    to="/sync"
                    className={`drawer-item ${isActive('/sync') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="drawer-item-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                      <RefreshCw size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        {lang === 'ta' ? 'இணைப்பு மையம்' : 'Sync Center'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {pendingCount > 0
                          ? `${pendingCount} ${lang === 'ta' ? 'பதிவுகள் நிலுவையில் உள்ளன' : 'pending changes'}`
                          : (lang === 'ta' ? 'அனைத்து பதிவுகளும் இணைக்கப்பட்டுள்ளன' : 'All local data synced')}
                      </div>
                    </div>
                    {pendingCount > 0 && (
                      <span style={{ backgroundColor: '#d97706', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* SECTION 4: SYSTEM UTILITIES */}
              <div>
                <div className="drawer-section-title">
                  {lang === 'ta' ? 'அவசரம் & அமைப்புகள்' : 'Emergency & Settings'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* National Ambulance 108 */}
                  {false && <a
                    href="tel:108"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      backgroundColor: '#dc2626',
                      borderRadius: '12px',
                      color: '#ffffff',
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                    }}
                  >
                    <PhoneCall size={22} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.95rem', display: 'block' }}>
                        {lang === 'ta' ? 'அவசர 108 ஆம்புலன்ஸ் அழைப்பு' : 'Call 108 Ambulance'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                        {lang === 'ta' ? '24/7 கட்டணமில்லா அவசர ஊர்தி' : 'Toll-free 24/7 emergency dispatch'}
                      </span>
                    </div>
                  </a>}

                  {/* Install PWA Button */}
                  {false && !installed && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleInstallClick();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        backgroundColor: '#f0f9ff',
                        border: '1.5px solid #bae6fd',
                        borderRadius: '12px',
                        color: '#0284c7',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Download size={18} />
                      <span>{lang === 'ta' ? 'செயலியை உங்கள் சாதனத்தில் நிறுவுக' : 'Install VMcare App to Device'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer with Logout for any authenticated session */}
            {user && (
              <div className="drawer-footer">
                <div style={{ marginBottom: '8px', fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                  {lang === 'ta' ? 'உள்நுழைந்துள்ள கணக்கு:' : 'Signed in as:'}{' '}
                  <strong style={{ color: '#0f172a' }}>{user.name}</strong> ({user.role})
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    width: '100%',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    color: '#dc2626',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={18} />
                  <span>{lang === 'ta' ? 'வெளியேறுக' : 'Log Out Session'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
export default Navbar;
