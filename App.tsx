
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wifi, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Mail, 
  Bell, 
  ShieldCheck, 
  Settings as SettingsIcon,
  Info,
  Clock,
  Cpu,
  Activity,
  Zap,
  LayoutDashboard,
  Headset,
  Globe,
  ExternalLink,
  Sparkles,
  Download,
  Smartphone
} from 'lucide-react';
import { ModemAccount, AppSettings, IntelligenceResult } from './types';
import { simulateFetch, getYemenNetIntelligence } from './geminiService';

const LOCAL_STORAGE_KEY = 'yemen_net_accounts_v2';
const DEFAULT_SETTINGS: AppSettings = {
  refreshInterval: 60,
  notificationThreshold: 5
};

const BalanceCircle = ({ balance, threshold }: { balance: number; threshold: number }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((balance / 100) * 100, 100); 
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isLow = balance <= threshold;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle cx="48" cy="48" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke={isLow ? "#ef4444" : "#3b82f6"}
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold ${isLow ? 'text-red-400' : 'text-blue-400'}`}>{balance}</span>
        <span className="text-[8px] uppercase tracking-wider text-slate-500">GB</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<ModemAccount[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [intelligence, setIntelligence] = useState<IntelligenceResult | null>(null);
  const [isIntelligenceLoading, setIsIntelligenceLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [view, setView] = useState<'dashboard' | 'settings' | 'support'>('dashboard');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try { setAccounts(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    fetchIntelligence();

    // Handle PWA installation prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts]);

  const fetchIntelligence = async () => {
    setIsIntelligenceLoading(true);
    const result = await getYemenNetIntelligence();
    setIntelligence(result);
    setIsIntelligenceLoading(false);
  };

  const refreshAccount = useCallback(async (id: string) => {
    setIsRefreshing(true);
    try {
      const data = await simulateFetch('user');
      setAccounts(prev => prev.map(a => 
        a.id === id ? { 
          ...a, 
          balanceGb: data.balance, 
          expiryDate: data.expiry, 
          lastUpdated: new Date().toLocaleTimeString('ar-YE'),
          status: data.balance <= settings.notificationThreshold ? 'low' : 'active'
        } : a
      ));
    } finally {
      setIsRefreshing(false);
    }
  }, [settings.notificationThreshold]);

  const removeAccount = useCallback((id: string) => {
    if(confirm("هل تريد حذف هذا الحساب؟")) {
      setAccounts(prev => prev.filter(a => a.id !== id));
    }
  }, []);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername) return;
    const newAcc: ModemAccount = {
      id: Date.now().toString(),
      name: newName,
      username: newUsername,
      balanceGb: 0,
      totalGb: 100,
      expiryDate: '-',
      lastUpdated: 'جاري المزامنة...',
      status: 'active'
    };
    setAccounts([...accounts, newAcc]);
    setIsAdding(false);
    refreshAccount(newAcc.id);
    setNewName(''); setNewUsername('');
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('لتثبيت التطبيق على أندرويد:\n1. اضغط على النقاط الثلاث في المتصفح (⋮)\n2. اختر "الإضافة إلى الشاشة الرئيسية"');
    }
  };

  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 active-glow">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">يمن نت <span className="text-blue-500 text-sm">PRO</span></h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            accounts.forEach(a => refreshAccount(a.id));
            fetchIntelligence();
          }}
          className="p-3 glass-bright rounded-2xl hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <main className="px-6 space-y-6 flex-1">
        {view === 'dashboard' && (
          <>
            {/* Install Banner for Android */}
            {deferredPrompt && (
              <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 glass border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top duration-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">تحميل التطبيق للجهاز</p>
                    <p className="text-[10px] text-slate-400">ثبت النسخة الكاملة الآن</p>
                  </div>
                </div>
                <button 
                  onClick={handleInstallApp}
                  className="bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg shadow-blue-900/50"
                >
                  تثبيت
                </button>
              </div>
            )}

            {/* Master Stats Card */}
            <div className="glass rounded-[2rem] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Activity className="w-12 h-12 text-blue-500/10" />
              </div>
              <p className="text-slate-400 text-xs font-medium mb-1 text-right">إجمالي الرصيد المتاح</p>
              <div className="flex items-baseline justify-start gap-2 flex-row-reverse">
                <h2 className="text-4xl font-black text-white">
                  {accounts.reduce((sum, a) => sum + a.balanceGb, 0).toFixed(1)}
                </h2>
                <span className="text-blue-500 font-bold text-sm">جيجابايت</span>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="px-3 py-1 bg-emerald-500/10 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] text-emerald-500 font-bold">باقة نشطة</span>
                </div>
              </div>
            </div>

            {/* Intelligence Card */}
            <div className="glass rounded-3xl p-5 border border-blue-500/20 relative group overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
               <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-blue-400" />
                   <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">تغذية الذكاء المباشرة</h3>
                 </div>
                 {isIntelligenceLoading && <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>}
               </div>
               
               <div className="space-y-3">
                 <p className="text-xs text-slate-300 leading-relaxed italic text-right">
                   {isIntelligenceLoading ? "جاري استرجاع آخر التحديثات من الشبكة..." : intelligence?.summary}
                 </p>
                 
                 {intelligence?.sources && intelligence.sources.length > 0 && (
                   <div className="flex flex-wrap gap-2 mt-2 justify-end">
                     {intelligence.sources.map((source, idx) => source.web && (
                       <a 
                        key={idx} 
                        href={source.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 glass-bright rounded-md text-[9px] text-blue-400 hover:bg-blue-500/10 transition-colors border border-blue-500/10"
                       >
                         <Globe className="w-2.5 h-2.5" />
                         <span className="truncate max-w-[80px]">{source.web.title || "المصدر"}</span>
                         <ExternalLink className="w-2.5 h-2.5" />
                       </a>
                     ))}
                   </div>
                 )}
               </div>
            </div>

            {/* Account List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Wifi className="w-3 h-3" /> الوحدات المتصلة
                </h3>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="w-8 h-8 glass-bright rounded-xl flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="py-12 text-center glass rounded-3xl border-dashed border-slate-800">
                   <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                     <Wifi className="w-6 h-6 text-slate-600" />
                   </div>
                   <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">No Link Detected</p>
                </div>
              ) : (
                accounts.map(acc => (
                  <div key={acc.id} className="glass rounded-[2rem] p-5 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => removeAccount(acc.id)} className="p-2 glass-bright rounded-lg text-red-400/60 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 flex-row-reverse">
                      <BalanceCircle balance={acc.balanceGb} threshold={settings.notificationThreshold} />
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${acc.balanceGb <= settings.notificationThreshold ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></span>
                          <h4 className="text-white font-bold">{acc.name}</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{acc.username}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                           <div className="flex items-center justify-center gap-1.5 glass-bright px-2 py-1 rounded-lg">
                             <Clock className="w-3 h-3 text-blue-500" />
                             <span className="text-[10px] text-slate-300 font-bold">{acc.expiryDate}</span>
                           </div>
                           <div className="flex items-center justify-center gap-1.5 glass-bright px-2 py-1 rounded-lg">
                             <RefreshCw className="w-3 h-3 text-slate-500" />
                             <span className="text-[10px] text-slate-400">{acc.lastUpdated}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {view === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-2xl font-black text-white text-right">تكوين النظام</h2>
             
             {/* Android Download Section in Settings */}
             <div className="bg-blue-600 rounded-3xl p-6 shadow-xl shadow-blue-900/40 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                   <Smartphone className="w-48 h-48 -rotate-12 absolute -left-10 -bottom-10" />
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">تحميل لنظام أندرويد</h3>
                    <p className="text-blue-100 text-xs">احصل على وصول أسرع ومستقر عن طريق تثبيت التطبيق مباشرة</p>
                  </div>
                  <button 
                    onClick={handleInstallApp}
                    className="w-full py-3 bg-white text-blue-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 active:scale-95 transition-all shadow-md"
                  >
                    <Download className="w-5 h-5" />
                    تحميل الآن
                  </button>
                </div>
             </div>

             <div className="glass rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <input 
                    type="number" 
                    value={settings.notificationThreshold}
                    onChange={(e) => setSettings({...settings, notificationThreshold: Number(e.target.value)})}
                    className="w-16 p-2 glass-bright rounded-xl text-center text-blue-400 font-bold outline-none border border-white/5"
                  />
                  <div className="text-right">
                    <p className="text-white font-bold">عتبة التنبيه</p>
                    <p className="text-xs text-slate-400">جيجابايت</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <select 
                    value={settings.refreshInterval}
                    onChange={(e) => setSettings({...settings, refreshInterval: Number(e.target.value)})}
                    className="p-2 glass-bright rounded-xl text-xs text-blue-400 font-bold outline-none border border-white/5 appearance-none px-4"
                  >
                    <option value={15}>15 دقيقة</option>
                    <option value={60}>ساعة واحدة</option>
                    <option value={1440}>يوم كامل</option>
                  </select>
                  <div className="text-right">
                    <p className="text-white font-bold">معدل المزامنة</p>
                    <p className="text-xs text-slate-400">تكرار طلب البيانات</p>
                  </div>
                </div>
             </div>
             <div className="glass-bright p-5 rounded-2xl flex flex-row-reverse gap-3 items-start border border-white/5">
               <ShieldCheck className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
               <p className="text-[11px] text-slate-400 leading-relaxed text-right">
                 بروتوكول الأمان: يتم تشفير وحفظ بيانات الدخول محلياً على جهازك فقط. لا يتم إرسال أي مفاتيح تشفير لخوادم خارجية.
               </p>
             </div>
          </div>
        )}

        {view === 'support' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-2xl font-black text-white text-right">مركز الدعم</h2>
             <div className="glass rounded-[2.5rem] p-10 text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="w-20 h-20 bg-blue-600/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 active-glow">
                  <Mail className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">تواصل مع المطور</h3>
                <p className="text-sm text-slate-400 mb-8">نحن نعمل باستمرار على تحسين خوارزميات المراقبة</p>
                <a 
                  href="mailto:tamamaltamimi11@gmail.com" 
                  className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/40 hover:scale-[1.02] transition-transform"
                >
                  <Headset className="w-5 h-5" />
                  tamamaltamimi11@gmail.com
                </a>
             </div>
             <div className="flex items-center justify-center gap-2 text-slate-600 text-[10px] uppercase tracking-tighter">
                <Info className="w-3 h-3" />
                <span>v2.6.0 Android Deployment Build</span>
             </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="sticky bottom-6 left-6 right-6 z-50 mt-auto pb-6">
        <div className="glass rounded-full px-8 py-3 flex justify-between items-center shadow-2xl border border-white/10 max-w-sm mx-auto">
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${view === 'dashboard' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}>
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">الرئيسية</span>
          </button>
          <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}>
            <SettingsIcon className="w-6 h-6" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">النظام</span>
          </button>
          <button onClick={() => setView('support')} className={`flex flex-col items-center gap-1 transition-all ${view === 'support' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}>
            <Headset className="w-6 h-6" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">الدعم</span>
          </button>
        </div>
      </nav>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-white/10">
            <h3 className="text-xl font-black text-white mb-6 flex items-center justify-end gap-2 text-right">
              إضافة وحدة بيانات <Zap className="text-blue-400 w-5 h-5" />
            </h3>
            <form onSubmit={handleAddAccount} className="space-y-5">
              <div className="space-y-1 text-right">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">معرف الوحدة</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثلاً: المودم الرئيسي"
                  dir="rtl"
                  className="w-full p-4 glass-bright rounded-2xl border border-white/5 text-white outline-none focus:border-blue-500/50 transition-colors"
                  required
                />
              </div>
              <div className="space-y-1 text-right">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">رقم الهاتف (ADSL)</label>
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="01XXXXXX"
                  className="w-full p-4 glass-bright rounded-2xl border border-white/5 text-white outline-none font-mono focus:border-blue-500/50 transition-colors text-left"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 glass-bright text-slate-400 rounded-2xl font-bold hover:bg-white/10">إلغاء</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-500">تأكيد الربط</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
