import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Clock, FileText, CheckCircle2 } from 'lucide-react';

export function AuditLogsPage() {
  const { lang, t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await apiRequest('/users/audit-logs');
        if (res.success) {
          setLogs(res.data);
        }
      } catch (err) {
        console.warn('[Audit Logs Load Note]', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="audit-page-container">
      <div className="audit-header">
        <Shield size={28} className="text-primary" />
        <div>
          <h1 className="page-main-title">{t('nav_audit')}</h1>
          <p className="page-main-subtitle">
            {lang === 'ta'
              ? 'மருத்துவ தரவு அணுகல் மற்றும் பாதுகாப்பு ஆய்வுப் பதிவு'
              : 'Healthcare clinical security, access, and synchronization audit trail'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-card">
          <p>{lang === 'ta' ? 'பதிவுகள் ஏற்றப்படுகின்றன...' : 'Loading audit logs...'}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-card">
          <p>{lang === 'ta' ? 'ஆய்வுப் பதிவுகள் எதுவும் இல்லை.' : 'No audit records logged yet.'}</p>
        </div>
      ) : (
        <div className="audit-table-card">
          <table className="audit-table">
            <thead>
              <tr>
                <th>{lang === 'ta' ? 'நேரம்' : 'Timestamp'}</th>
                <th>{lang === 'ta' ? 'பயனர்' : 'User'}</th>
                <th>{lang === 'ta' ? 'பணி' : 'Role'}</th>
                <th>{lang === 'ta' ? 'செயல்பாடு' : 'Action'}</th>
                <th>{lang === 'ta' ? 'மூலம்' : 'Resource'}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <span className="time-text">
                      {new Date(log.createdAt).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'medium'
                      })}
                    </span>
                  </td>
                  <td>
                    <strong>{log.userName}</strong>
                  </td>
                  <td>
                    <span className={`user-role-tag ${log.role}`}>{log.role}</span>
                  </td>
                  <td>
                    <code className="action-code">{log.action}</code>
                  </td>
                  <td>
                    <span>{log.resource}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
