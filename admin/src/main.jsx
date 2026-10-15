import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, Building2, Languages, LogOut, Plus, Save, Send, Trash2, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, login, logout } from './services/api';
import './style.css';

const emptyRule = {
  questions: [],
  rules: [],
  languages: {
    en: { app: "RuralCare" },
    ta: { app: "ரூரல்கேர்" },
    hi: { app: "रूरलकेयर" }
  },
  symptomList: ["fever", "cough", "diarrhea", "vomiting", "headache", "abdominal_pain", "rash", "pregnancy_danger"]
};

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@ruralcare.local');
  const [password, setPassword] = useState('AdminPass123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== 'admin') throw new Error('Admin role required');
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <form onSubmit={submit} className="panel login-panel">
        <div className="login-header">
          <div className="logo-badge">RC</div>
          <h1>RuralCare Admin</h1>
        </div>
        <p>Manage offline rules, clinics, health workers, and anonymized field triage trends.</p>
        <label>
          Email Address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading} className="primary full">
          {loading ? 'Verifying...' : 'Sign In to Dashboard'}
        </button>
        <div className="demo-creds">
          <strong>Default Admin Demo:</strong>
          <code>admin@ruralcare.local / AdminPass123</code>
        </div>
      </form>
    </main>
  );
}

function JsonEditor({ label, value, onChange }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
    setHasError(false);
  }, [value]);

  return (
    <label className="json-editor">
      <div className="editor-label-row">
        <span>{label}</span>
        {hasError && <span className="syntax-error">Invalid JSON format</span>}
      </div>
      <textarea
        value={text}
        className={hasError ? 'textarea-error' : ''}
        onChange={(e) => {
          setText(e.target.value);
          try {
            const parsed = JSON.parse(e.target.value);
            setHasError(false);
            onChange(parsed);
          } catch {
            setHasError(true);
          }
        }}
      />
    </label>
  );
}

function Rules() {
  const [rules, setRules] = useState([]);
  const [current, setCurrent] = useState(emptyRule);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const list = await api('/admin/rules');
      setRules(list || []);
      if (list && list.length > 0) setCurrent(list[0]);
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveDraft() {
    try {
      const saved = current._id
        ? await api(`/admin/rules/${current._id}`, { method: 'PUT', body: current })
        : await api('/admin/rules', { method: 'POST', body: current });
      setCurrent(saved);
      setMessage('Draft saved successfully');
      await load();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  }

  async function publish() {
    try {
      let targetId = current._id;
      if (!targetId) {
        const saved = await api('/admin/rules', { method: 'POST', body: current });
        targetId = saved._id;
      }
      const published = await api(`/admin/rules/${targetId}/publish`, { method: 'POST' });
      setCurrent(published);
      setMessage(`Published version ${published.version} successfully! Mobile devices will now receive this update.`);
      await load();
    } catch (err) {
      setMessage(`Publish failed: ${err.message}`);
    }
  }

  return (
    <section className="workspace">
      <div className="toolbar">
        <div>
          <h2>Rule and Question Editor</h2>
          <p className="subtext">Configure WHO IMCI-style rules, questions, and translations for offline phones.</p>
        </div>
        <div className="button-group">
          <button onClick={() => setCurrent(emptyRule)}><Plus size={18} /> New Draft</button>
          <button onClick={saveDraft}><Save size={18} /> Save Draft</button>
          <button className="primary" onClick={publish}><Send size={18} /> Publish New Version</button>
        </div>
      </div>

      {message && <div className="notice">{message}</div>}

      <div className="rule-layout">
        <aside className="list">
          <span className="list-heading">Versions</span>
          {rules.map((r) => (
            <button
              key={r._id}
              className={`version-item ${current._id === r._id ? 'version-active' : ''}`}
              onClick={() => setCurrent(r)}
            >
              <strong>v{r.version}</strong>
              <span className={`status-badge status-${r.status}`}>{r.status}</span>
            </button>
          ))}
        </aside>

        <div className="editors">
          <JsonEditor
            label="Questions JSON"
            value={current.questions || []}
            onChange={(questions) => setCurrent({ ...current, questions })}
          />
          <JsonEditor
            label="Rules JSON (with Red Flag priorities)"
            value={current.rules || []}
            onChange={(rules) => setCurrent({ ...current, rules })}
          />
          <JsonEditor
            label="Languages JSON (en, ta, hi)"
            value={current.languages || {}}
            onChange={(languages) => setCurrent({ ...current, languages })}
          />
          <JsonEditor
            label="Symptom List JSON"
            value={current.symptomList || []}
            onChange={(symptomList) => setCurrent({ ...current, symptomList })}
          />
        </div>
      </div>
    </section>
  );
}

function Clinics() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', village: '', phone: '', address: '', services: '' });

  const load = () => api('/admin/clinics').then(setItems);
  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    await api('/admin/clinics', {
      method: 'POST',
      body: {
        ...form,
        services: form.services.split(',').map((x) => x.trim()).filter(Boolean)
      }
    });
    setForm({ name: '', village: '', phone: '', address: '', services: '' });
    load();
  }

  async function remove(id) {
    if (window.confirm('Deactivate this clinic?')) {
      await api(`/admin/clinics/${id}`, { method: 'DELETE' });
      load();
    }
  }

  return (
    <Crud
      title="Clinics and Primary Health Centres"
      icon={<Building2 />}
      items={items}
      form={form}
      setForm={setForm}
      submit={submit}
      fields={[
        { key: 'name', label: 'Clinic Name' },
        { key: 'village', label: 'Village / Region' },
        { key: 'phone', label: 'Phone' },
        { key: 'address', label: 'Address' },
        { key: 'services', label: 'Services (comma-separated)' }
      ]}
      onDelete={remove}
    />
  );
}

function Workers() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: 'WorkerPass123', village: '', phone: '' });

  const load = () => api('/admin/health-workers').then(setItems);
  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    await api('/admin/health-workers', { method: 'POST', body: form });
    setForm({ name: '', email: '', password: 'WorkerPass123', village: '', phone: '' });
    load();
  }

  async function remove(id) {
    if (window.confirm('Deactivate this health worker account?')) {
      await api(`/admin/health-workers/${id}`, { method: 'DELETE' });
      load();
    }
  }

  return (
    <Crud
      title="Field Health Workers (ASHA / ANM)"
      icon={<Users />}
      items={items}
      form={form}
      setForm={setForm}
      submit={submit}
      fields={[
        { key: 'name', label: 'Full Name' },
        { key: 'email', label: 'Email Address' },
        { key: 'password', label: 'Password' },
        { key: 'village', label: 'Assigned Village' },
        { key: 'phone', label: 'Phone' }
      ]}
      onDelete={remove}
    />
  );
}

function Crud({ title, icon, items, form, setForm, submit, fields, onDelete }) {
  return (
    <section className="workspace">
      <h2>{icon} {title}</h2>
      <form className="grid-form" onSubmit={submit}>
        {fields.map((f) => (
          <input
            key={f.key}
            placeholder={f.label}
            value={form[f.key]}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            required={f.key === 'name' || f.key === 'email' || f.key === 'phone'}
          />
        ))}
        <button type="submit" className="primary">Add Record</button>
      </form>

      <div className="table">
        <div className="table-header">
          <span>Name</span>
          <span>Location / Contact</span>
          <span>Phone / Details</span>
          <span style={{ textAlign: 'right' }}>Action</span>
        </div>
        {items.length === 0 ? (
          <div className="empty-row">No records found. Add one above.</div>
        ) : (
          items.map((item) => (
            <div className="row" key={item._id}>
              <strong>{item.name}</strong>
              <span>{item.village || item.email}</span>
              <span>{item.phone || item.address || '—'}</span>
              <div className="row-actions">
                {onDelete && (
                  <button className="danger-btn" onClick={() => onDelete(item._id)} title="Delete / Deactivate">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Analytics() {
  const [stats, setStats] = useState({ colorCounts: [], usageByVillage: [], commonSymptoms: [] });

  useEffect(() => {
    api('/admin/stats').then(setStats).catch(console.error);
  }, []);

  const colors = { RED: '#dc2626', YELLOW: '#eab308', GREEN: '#16a34a' };
  const hasData = (stats.colorCounts && stats.colorCounts.length > 0) ||
                  (stats.commonSymptoms && stats.commonSymptoms.length > 0) ||
                  (stats.usageByVillage && stats.usageByVillage.length > 0);

  return (
    <section className="workspace">
      <h2><Activity /> Anonymized Population Analytics</h2>
      <p className="subtext">Real-time epidemiological surveillance from offline triage logs synced by health workers.</p>

      {!hasData && (
        <div className="empty-analytics">
          <p>No triage records synced from mobile devices yet.</p>
          <span>Run symptom triage on the mobile app and perform sync to visualize epidemiological data here.</span>
        </div>
      )}

      <div className="charts">
        <div className="panel">
          <h3>Triage Urgency Distribution</h3>
          <ResponsiveContainer height={260} width="100%">
            <PieChart>
              <Pie
                data={stats.colorCounts && stats.colorCounts.length ? stats.colorCounts : [{ _id: 'NO DATA', count: 1 }]}
                dataKey="count"
                nameKey="_id"
                outerRadius={80}
                label
              >
                {(stats.colorCounts && stats.colorCounts.length ? stats.colorCounts : [{ _id: 'NO DATA' }]).map((x) => (
                  <Cell key={x._id} fill={colors[x._id] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Prevalent Symptoms Reported</h3>
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={stats.commonSymptoms || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel wide">
          <h3>Triage Volume by Village / Settlement</h3>
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={stats.usageByVillage || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [user, setUser] = useState(localStorage.getItem('ruralcare_token') ? { role: 'admin' } : null);
  const [tab, setTab] = useState('rules');

  const tabs = useMemo(
    () => ({
      rules: <Rules />,
      clinics: <Clinics />,
      workers: <Workers />,
      analytics: <Analytics />
    }),
    []
  );

  if (!user) return <Login onLogin={setUser} />;

  return (
    <>
      <nav>
        <div className="nav-brand">
          <div className="logo-badge">RC</div>
          <strong>RuralCare</strong>
        </div>
        <button className={tab === 'rules' ? 'nav-active' : ''} onClick={() => setTab('rules')}>
          <Languages size={18} /> Rules & Questions
        </button>
        <button className={tab === 'clinics' ? 'nav-active' : ''} onClick={() => setTab('clinics')}>
          <Building2 size={18} /> Clinics
        </button>
        <button className={tab === 'workers' ? 'nav-active' : ''} onClick={() => setTab('workers')}>
          <Users size={18} /> Health Workers
        </button>
        <button className={tab === 'analytics' ? 'nav-active' : ''} onClick={() => setTab('analytics')}>
          <Activity size={18} /> Analytics
        </button>
        <button className="logout-button" onClick={() => { logout(); setUser(null); }}>
          <LogOut size={18} /> Logout
        </button>
      </nav>
      {tabs[tab]}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
