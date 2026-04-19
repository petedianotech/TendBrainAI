'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Bot, LayoutDashboard, CalendarDays, Settings, 
  Activity, ArrowRight, CheckCircle2,
  Clock, Plus, MessageSquare, Zap
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const [drafts, setDrafts] = useState([
    { id: 1, title: 'AI in Healthcare 2026', platform: 'LinkedIn', time: 'Generated 2h ago' },
    { id: 2, title: 'Sustainable Tech Tips', platform: 'Twitter', time: 'Generated 5h ago' }
  ]);
  const [scheduled, setScheduled] = useState([
    { id: 3, title: 'Future of Remote Work', platform: 'LinkedIn', time: 'Today 10:00 AM' }
  ]);
  const [published, setPublished] = useState([
    { id: 4, title: 'Announcing TrendBrain', platform: 'Twitter', time: 'Yesterday 2:00 PM' }
  ]);
  const [niche, setNiche] = useState('SaaS Startup Founders');
  const [tone, setTone] = useState('Professional but approachable');
  const [generatedPost, setGeneratedPost] = useState('');

  const generatePost = async () => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      alert("Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable.");
      return;
    }
    
    setIsGenerating(true);
    setGeneratedPost('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const prompt = `
        You are TrendBrain, an AI-powered social media autopilot. 
        My user's niche is: "${niche}".
        Their brand tone is: "${tone}".

        Simulate today's global trends, pick one that fits the niche, and write a highly engaging social media draft ready to be posted. 
        Don't use hashtags if it's for LinkedIn, but use a few if it's for Twitter. Give me the post content directly.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setGeneratedPost(response.text || 'Failed to generate post text.');
      
      // Add to drafts
      setDrafts(prev => [
        { id: Date.now(), title: 'New AI Draft based on Live Trends', platform: 'Cross-platform', time: 'Just now' },
        ...prev
      ]);
    } catch (error) {
      console.error(error);
      alert('Failed to generate post. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">TrendBrain</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={18} />} label="Command Center" active />
          <NavItem icon={<CalendarDays size={18} />} label="Schedule" />
          <NavItem icon={<MessageSquare size={18} />} label="Drafts" badge={drafts.length} />
          <NavItem icon={<Activity size={18} />} label="Analytics" />
          <NavItem icon={<Settings size={18} />} label="Brand Settings" />
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Current Tier</p>
            <p className="text-sm font-semibold text-white mb-1">Tier 2: Big Business</p>
            <p className="text-xs text-slate-400 mb-3">6/6 Platforms Connected</p>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-slate-400 text-right">14 Days left</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Command Center</h1>
            <p className="text-sm text-slate-400">Your AI autopilot is actively scanning global trends.</p>
          </div>
          
          <button 
            onClick={generatePost}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isGenerating ? (
              <Zap size={16} className="animate-pulse" />
            ) : (
              <Plus size={16} />
            )}
            {isGenerating ? 'AI Generating...' : 'Force AI Generation'}
          </button>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Live Trend Radar */}
            <div className="col-span-1 lg:col-span-2 bg-slate-800 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                    <Activity size={20} className="text-teal-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Live Trend Radar</h2>
                    <p className="text-xs text-slate-400">Global scan across 4 platforms</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                  <span className="text-xs font-medium text-slate-300">Active</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <TrendItem trend="Artificial Intelligence in Healthcare" match="94%" category="Tech / Medicine" />
                <TrendItem trend="Sustainable Remote Work Tools" match="88%" category="Business" />
                <TrendItem trend="The Creator Economy 2.0" match="76%" category="Marketing" />
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
          
        </div>
      </main>
    </div>
  );
}

// Components

function NavItem({ icon, label, active, badge }: { icon: React.ReactNode, label: string, active?: boolean, badge?: number }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
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

function TrendItem({ trend, match, category }: { trend: string, match: string, category: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/30 transition-colors cursor-pointer group">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">{trend}</h4>
        <p className="text-xs text-slate-500 mt-1">{category}</p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-semibold text-teal-500">{match} Match</span>
        <ArrowRight size={14} className="text-slate-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
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
              <span className="text-xs text-slate-500">{item.time}</span>
            </div>
            <p className="text-sm font-medium text-white">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
