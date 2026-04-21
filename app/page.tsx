'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { 
  Bot, LayoutDashboard, CalendarDays, Settings, 
  Activity, ArrowRight, CheckCircle2,
  Clock, Plus, MessageSquare, Zap, Menu, X,
  Github, Twitter, Linkedin, Facebook, Instagram, Youtube,
  ShieldCheck, Share2, Globe, Send, Sparkles
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const [niche, setNiche] = useState('SaaS Startup Founders');
  const [tone, setTone] = useState('Professional but approachable');
  const [twitterApiKey, setTwitterApiKey] = useState('');
  const [linkedinApiKey, setLinkedinApiKey] = useState('');
  
  const [drafts, setDrafts] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [published, setPublished] = useState<any[]>([]);
  
  const [generatedPost, setGeneratedPost] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth');
      } else {
        // Load Brand Settings
        const profileDoc = await getDoc(doc(db, 'brandProfiles', user.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setNiche(data.niche || '');
          setTone(data.tone || '');
          setTwitterApiKey(data.twitterApiKey || '');
          setLinkedinApiKey(data.linkedinApiKey || '');
        }

        // Load Posts real-time
        const q = query(collection(db, 'posts'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const unsubscribePosts = onSnapshot(q, (snapshot) => {
          const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setDrafts(allPosts.filter((p: any) => p.status === 'draft'));
          setScheduled(allPosts.filter((p: any) => p.status === 'scheduled'));
          setPublished(allPosts.filter((p: any) => p.status === 'published'));
          setLoading(false);
        });

        return () => unsubscribePosts();
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  const saveSettings = async () => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'brandProfiles', auth.currentUser.uid), {
        niche,
        tone,
        twitterApiKey,
        linkedinApiKey,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Error saving settings.');
    }
  };
  
  const handleSignOut = async () => {
    await signOut(auth);
  };

  const generatePost = async () => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      alert("Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable. You must configure Gemini.");
      return;
    }
    
    setIsGenerating(true);
    setGeneratedPost('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      // In a real application without simulation, we would use the twitterApiKey or linkedinApiKey 
      // here to call their respective APIs and fetch real trends.
      // Since this is the frontend environment, we perform the core text generation here 
      // and use Gemini's built in googleSearch config to find actual live trends!
      
      const prompt = `
        You are Tend Brain AI, an expert social media manager.
        My niche is: "${niche}".
        My brand tone is: "${tone}".

        Fetch today's global trending topics related to this niche. Pick the most relevant trend, and write a highly engaging social media draft. 
        Ensure it is formatted for high engagement. Give me the post content directly.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview', // High reasoning
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }] // Requesting live tool integration!
        }
      });

      setGeneratedPost(response.text || 'Failed to generate post text.');
      
      // Save to Firestore as Draft
      if (auth.currentUser) {
        await addDoc(collection(db, 'posts'), {
          userId: auth.currentUser.uid,
          title: 'AI Trend Draft',
          content: response.text,
          platform: 'Cross-platform',
          status: 'draft',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate post. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100">
      
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
          <SidebarContent 
            draftsCount={drafts.length} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onSignOut={handleSignOut} 
            twitterApiKey={twitterApiKey}
            linkedinApiKey={linkedinApiKey}
          />
        </aside>
      )}

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-900 z-50 border-r border-slate-800 flex flex-col shadow-2xl"
            >
              <SidebarContent 
                draftsCount={drafts.length} 
                onClose={() => setIsSidebarOpen(false)} 
                activeTab={activeTab} 
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setIsSidebarOpen(false);
                }}
                onSignOut={handleSignOut} 
                twitterApiKey={twitterApiKey}
                linkedinApiKey={linkedinApiKey}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        
        {/* Header */}
        <header className="h-16 md:h-20 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-900/80 backdrop-blur-md z-30 sticky top-0">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <Menu size={24} />
              </button>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight leading-none">
                {activeTab === 'dashboard' ? 'Command Center' : 'Brand Settings'}
              </h1>
              <p className="text-[10px] md:text-sm text-slate-400 mt-1 hidden xs:block">
                {activeTab === 'dashboard' ? 'AI autopilot is scanning global trends.' : 'Configure your AI identity and external API connections.'}
              </p>
            </div>
          </div>
          
          {activeTab === 'dashboard' && (
            <button 
              onClick={generatePost}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95 whitespace-nowrap"
            >
              {isGenerating ? (
                <Zap size={14} className="animate-pulse" />
              ) : (
                <Plus size={14} />
              )}
              <span className="hidden sm:inline">{isGenerating ? 'AI Generating...' : 'Force AI Generation'}</span>
              <span className="sm:hidden">{isGenerating ? '...' : 'Generate'}</span>
            </button>
          )}
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
          
          {activeTab === 'dashboard' ? (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            
            {/* Live Trend Radar */}
            <div className="col-span-1 xl:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <Activity size={20} className="text-teal-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Live Trend Radar</h2>
                    <p className="text-xs text-slate-400">AI-powered scan across social clusters</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-700/50">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Sync</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <TrendItem trend="Artificial Intelligence in Healthcare" category="Tech / Medicine" platformIcon={<Globe size={12}/>} />
                <TrendItem trend="Sustainable Remote Work Tools" category="Business" platformIcon={<Twitter size={12}/>} />
                <TrendItem trend="The Creator Economy 2.0" category="Marketing" platformIcon={<Linkedin size={12}/>} />
              </div>
            </div>

            {/* AI Setup & Action Window */}
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 flex flex-col">
              <h2 className="text-lg font-semibold text-white mb-4">Latest AI Draft</h2>
              
              <div className="flex-1 border border-slate-700 rounded-xl p-4 bg-slate-900 overflow-y-auto mb-4 text-sm text-slate-300 relative group">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                      <Zap size={24} className="animate-pulse text-indigo-500" />
                      <p>TrendBrain is analyzing trends...</p>
                    </div>
                  ) : generatedPost ? (
                    <div className="whitespace-pre-wrap">{generatedPost}</div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <p>No recent drafted post.</p>
                    </div>
                  )}
              </div>
              
              <button 
                disabled={isGenerating || !generatedPost}
                className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                <CheckCircle2 size={16} />
                Approve & Schedule
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KanbanColumn 
              title="AI Drafts" 
              count={drafts.length}
              items={drafts}
              icon={<MessageSquare size={16} className="text-slate-400" />}
            />
            <KanbanColumn 
              title="Scheduled" 
              count={scheduled.length}
              items={scheduled}
              icon={<Clock size={16} className="text-indigo-400" />}
            />
            <KanbanColumn 
              title="Published" 
              count={published.length}
              items={published}
              icon={<CheckCircle2 size={16} className="text-teal-500" />}
            />
          </div>
          </>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Bot size={20} className="text-indigo-400" /> AI Identity Setup
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Your Brand Niche</label>
                    <input 
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="e.g. SaaS Startup Founders, Fitness Tech..."
                    />
                    <p className="text-xs text-slate-500 mt-1">This context helps the AI scan for the most relevant global trends.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Brand Voice & Tone</label>
                    <input 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="e.g. Professional but approachable, Witty and bold..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Share2 size={120} />
                </div>
                
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Settings size={20} className="text-teal-400" /> Platform Connections
                  </h2>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                    OAUTH & API
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <PlatformCard 
                    icon={<Twitter className="text-[#1DA1F2]" size={24} />} 
                    name="X (Twitter)" 
                    description="Live trends and tweet scheduling"
                    status={twitterApiKey ? 'Connected' : 'Disconnected'}
                  />
                  <PlatformCard 
                    icon={<Linkedin className="text-[#0A66C2]" size={24} />} 
                    name="LinkedIn" 
                    description="Professional networking and brand reach"
                    status={linkedinApiKey ? 'Connected' : 'Disconnected'}
                  />
                  <PlatformCard 
                    icon={<Instagram className="text-[#E4405F]" size={24} />} 
                    name="Instagram" 
                    description="Visual storytelling and reels"
                    status="Coming Soon"
                    disabled
                  />
                  <PlatformCard 
                    icon={<Facebook className="text-[#1877F2]" size={24} />} 
                    name="Facebook" 
                    description="Community engagement and groups"
                    status="Coming Soon"
                    disabled
                  />
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-700">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-indigo-400" /> Advanced API Access
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">X (Twitter) Developer API Key</label>
                        <input 
                          type="password"
                          value={twitterApiKey}
                          onChange={(e) => setTwitterApiKey(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">LinkedIn API Bearer Token</label>
                        <input 
                          type="password"
                          value={linkedinApiKey}
                          onChange={(e) => setLinkedinApiKey(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                          placeholder="AQX..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={saveSettings}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                  >
                    Sync Accounts <ArrowRight size={16} />
                  </button>
                </div>
              </div>

            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}

// Components

function SidebarContent({ 
  draftsCount, 
  onClose,
  activeTab,
  setActiveTab,
  onSignOut,
  twitterApiKey,
  linkedinApiKey
}: { 
  draftsCount: number, 
  onClose?: () => void,
  activeTab: 'dashboard' | 'settings',
  setActiveTab: (t: 'dashboard' | 'settings') => void,
  onSignOut: () => void,
  twitterApiKey: string,
  linkedinApiKey: string
}) {
  return (
    <>
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">TrendBrainAI</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500">
            <X size={20} />
          </button>
        )}
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <NavItem 
          icon={<LayoutDashboard size={18} />} 
          label="Command Center" 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <NavItem icon={<CalendarDays size={18} className="opacity-50" />} label="Schedule (Soon)" />
        <NavItem icon={<MessageSquare size={18} className="opacity-50" />} label="Drafts" badge={draftsCount} />
        <NavItem icon={<Activity size={18} className="opacity-50" />} label="Analytics (Soon)" />
        <NavItem 
          icon={<Settings size={18} />} 
          label="Brand Settings" 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        />
      </nav>
      
      <div className="p-4 border-t border-slate-800 mt-auto space-y-4">
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all cursor-pointer group" onClick={() => setActiveTab('settings')}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Active Channels</p>
            <Sparkles size={12} className="text-indigo-400 animate-pulse" />
          </div>
          <div className="flex items-center -space-x-2">
            <div className={`w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-800 overflow-hidden ${twitterApiKey ? 'opacity-100' : 'opacity-30'}`}>
              <Twitter size={14} className={twitterApiKey ? 'text-[#1DA1F2]' : 'text-slate-400'} />
            </div>
            <div className={`w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-800 overflow-hidden ${linkedinApiKey ? 'opacity-100' : 'opacity-30'}`}>
              <Linkedin size={14} className={linkedinApiKey ? 'text-[#0A66C2]' : 'text-slate-400'} />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-800 overflow-hidden opacity-10">
              <Instagram size={14} className="text-slate-400" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-800">
              <Plus size={10} className="text-slate-500" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 group-hover:text-slate-300 transition-colors capitalize">click to manage socials</p>
        </div>

        <button 
          onClick={onSignOut}
          className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all font-medium border border-transparent hover:border-red-500/10 flex items-center justify-between group"
        >
          Sign Out
          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
        </button>
      </div>
    </>
  );
}

function NavItem({ icon, label, active, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: number, onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${onClick ? 'cursor-pointer' : 'cursor-default'} ${
      active ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
    }`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function TrendItem({ trend, category, platformIcon }: { trend: string, category: string, platformIcon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-700/40 border border-transparent hover:border-slate-700/50 transition-all cursor-pointer group">
      <div className="flex items-center gap-3">
        {platformIcon && (
          <div className="w-6 h-6 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
            {platformIcon}
          </div>
        )}
        <div>
          <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{trend}</h4>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{category}</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <ArrowRight size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
      </div>
    </div>
  );
}

function PlatformCard({ icon, name, description, status, disabled }: { icon: React.ReactNode, name: string, description: string, status: string, disabled?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      disabled ? 'bg-slate-900/30 border-slate-800 opacity-60' : 'bg-slate-900 border-slate-700 hover:border-indigo-500/50 active:scale-[0.98] cursor-pointer group'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-slate-800 rounded-lg">
          {icon}
        </div>
        <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
          status === 'Connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'
        }`}>
          {status}
        </div>
      </div>
      <h3 className="text-sm font-bold text-white mb-1">{name}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      
      {!disabled && (
        <button className="mt-4 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-all invisible group-hover:visible opacity-0 group-hover:opacity-100">
          Re-authorize
        </button>
      )}
    </div>
  );
}

function KanbanColumn({ title, count, items, icon }: { title: string, count: number, items: any[], icon: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        </div>
        <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full font-medium">{count}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {items.map((item, i) => (
          <div key={item.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl cursor-pointer hover:border-slate-500 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                item.platform === 'LinkedIn' ? 'bg-blue-500/10 text-blue-400' :
                item.platform === 'Twitter' ? 'bg-slate-700 text-slate-300' :
                'bg-indigo-500/10 text-indigo-400'
              }`}>
                {item.platform}
              </span>
              <span className="text-xs text-slate-500">
                {item.createdAt?.seconds 
                  ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : item.time}
              </span>
            </div>
            <p className="text-sm font-medium text-white">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
