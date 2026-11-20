import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Bell, HelpCircle, X, Smartphone, LoaderCircle } from 'lucide-react';
import hopelmarSymbol from '../../../assets/hopelmar-symbol.jpeg';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export interface WorkspaceNotification {
  id: string;
  title: string;
  message: string;
  tab: string;
}

export interface WorkspaceSearchResult {
  id: string;
  label: string;
  detail: string;
  tab: string;
}

interface NavbarProps {
  breadcrumb: string[];
  onNewQuotation?: () => void;
  onNavigateHome?: () => void;
  notifications?: WorkspaceNotification[];
  onSelectNotification?: (notification: WorkspaceNotification) => void;
  searchResults?: WorkspaceSearchResult[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSelectSearchResult?: (result: WorkspaceSearchResult) => void;
}

const decodeVapidKey = (key: string) => {
  const padding = '='.repeat((4 - key.length % 4) % 4);
  const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
};

export const Navbar: React.FC<NavbarProps> = ({ 
  breadcrumb, 
  onNewQuotation,
  onNavigateHome,
  notifications = [],
  onSelectNotification,
  searchResults = [],
  searchValue = '',
  onSearchChange,
  onSelectSearchResult,
}) => {
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<WorkspaceNotification | null>(null);
  const [readIds, setReadIds] = useState<string[]>([]);
  const readNotificationsKey = `hopelmar.read-notifications.${user?.id || 'guest'}`;
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainer = useRef<HTMLDivElement>(null);
  const previousNotificationIds = useRef<Set<string> | null>(null);
  const unreadCount = notifications.filter((notification) => !readIds.includes(notification.id)).length;

  useEffect(() => {
    try {
      setReadIds(JSON.parse(localStorage.getItem(readNotificationsKey) || '[]') as string[]);
    } catch (error) {
      console.error('Failed to load read notification state.', error);
      setReadIds([]);
    }
  }, [readNotificationsKey]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) {
      setPushEnabled(false);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const registration = await navigator.serviceWorker?.getRegistration('/sw.js');
        const subscription = await registration?.pushManager.getSubscription();
        if (!subscription) {
          if (active) setPushEnabled(false);
          return;
        }
        const { data, error } = await supabase.from('push_subscriptions')
          .select('endpoint')
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
          .limit(1);
        if (error) throw error;
        if (active) setPushEnabled(Boolean(data?.length));
      } catch (error) {
        console.error('Failed to check push notification setup.', error);
      }
    })();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    const currentIds = new Set(notifications.map((notification) => notification.id));
    if (previousNotificationIds.current === null) {
      previousNotificationIds.current = currentIds;
      return;
    }
    const added = notifications.filter((notification) => !previousNotificationIds.current?.has(notification.id));
    previousNotificationIds.current = currentIds;
    if (added.length === 0) return;

    const latest = added[0];
    setSelectedNotification(latest);
    const updatedReadIds = readIds.filter((id) => !added.some((notification) => notification.id === id));
    setReadIds(updatedReadIds);
    try {
      localStorage.setItem(readNotificationsKey, JSON.stringify(updatedReadIds));
    } catch (error) {
      console.error('Failed to persist notification read state.', error);
    }

    if (pushEnabled && user?.id) {
      void supabase.functions.invoke('notify-user', {
        body: { title: latest.title, message: latest.message },
      }).then(({ error }) => {
        if (error) {
          console.error('Could not send device notification.', error);
          setPushMessage('Push belum terkirim. Pastikan function notify-user sudah di-deploy dan secret VAPID sudah diatur.');
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(latest.title, { body: latest.message, tag: latest.id });
    }
  }, [notifications, pushEnabled, readIds, readNotificationsKey, user?.id]);

  useEffect(() => {
    if (!selectedNotification) return;
    const timer = window.setTimeout(() => setSelectedNotification(null), 8000);
    return () => window.clearTimeout(timer);
  }, [selectedNotification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchContainer.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    const nextReadIds = [...new Set([...readIds, ...notifications.map((notification) => notification.id)])];
    setReadIds(nextReadIds);
    try {
      localStorage.setItem(readNotificationsKey, JSON.stringify(nextReadIds));
    } catch (error) {
      console.error('Failed to persist notification read state.', error);
    }
  };

  const handleNotificationClick = (notification: WorkspaceNotification) => {
    markAllRead();
    setNotificationsOpen(false);
    onSelectNotification?.(notification);
  };

  const handlePushToggle = async () => {
    setPushMessage('');
    if (!user?.id) {
      setPushMessage('Sesi login tidak tersedia. Login kembali lalu coba lagi.');
      return;
    }
    if (!isSupabaseConfigured) {
      setPushMessage('Supabase belum dikonfigurasi untuk notifikasi perangkat.');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPushMessage('Browser ini belum mendukung push notification. Coba Chrome/Edge di Android atau Safari versi terbaru.');
      return;
    }
    setPushBusy(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const currentSubscription = await registration.pushManager.getSubscription();
      if (pushEnabled && currentSubscription) {
        const { error } = await supabase.from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', currentSubscription.endpoint);
        if (error) throw error;
        await currentSubscription.unsubscribe();
        setPushEnabled(false);
        setPushMessage('Notifikasi dinonaktifkan untuk perangkat ini.');
      } else {
        const vapidKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined;
        if (!vapidKey) throw new Error('Kunci push belum dikonfigurasi. Admin perlu mengatur VITE_WEB_PUSH_PUBLIC_KEY dan secret Supabase.');
        const permission = Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission();
        if (permission !== 'granted') throw new Error('Izin notifikasi tidak diberikan.');
        const subscription = currentSubscription || await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(vapidKey),
        });
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          subscription: subscription.toJSON(),
        }, { onConflict: 'endpoint' });
        if (error) throw error;
        setPushEnabled(true);
        setPushMessage('Notifikasi perangkat aktif. Pastikan izin notifikasi browser juga diizinkan.');
      }
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : 'Notifikasi perangkat gagal diaktifkan.');
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <header className="h-[60px] bg-white border-b border-slate-200 sticky top-0 z-30 flex font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-[240px] shrink-0 border-r border-slate-200 px-3 flex items-center">
        <div className="flex items-center gap-2">
          <img src={hopelmarSymbol} alt="" className="h-9 w-9 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="whitespace-nowrap text-[12px] font-extrabold leading-tight tracking-tight text-slate-900">PT Hopelmar International</p>
            <p className="mt-0.5 whitespace-nowrap text-[8px] leading-tight text-slate-600">Freight Forwarding &amp; Logistics</p>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left Breadcrumb */}
        <div className="flex shrink-0 items-center gap-1.5 text-xs">
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-400">/</span>}
              <span
                onClick={idx === 0 && onNavigateHome ? onNavigateHome : undefined}
                className={`${
                  idx === breadcrumb.length - 1
                    ? 'font-bold text-slate-800'
                    : 'text-slate-500 font-medium cursor-pointer hover:text-slate-800'
                }`}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Center Search Input */}
        <div ref={searchContainer} className="relative mx-2 hidden min-w-0 max-w-md flex-1 md:block">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search Job, BL, Quotation, Client..."
              value={searchValue}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                onSearchChange?.(event.target.value);
                setSearchOpen(true);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition"
            />
          </div>
          {searchOpen && searchValue.trim() && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {searchResults.length ? searchResults.map((result) => (
                <button
                  type="button"
                  key={result.id}
                  onClick={() => {
                    onSelectSearchResult?.(result);
                    setSearchOpen(false);
                    onSearchChange?.('');
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                >
                  <span className="block text-xs font-bold text-slate-800">{result.label}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">{result.detail}</span>
                </button>
              )) : <p className="p-3 text-xs text-slate-500">Tidak ada hasil yang cocok.</p>}
            </div>
          )}
        </div>

        {/* Right User & Actions */}
        <div className="flex shrink-0 items-center gap-3">
          {onNewQuotation && (
            <button
              onClick={onNewQuotation}
              className="px-3 py-1.5 rounded-lg bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Quotation</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              title="Notifications"
              aria-label={`Notifikasi, ${unreadCount} belum dibaca`}
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setHelpOpen(false);
              }}
              className="relative rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[9px] font-bold leading-4 text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(90vw,360px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div><p className="text-sm font-bold text-slate-900">Notifikasi</p><p className="text-[10px] text-slate-500">{notifications.length} hal yang perlu diperhatikan</p></div>
                  <button type="button" onClick={markAllRead} className="text-[10px] font-bold text-blue-700 hover:text-blue-900">Tandai dibaca</button>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {notifications.length ? notifications.map((notification) => (
                    <button type="button" key={notification.id} onClick={() => handleNotificationClick(notification)} className={`mb-1 block w-full rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 ${!readIds.includes(notification.id) ? 'bg-blue-50/70' : ''}`}>
                      <span className="flex items-start gap-2">
                        {!readIds.includes(notification.id) && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-slate-800">{notification.title}</span>
                          <span className="mt-1 block text-[10px] leading-relaxed text-slate-600">{notification.message}</span>
                          <span className="mt-1 block text-[10px] font-bold text-blue-700">Buka daftar terkait</span>
                        </span>
                      </span>
                    </button>
                  )) : <p className="p-5 text-center text-xs text-slate-500">Belum ada hal yang perlu ditindaklanjuti.</p>}
                </div>
                <div className="border-t border-slate-100 p-3">
                  <button type="button" onClick={() => void handlePushToggle()} disabled={pushBusy} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    {pushBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                    {pushBusy ? 'Memproses...' : pushEnabled ? 'Matikan notifikasi HP' : 'Aktifkan notifikasi HP'}
                  </button>
                  {pushMessage && <p role="status" className="mt-2 text-center text-[10px] text-slate-600">{pushMessage}</p>}
                  <p className="mt-2 text-center text-[10px] text-slate-500">Di HP hanya menerima pemberitahuan. Perbaikan dokumen dilakukan di laptop/PC.</p>
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <div className="relative">
            <button
              type="button"
              title="Help & Guidelines"
              aria-label="Bantuan dan panduan"
              aria-expanded={helpOpen}
              onClick={() => {
                setHelpOpen(!helpOpen);
                setNotificationsOpen(false);
              }}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {helpOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(90vw,330px)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-bold text-slate-900">Bantuan & panduan</p><p className="mt-1 text-[10px] text-slate-500">Panduan singkat penggunaan Hopelmar Job Tracker.</p></div>
                  <button type="button" aria-label="Tutup panduan" onClick={() => setHelpOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                </div>
                <ol className="mt-3 space-y-2 text-[11px] leading-relaxed text-slate-600">
                  <li><strong className="text-slate-800">Pencarian:</strong> cari nomor job, BL/AWB, quotation, atau nama customer melalui kotak pencarian.</li>
                  <li><strong className="text-slate-800">Notifikasi:</strong> lonceng menampilkan hal yang perlu ditindaklanjuti pada alur kerja Anda.</li>
                  <li><strong className="text-slate-800">Dokumen legalitas:</strong> buka Master Customer, pilih Dokumen legalitas, lalu unggah file. Dokumen digunakan kembali untuk order berikutnya.</li>
                  <li><strong className="text-slate-800">HP:</strong> aktifkan notifikasi dari lonceng. Untuk memperbaiki dokumen, buka aplikasi di laptop/PC.</li>
                </ol>
              </div>
            )}
          </div>

          {/* User Card */}
          <div className="flex items-center gap-2 pl-2">
            <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800">
              {user?.avatarChar || 'F'}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-slate-800">{user?.fullName || 'Farah'}</div>
              <div className="text-[10px] text-slate-400 font-medium">{user?.title || 'Sales'}</div>
            </div>
          </div>
        </div>
      </div>
      {selectedNotification && (
        <div role="status" className="fixed right-4 top-[72px] z-[70] w-[min(90vw,380px)] rounded-xl border border-blue-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-full bg-blue-100 p-1.5"><Bell className="h-4 w-4 text-blue-700" /></span>
            <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-900">{selectedNotification.title}</p><p className="mt-1 text-[11px] leading-relaxed text-slate-600">{selectedNotification.message}</p><button type="button" onClick={() => handleNotificationClick(selectedNotification)} className="mt-2 text-[10px] font-bold text-blue-700 hover:text-blue-900">Buka sekarang</button></div>
            <button type="button" aria-label="Tutup notifikasi" onClick={() => setSelectedNotification(null)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </header>
  );
};
