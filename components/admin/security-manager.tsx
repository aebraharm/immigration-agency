'use client';

import {
  Activity, Ban, Globe2, LoaderCircle, RefreshCw, Search, ShieldAlert, ShieldCheck,
  ShieldOff, Unlock, Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from './api';
import { EmptyState, ManagerHeader } from './shared';
import { Button } from '@/components/ui/button';
import type { SecurityOverview } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

const REFRESH_INTERVAL_MS = 30_000;

export function SecurityManager({ onToast }: { onToast: (message: string) => void }) {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busyIp, setBusyIp] = useState('');
  const [manualIp, setManualIp] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualBusy, setManualBusy] = useState(false);

  const load = useCallback(async (announce = false) => {
    setError('');
    try {
      const result = await adminFetch<SecurityOverview>('/api/admin/security');
      setOverview(result);
      if (announce) onToast('Visitor logs refreshed.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load visitor logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onToast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => { void load(); }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  const blocked = useMemo(() => new Set((overview?.blockedIps || []).map((item) => item.ip)), [overview]);

  const visitors = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = overview?.visitors || [];
    if (!term) return list;
    return list.filter((item) => `${item.ip} ${item.lastPage} ${item.lastUserAgent} ${item.lastReferrer}`.toLowerCase().includes(term));
  }, [overview, query]);

  async function block(ip: string, reason = '') {
    setBusyIp(ip);
    try {
      await adminFetch('/api/admin/security/block', { method: 'POST', body: JSON.stringify({ ip, reason }) });
      onToast(`${ip} is now blocked.`);
      await load();
      return true;
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : 'Unable to block that address.');
      return false;
    } finally {
      setBusyIp('');
    }
  }

  async function unblock(ip: string) {
    setBusyIp(ip);
    try {
      await adminFetch('/api/admin/security/unblock', { method: 'POST', body: JSON.stringify({ ip }) });
      onToast(`${ip} was unblocked.`);
      await load();
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : 'Unable to unblock that address.');
    } finally {
      setBusyIp('');
    }
  }

  async function submitManual() {
    const ip = manualIp.trim();
    if (!ip) { onToast('Enter an IP address to block.'); return; }
    setManualBusy(true);
    const ok = await block(ip, manualReason);
    setManualBusy(false);
    if (ok) { setManualIp(''); setManualReason(''); }
  }

  function refresh() {
    setRefreshing(true);
    void load(true);
  }

  if (loading) return <div className="admin-card flex items-center justify-center px-6 py-20"><LoaderCircle className="h-6 w-6 animate-spin text-red-600" /><span className="sr-only">Loading visitor logs</span></div>;

  if (error && !overview) return <div className="admin-card max-w-lg p-8 text-center"><ShieldAlert className="mx-auto h-7 w-7 text-red-600" /><p className="mt-4 text-sm font-bold text-red-600">{error}</p><Button className="mt-5" onClick={() => void load()}>Try again</Button></div>;

  const stats = overview?.stats;
  const recentVisits = overview?.recentVisits.slice(0, 14) || [];

  return <div>
    <ManagerHeader
      eyebrow="SECURITY & VISITOR INTELLIGENCE"
      title="Visitor logs & IP security"
      description="Every visit to the public website is recorded with the visitor's network address. Block an address to serve it the Access Denied page everywhere on the site, and unblock it whenever you like."
      action={<Button variant="secondary" onClick={refresh} loading={refreshing}><RefreshCw className="h-4 w-4" />Refresh</Button>}
    />

    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat icon={Users} value={stats?.totalVisitors || 0} label="Unique visitor IPs" />
      <Stat icon={Activity} value={stats?.visitsToday || 0} label="Tracked requests today" />
      <Stat icon={ShieldOff} value={stats?.blockedCount || 0} label="Blocked addresses" accent />
      <Stat icon={Globe2} value={stats?.linkedSubmissions || 0} label="Linked assessments" />
    </div>

    {overview?.currentIp && <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-ink-900/10 bg-white px-4 py-3 text-[10px] font-semibold text-ink-500"><ShieldCheck className="h-4 w-4 text-green-600" />Your current address <code className="rounded-md bg-cream px-2 py-1 font-mono text-[10px] font-bold text-ink-900">{overview.currentIp}</code><span className="text-ink-500/70">is never blocked automatically, and the admin portal stays reachable while an address is blocked.</span></div>}

    <section className="admin-card mb-6 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-ink-900/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xs font-extrabold text-ink-950">Block an address manually</h2><p className="mt-1 text-[10px] text-ink-500">Useful for an address you have not seen in the logs yet. Blocking is immediate for page renders and within a few seconds everywhere else.</p></div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] sm:items-end">
        <label className="block"><span className="field-label">IP address</span><input value={manualIp} onChange={(event) => setManualIp(event.target.value)} placeholder="203.0.113.24" inputMode="text" autoComplete="off" spellCheck={false} className="field-input font-mono text-xs" /></label>
        <label className="block"><span className="field-label">Reason <span className="font-normal text-ink-500">(optional)</span></span><input value={manualReason} onChange={(event) => setManualReason(event.target.value)} maxLength={280} placeholder="Repeated spam assessments" className="field-input text-xs" /></label>
        <Button onClick={() => void submitManual()} loading={manualBusy}><Ban className="h-4 w-4" />Block IP</Button>
      </div>
    </section>

    <section className="admin-card mb-6 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-ink-900/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xs font-extrabold text-ink-950">Visitor logs</h2><p className="mt-1 text-[10px] text-ink-500">Most recent {overview?.visitors.length || 0} addresses, newest activity first.</p></div>
        <label className="relative"><span className="sr-only">Search visitor logs</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search IP, page or device" className="field-input min-w-0 pl-9 text-xs sm:w-64" /></label>
      </div>
      {visitors.length === 0 ? <div className="p-5"><EmptyState title={query ? 'No matching visitor' : 'No visitor activity recorded yet'} description={query ? 'Try a different IP address, page path or device string.' : 'Load the public website from a visitor network and their address, timestamps, visit count and last page will appear here automatically.'} /></div>
        : <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left">
          <thead><tr className="border-b border-ink-900/10 bg-cream/60 text-[9px] font-extrabold uppercase tracking-[.12em] text-ink-500"><th className="px-5 py-3.5">IP address</th><th className="px-4 py-3.5">Visits</th><th className="px-4 py-3.5">Last active page</th><th className="px-4 py-3.5">First seen</th><th className="px-4 py-3.5">Last seen</th><th className="px-4 py-3.5">Assessments</th><th className="px-5 py-3.5 text-right">Status</th></tr></thead>
          <tbody>{visitors.map((visitor) => {
            const isBlocked = blocked.has(visitor.ip);
            const isSelf = visitor.ip === overview?.currentIp;
            return <tr key={visitor.ip} className={cn('border-b border-ink-900/[0.07] last:border-0 hover:bg-red-50/20', isBlocked && 'bg-red-50/40')}>
              <td className="px-5 py-4"><p className="break-all font-mono text-[11px] font-bold text-ink-900">{visitor.ip}</p><p className="mt-1 max-w-[260px] truncate text-[9px] text-ink-500" title={visitor.lastUserAgent}>{visitor.lastUserAgent || 'Unknown device'}</p></td>
              <td className="px-4 py-4"><span className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold text-ink-700">{visitor.visitCount}</span></td>
              <td className="px-4 py-4 font-mono text-[10px] text-ink-500">{visitor.lastPage || '/'}</td>
              <td className="px-4 py-4 text-[10px] leading-4 text-ink-500">{formatDate(visitor.firstSeen, true)}</td>
              <td className="px-4 py-4 text-[10px] leading-4 text-ink-500">{formatDate(visitor.lastSeen, true)}</td>
              <td className="px-4 py-4">{visitor.submissionCount > 0 ? <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold text-blue-700">{visitor.submissionCount} linked</span> : <span className="text-[10px] text-ink-500">None</span>}</td>
              <td className="px-5 py-4 text-right">
                {isBlocked
                  ? <div className="flex items-center justify-end gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-bold text-red-700"><ShieldOff className="h-3 w-3" />Blocked</span><Button variant="ghost" size="sm" onClick={() => void unblock(visitor.ip)} loading={busyIp === visitor.ip}><Unlock className="h-3.5 w-3.5" />Unblock</Button></div>
                  : <Button variant="secondary" size="sm" onClick={() => void block(visitor.ip)} loading={busyIp === visitor.ip}><Ban className="h-3.5 w-3.5" />Block{isSelf ? ' (you)' : ''}</Button>}
              </td>
            </tr>;
          })}</tbody>
        </table></div>}
      <div className="border-t border-ink-900/10 bg-cream/40 px-5 py-3 text-[10px] text-ink-500">Showing {visitors.length} of {overview?.visitors.length || 0} addresses · {stats?.totalVisits || 0} tracked requests in total · logs rotate automatically</div>
    </section>

    <div className="grid gap-6 lg:grid-cols-2">
      <section className="admin-card overflow-hidden">
        <div className="border-b border-ink-900/10 p-4"><h2 className="text-xs font-extrabold text-ink-950">Blocked addresses</h2><p className="mt-1 text-[10px] text-ink-500">These networks receive the 403 Access Denied page.</p></div>
        {overview?.blockedIps.length
          ? <ul className="divide-y divide-ink-900/[0.07]">{overview.blockedIps.map((item) => <li key={item.ip} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="break-all font-mono text-[11px] font-bold text-ink-900">{item.ip}</p><p className="mt-1 text-[10px] leading-4 text-ink-500">{item.reason || 'No reason recorded'} · blocked {formatDate(item.blockedAt, true)}</p></div>
            <Button variant="secondary" size="sm" onClick={() => void unblock(item.ip)} loading={busyIp === item.ip}><Unlock className="h-3.5 w-3.5" />Unblock</Button>
          </li>)}</ul>
          : <div className="px-4 py-10 text-center"><ShieldCheck className="mx-auto h-6 w-6 text-green-600" /><p className="mt-3 text-[11px] font-bold text-ink-900">No blocked addresses</p><p className="mt-1 text-[10px] text-ink-500">Every visitor currently has access to the public website.</p></div>}
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b border-ink-900/10 p-4"><h2 className="text-xs font-extrabold text-ink-950">Recent activity</h2><p className="mt-1 text-[10px] text-ink-500">Latest page views, assessments and blocked attempts.</p></div>
        {recentVisits.length
          ? <ul className="divide-y divide-ink-900/[0.07]">{recentVisits.map((visit) => <li key={visit.id} className="flex items-center gap-3 px-4 py-3">
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', visit.kind === 'blocked' ? 'bg-red-50 text-red-600' : visit.kind === 'submission' ? 'bg-blue-50 text-blue-700' : 'bg-cream text-ink-500')}>{visit.kind === 'blocked' ? <ShieldOff className="h-3.5 w-3.5" /> : visit.kind === 'submission' ? <Activity className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}</span>
            <div className="min-w-0 flex-1"><p className="truncate font-mono text-[10px] font-bold text-ink-900">{visit.ip}</p><p className="truncate text-[9px] text-ink-500">{visit.kind === 'submission' ? 'Assessment submitted' : visit.kind === 'blocked' ? 'Blocked visit attempt' : `Viewed ${visit.path || '/'}`} · {formatDate(visit.createdAt, true)}</p></div>
            {blocked.has(visit.ip) ? <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[8px] font-bold text-red-700">BLOCKED</span> : null}
          </li>)}</ul>
          : <div className="px-4 py-10 text-center text-[10px] text-ink-500">No activity recorded yet.</div>}
      </section>
    </div>
  </div>;
}

function Stat({ icon: Icon, value, label, accent }: { icon: typeof Users; value: number; label: string; accent?: boolean }) {
  return <div className="admin-card p-4 sm:p-5"><div className="flex items-center justify-between"><span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accent ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600')}><Icon className="h-4 w-4" /></span><span className="font-serif text-3xl sm:text-4xl">{value}</span></div><p className="mt-3 text-[10px] font-semibold text-ink-500">{label}</p></div>;
}
