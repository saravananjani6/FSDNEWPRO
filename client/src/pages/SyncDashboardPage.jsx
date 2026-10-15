import React, { useEffect, useState } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { useSync } from '../context/SyncContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../database/db';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Database,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';

export function SyncDashboardPage() {
  const { isOnline } = useNetwork();
  const {
    isSyncing,
    syncProgress,
    pendingCount,
    lastSyncTime,
    lastSyncResult,
    triggerSync,
    refreshStatus
  } = useSync();
  const { lang, t } = useLanguage();

  const [queueItems, setQueueItems] = useState([]);
  const [syncedPatientsCount, setSyncedPatientsCount] = useState(0);
  const [syncedTriageCount, setSyncedTriageCount] = useState(0);

  const loadQueue = async () => {
    try {
      const items = await db.syncQueue.toArray();
      setQueueItems(items);

      const pCount = await db.patients.where('syncStatus').equals('synced').count();
      const tCount = await db.triageRecords.where('syncStatus').equals('synced').count();
      setSyncedPatientsCount(pCount);
      setSyncedTriageCount(tCount);
    } catch (err) {
      console.warn('[Load Queue Error]', err);
    }
  };

  useEffect(() => {
    loadQueue();
    refreshStatus();
  }, [pendingCount, isSyncing]);

  const formattedLastSync = lastSyncTime
    ? new Date(lastSyncTime).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : lang === 'ta' ? 'இன்னும் செய்யப்படவில்லை' : 'Never / None';

  return (
    <div className="sync-page-container">
      {/* Header */}
      <div className="sync-header-row">
        <div className="sync-header-title">
          <div className="sync-icon-box">
            <RefreshCw size={28} className={isSyncing ? 'animate-spin' : ''} />
          </div>
          <div>
            <h1 className="page-main-title">{t('nav_sync')}</h1>
            <p className="page-main-subtitle">
              {lang === 'ta'
                ? 'ஆஃப்லைன் தரவு & மத்திய மருத்துவமனை சர்வர் இணைப்பு மையம்'
                : 'Offline data queue & central hospital server synchronization'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerSync}
          disabled={!isOnline || isSyncing}
          className="btn-primary-action sync-now-btn"
        >
          <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
          <span>{isSyncing ? (lang === 'ta' ? 'இணைக்கிறது...' : 'Syncing...') : t('btn_sync_now')}</span>
        </button>
      </div>

      {/* Network & Safety Status Alert */}
      <div className={`sync-status-card ${isOnline ? 'online' : 'offline'}`}>
        <div className="status-indicator-col">
          {isOnline ? (
            <div className="network-pill online">
              <Wifi size={20} />
              <span>{lang === 'ta' ? 'இணையம் இணைப்பில் உள்ளது (ஆன்லைன்)' : 'Network Connected (Online)'}</span>
            </div>
          ) : (
            <div className="network-pill offline">
              <WifiOff size={20} />
              <span>{lang === 'ta' ? 'இணையம் இல்லை (ஆஃப்லைன் பயன்முறை)' : 'No Internet (Offline Mode)'}</span>
            </div>
          )}

          <p className="status-reassurance-text">
            🛡️{' '}
            {lang === 'ta'
              ? 'உங்கள் நோயாளி தரவுகள் சாதனத்தில் பத்திரமாக சேமிக்கப்பட்டுள்ளன. இணையம் திரும்பியவுடன் தானாக பதிவேற்றப்படும்.'
              : 'All your patient records are safely encrypted in your browser IndexedDB. They will automatically sync when network returns.'}
          </p>
        </div>

        <div className="status-kpi-col">
          <div className="kpi-mini">
            <span className="kpi-label">{lang === 'ta' ? 'கடைசி இணைப்பு' : 'Last Successful Sync'}</span>
            <strong>{formattedLastSync}</strong>
          </div>
        </div>
      </div>

      {/* Sync Numbers Grid */}
      <div className="sync-numbers-grid">
        <div className="sync-number-card pending">
          <div className="card-top-icon">
            <UploadCloud size={24} />
          </div>
          <span className="card-count">{pendingCount}</span>
          <span className="card-name">{lang === 'ta' ? 'பதிவேற்ற நிலுவையில்' : 'Pending Uploads'}</span>
          <span className="card-sub">{lang === 'ta' ? 'சாதனத்தில் மட்டும் உள்ளது' : 'Stored locally on device'}</span>
        </div>

        <div className="sync-number-card synced">
          <div className="card-top-icon">
            <CheckCircle2 size={24} />
          </div>
          <span className="card-count">{syncedPatientsCount + syncedTriageCount}</span>
          <span className="card-name">{lang === 'ta' ? 'வெற்றிகரமாக இணைக்கப்பட்டது' : 'Synced Records'}</span>
          <span className="card-sub">
            {syncedPatientsCount} {lang === 'ta' ? 'நோயாளிகள்' : 'patients'} • {syncedTriageCount} {lang === 'ta' ? 'மதிப்பீடுகள்' : 'triage'}
          </span>
        </div>

        <div className="sync-number-card incremental">
          <div className="card-top-icon">
            <DownloadCloud size={24} />
          </div>
          <span className="card-count">{lastSyncResult ? lastSyncResult.pulledPatients + lastSyncResult.pulledTriage : 0}</span>
          <span className="card-name">{lang === 'ta' ? 'சமீபத்திய புதுப்பிப்புகள்' : 'Incremental Updates'}</span>
          <span className="card-sub">{lang === 'ta' ? 'குறைந்த அலைவரிசை சேமிப்பு' : 'Bandwidth-saving delta'}</span>
        </div>
      </div>

      {/* Sync Progress Notification if Active */}
      {syncProgress && (
        <div className="sync-progress-banner">
          <RefreshCw size={20} className="animate-spin text-primary" />
          <span>{syncProgress.message}</span>
        </div>
      )}

      {/* Pending Items Queue Table */}
      <div className="sync-queue-table-card">
        <div className="table-header-row">
          <div className="table-title">
            <Database size={20} />
            <h2>{lang === 'ta' ? 'பதிவேற்ற வரிசையில் உள்ளவை' : 'Pending Synchronization Queue'}</h2>
          </div>
          <span className="queue-count-pill">{queueItems.length} items</span>
        </div>

        {queueItems.length === 0 ? (
          <div className="empty-queue-note">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <p>
              {lang === 'ta'
                ? 'அனைத்து தரவுகளும் மத்திய சர்வரில் சமமாக உள்ளன! புதிய நிலுவைகள் எதுவும் இல்லை.'
                : 'All records are fully up-to-date! No pending uploads in the local queue.'}
            </p>
          </div>
        ) : (
          <div className="queue-table-scroll">
            <table className="queue-table">
              <thead>
                <tr>
                  <th>{lang === 'ta' ? 'வகை' : 'Entity Type'}</th>
                  <th>{lang === 'ta' ? 'உள்ளூர் எண்' : 'Local Identifier'}</th>
                  <th>{lang === 'ta' ? 'செயல்பாடு' : 'Operation'}</th>
                  <th>{lang === 'ta' ? 'நிலை' : 'Status'}</th>
                  <th>{lang === 'ta' ? 'முயற்சிகள்' : 'Attempts'}</th>
                  <th>{lang === 'ta' ? 'நேரம்' : 'Queued At'}</th>
                </tr>
              </thead>
              <tbody>
                {queueItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="entity-type-tag">{item.entityType.toUpperCase()}</span>
                    </td>
                    <td>
                      <code className="local-id-code">{item.entityLocalId}</code>
                    </td>
                    <td>
                      <span className="operation-tag">{item.operation}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${item.status}`}>
                        <Clock size={12} />
                        <span>{item.status}</span>
                      </span>
                    </td>
                    <td>
                      <span>{item.attempts || 0}</span>
                    </td>
                    <td>
                      <span className="time-text">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
