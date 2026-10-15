import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { useSync } from '../../context/SyncContext';
import { useLanguage } from '../../context/LanguageContext';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function NetworkStatusBanner() {
  const { isOnline } = useNetwork();
  const { isSyncing, syncProgress, pendingCount, lastSyncTime, triggerSync } = useSync();
  const { t, lang } = useLanguage();

  const formattedLastSync = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : lang === 'ta' ? 'இல்லை' : 'None';

  return (
    <div
      className={`network-status-bar ${
        !isOnline
          ? 'bar-offline'
          : isSyncing
          ? 'bar-syncing'
          : pendingCount > 0
          ? 'bar-pending'
          : 'bar-online'
      }`}
    >
      <div className="status-info-cluster">
        {!isOnline ? (
          <div className="status-badge-inline offline">
            <span className="pulsing-dot red"></span>
            <WifiOff size={18} />
            <strong className="status-label">{t('status_offline')}</strong>
            <span className="status-detail">
              {lang === 'ta'
                ? `சாதனத்தில் இயங்குகிறது • நிலுவை: ${pendingCount}`
                : `Working locally • Pending: ${pendingCount}`}
            </span>
          </div>
        ) : isSyncing ? (
          <div className="status-badge-inline syncing">
            <RefreshCw size={18} className="animate-spin" />
            <strong className="status-label">{t('status_syncing')}</strong>
            <span className="status-detail">{syncProgress?.message || 'Connecting to server...'}</span>
          </div>
        ) : pendingCount > 0 ? (
          <div className="status-badge-inline pending">
            <span className="pulsing-dot yellow"></span>
            <Wifi size={18} />
            <strong className="status-label">{t('status_online')}</strong>
            <span className="status-detail">
              {lang === 'ta'
                ? `${pendingCount} பதிவுகள் பதிவேற்ற தயாராக உள்ளன`
                : `${pendingCount} record(s) pending sync`}
            </span>
          </div>
        ) : (
          <div className="status-badge-inline online">
            <span className="pulsing-dot green"></span>
            <Wifi size={18} />
            <strong className="status-label">{t('status_online')}</strong>
            <span className="status-detail">
              {lang === 'ta'
                ? `இணைக்கப்பட்டது • கடைசி இணைப்பு: ${formattedLastSync}`
                : `Connected • Last sync: ${formattedLastSync}`}
            </span>
          </div>
        )}
      </div>

      <div className="status-actions">
        {isOnline && (
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="btn-sync-quick"
            title={t('btn_sync_now')}
          >
            <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? (lang === 'ta' ? 'இணைக்கிறது...' : 'Syncing...') : t('btn_sync_now')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
