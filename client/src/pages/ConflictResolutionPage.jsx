import React, { useState, useEffect } from 'react';
import { db } from '../database/db';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  ShieldAlert,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  GitMerge,
  Server,
  Smartphone
} from 'lucide-react';

export function ConflictResolutionPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const localConflicts = await db.conflicts.where('status').equals('unresolved').toArray();
      setConflicts(localConflicts);
    } catch (err) {
      console.warn('[Load Conflicts Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  const handleResolve = async (conflict, chosenWinner) => {
    setResolvingId(conflict.id);
    try {
      const isClientWinner = chosenWinner === 'client';
      const winnerData = isClientWinner
        ? conflict.details?.clientRecord
        : conflict.details?.serverRecord;

      // Update locally in IndexedDB
      if (conflict.entityType === 'patient' && winnerData) {
        await db.patients.update(conflict.localId, {
          ...winnerData,
          version: (winnerData.version || 1) + 1,
          syncStatus: 'synced'
        });
      }

      // If online, send conflict resolution to server audit log
      await apiRequest('/users/resolve-conflict', {
        method: 'POST',
        body: JSON.stringify({
          recordId: conflict.localId,
          entityType: conflict.entityType,
          winningData: winnerData,
          resolutionStrategy: chosenWinner === 'client' ? 'prefer-local-worker' : 'prefer-central-server'
        })
      }).catch(() => {});

      // Mark conflict resolved in IndexedDB
      await db.conflicts.update(conflict.id, {
        status: 'resolved',
        resolvedAt: new Date().toISOString()
      });

      await loadConflicts();
    } catch (err) {
      console.error('[Conflict Resolution Error]', err);
      alert('Error resolving conflict: ' + err.message);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="conflicts-page-container">
      <div className="conflicts-header">
        <div className="conflicts-icon-box">
          <GitMerge size={28} />
        </div>
        <div>
          <h1 className="page-main-title">{t('nav_conflicts')}</h1>
          <p className="page-main-subtitle">
            {lang === 'ta'
              ? 'பதிப்பு முரண்பாடுகளை ஒப்பிட்டு தீர்க்கும் மேலாண்மை பலகை'
              : 'Optimistic concurrency version conflict resolution dashboard'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-card">
          <p>{lang === 'ta' ? 'முரண்பாடுகள் சரிபார்க்கப்படுகின்றன...' : 'Checking conflict logs...'}</p>
        </div>
      ) : conflicts.length === 0 ? (
        <div className="no-conflicts-card">
          <CheckCircle size={48} className="text-emerald-500" />
          <h2>{lang === 'ta' ? 'முரண்பாடுகள் எதுவும் இல்லை!' : 'Zero Conflicts Detected!'}</h2>
          <p>
            {lang === 'ta'
              ? 'சாதனத்தின் பதிவுகளும் மத்திய சர்வரின் பதிவுகளும் ஒத்திசைவாக உள்ளன.'
              : 'All device updates have synchronized smoothly with no version divergence.'}
          </p>
        </div>
      ) : (
        <div className="conflicts-list">
          {conflicts.map((conflict) => {
            const clientRec = conflict.details?.clientRecord || {};
            const serverRec = conflict.details?.serverRecord || {};

            return (
              <div key={conflict.id} className="conflict-card">
                <div className="conflict-card-header">
                  <div className="conflict-title-wrap">
                    <ShieldAlert size={20} className="text-amber-500" />
                    <h3>
                      {conflict.entityType.toUpperCase()}: {conflict.localId}
                    </h3>
                  </div>
                  <span className="conflict-reason-pill">{conflict.details?.reason}</span>
                </div>

                <div className="conflict-comparison-grid">
                  {/* Local Worker Version */}
                  <div className="version-col local-col">
                    <div className="col-header">
                      <Smartphone size={18} />
                      <h4>{lang === 'ta' ? 'சாதன பதிப்பு (Local Offline)' : 'Device Record (Local Offline)'}</h4>
                      <span className="version-tag">v{clientRec.version || 1}</span>
                    </div>
                    <div className="col-body">
                      <p><strong>Name:</strong> {clientRec.name}</p>
                      <p><strong>Age:</strong> {clientRec.age} yrs</p>
                      <p><strong>Village:</strong> {clientRec.village}</p>
                      <p><strong>Phone:</strong> {clientRec.phone || '-'}</p>
                    </div>
                    <button
                      type="button"
                      disabled={resolvingId === conflict.id}
                      onClick={() => handleResolve(conflict, 'client')}
                      className="btn-resolve local"
                    >
                      {lang === 'ta' ? 'சாதன பதிப்பைத் தக்கவை' : 'Keep Local Version'}
                    </button>
                  </div>

                  {/* Central Server Version */}
                  <div className="version-col server-col">
                    <div className="col-header">
                      <Server size={18} />
                      <h4>{lang === 'ta' ? 'மத்திய சர்வர் பதிப்பு (Hospital Server)' : 'Central Server Record'}</h4>
                      <span className="version-tag">v{serverRec.version || 2}</span>
                    </div>
                    <div className="col-body">
                      <p><strong>Name:</strong> {serverRec.name}</p>
                      <p><strong>Age:</strong> {serverRec.age} yrs</p>
                      <p><strong>Village:</strong> {serverRec.village}</p>
                      <p><strong>Phone:</strong> {serverRec.phone || '-'}</p>
                    </div>
                    <button
                      type="button"
                      disabled={resolvingId === conflict.id}
                      onClick={() => handleResolve(conflict, 'server')}
                      className="btn-resolve server"
                    >
                      {lang === 'ta' ? 'சர்வர் பதிப்பை ஏற்றுக்கொள்' : 'Accept Server Version'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
