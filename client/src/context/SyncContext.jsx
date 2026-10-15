import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';
import { useNetwork } from './NetworkContext';
import { db } from '../database/db';

const SyncContext = createContext();

export function SyncProvider({ children }) {
  const { isOnline, wasOffline, setWasOffline } = useNetwork();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  // Refresh counts from IndexedDB
  const refreshStatus = useCallback(async () => {
    try {
      const status = await syncService.getStatus();
      setPendingCount(status.pendingCount);
      setConflictCount(status.conflictCount);
      setLastSyncTime(status.lastSyncTimestamp);
    } catch (err) {
      console.warn('[Sync Status Refresh]', err);
    }
  }, []);

  // Run full sync
  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress({ status: 'starting', message: 'Starting synchronization...' });

    try {
      const res = await syncService.performFullSync((prog) => {
        setSyncProgress(prog);
      });
      setLastSyncResult(res);
      await refreshStatus();
    } catch (err) {
      console.warn('[Manual Sync Error]', err);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncProgress(null), 4000);
    }
  }, [isSyncing, refreshStatus]);

  // Initial load
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Automatic Sync: Trigger when internet returns
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log('[Auto-Sync] Internet restored. Automatically initiating synchronization...');
      setWasOffline(false);
      triggerSync();
    }
  }, [isOnline, wasOffline, setWasOffline, triggerSync]);

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        syncProgress,
        pendingCount,
        conflictCount,
        lastSyncTime,
        lastSyncResult,
        triggerSync,
        refreshStatus
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
