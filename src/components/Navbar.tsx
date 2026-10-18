import React from 'react';
import { 
  Compass, 
  Search, 
  GitFork, 
  Columns, 
  FileText, 
  CheckCircle2, 
  BookOpen, 
  RotateCcw,
  ShieldAlert,
  Layers
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'locations' 
  | 'search' 
  | 'lineage' 
  | 'compare' 
  | 'reports' 
  | 'reviews' 
  | 'docs';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onResetData: () => void;
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;
  pendingReviewCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onResetData,
  language,
  setLanguage,
  pendingReviewCount,
}) => {
  const isBn = language === 'bn';

  const navItems: { id: NavTab; labelEn: string; labelBn: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', labelEn: 'Dashboard', labelBn: 'ড্যাশবোর্ড', icon: <Layers className="w-4 h-4" /> },
    { id: 'locations', labelEn: 'Locations', labelBn: 'মৌজা ও এলাকা', icon: <Compass className="w-4 h-4" /> },
    { id: 'search', labelEn: 'Search Parcels', labelBn: 'দাগ অনুসন্ধান', icon: <Search className="w-4 h-4" /> },
    { id: 'lineage', labelEn: 'Lineage Graph', labelBn: 'ধারাবাহিকতা গ্রাফ', icon: <GitFork className="w-4 h-4" /> },
    { id: 'compare', labelEn: 'Side-by-Side', labelBn: 'রেকর্ড তুলনা', icon: <Columns className="w-4 h-4" /> },
    { id: 'reports', labelEn: 'Evidence Reports', labelBn: 'প্রমাণ প্রতিবেদন', icon: <FileText className="w-4 h-4" /> },
    { id: 'reviews', labelEn: 'Review Queue', labelBn: 'পর্যালোচনা', icon: <CheckCircle2 className="w-4 h-4" />, badge: pendingReviewCount },
    { id: 'docs', labelEn: 'Concept & Docs', labelBn: 'ধারণাপত্র', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-md">
      {/* Top Banner: Verification Platform Notice */}
      <div className="bg-emerald-950 border-b border-emerald-800/60 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-300">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-800 text-emerald-100 uppercase tracking-wider">
            Verification Platform
          </span>
          <span className="text-stone-300">
            Bangladesh Historical Land Record Lineage & Cadastral Archive • <strong className="text-amber-300 font-medium">Demonstration Cadastral Dataset</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage(isBn ? 'en' : 'bn')}
            className="text-stone-300 hover:text-white px-2 py-0.5 rounded text-xs bg-stone-800/80 hover:bg-stone-800 border border-stone-700 transition"
          >
            {isBn ? 'English View' : 'বাংলা সংস্করণ'}
          </button>
          <button
            onClick={() => {
              if (confirm('Reset synthetic database and review decisions to default seed?')) {
                onResetData();
              }
            }}
            title="Reset demonstration data"
            className="text-stone-400 hover:text-amber-300 flex items-center gap-1 text-xs transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Seed</span>
          </button>
        </div>
      </div>

      {/* Main Brand & Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 p-0.5 shadow-inner flex items-center justify-center border border-emerald-400/40 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded bg-stone-900 flex items-center justify-center text-emerald-400 font-bold text-lg">
              ভূ
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition">
                BhumiSutra
              </span>
              <span className="text-stone-400 text-sm font-medium font-serif">
                (ভূমিসূত্র)
              </span>
            </div>
            <p className="text-[11px] text-stone-400 tracking-tight">
              Bangladesh Historical Land Record Lineage Platform
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                {item.icon}
                <span>{isBn ? item.labelBn : item.labelEn}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-emerald-900 text-emerald-200' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Legal Disclaimer Pill */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400 bg-stone-800/80 px-2.5 py-1.5 rounded border border-stone-700/80">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] text-stone-300">
            Decision Support Tool (Not Legal Certification)
          </span>
        </div>
      </div>

      {/* Mobile Tab Scroll Bar */}
      <div className="lg:hidden flex overflow-x-auto px-4 py-2 bg-stone-950 border-t border-stone-800 gap-1.5 scrollbar-thin">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-1 px-3 py-1.5 rounded text-xs font-medium ${
                isActive ? 'bg-emerald-600 text-white' : 'text-stone-300 bg-stone-900'
              }`}
            >
              {item.icon}
              <span>{isBn ? item.labelBn : item.labelEn}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
