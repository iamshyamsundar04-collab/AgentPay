import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Bot, Shield, DollarSign, Clock, LayoutDashboard, Building2, User } from 'lucide-react';
import { TransactionHistory, TransactionRecord, initialTransactions } from './components/TransactionHistory';
import { VendorDirectory } from './components/VendorDirectory';
import { UserProfile } from './components/UserProfile';
import { AuthModal } from './components/AuthModal';

export default function App() {
  // Starts with NO hardcoded user
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'cockpit' | 'vendors' | 'profile'>('cockpit');
  const [transactions, setTransactions] = useState<TransactionRecord[]>(initialTransactions);

  // Sync Supabase Auth session on app load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const autoTransactions = transactions.filter(t => t.type === 'auto_agent');
  const humanTransactions = transactions.filter(t => t.type === 'human_approved');
  const totalSettled = [...autoTransactions, ...humanTransactions].reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <Shield className="w-3.5 h-3.5" /> PayPal AI Hackathon 2026
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">AgentPay</h1>
          </div>

          {/* Tab Navigation */}
          <nav className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setActiveTab('cockpit')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'cockpit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Cockpit
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'vendors' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> Vendors & Policies
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'profile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" /> 
              {currentUser ? 'Profile' : 'Sign Up / Profile'}
            </button>
          </nav>
        </header>

        {/* Tab 1: Cockpit */}
        {activeTab === 'cockpit' && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Total Settled Spend
                </span>
                <p className="text-2xl font-bold font-mono text-white mt-2">${totalSettled.toFixed(2)}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-emerald-400" /> Auto-Executed
                </span>
                <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">{autoTransactions.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" /> Human Interventions
                </span>
                <p className="text-2xl font-bold font-mono text-blue-300 mt-2">{humanTransactions.length}</p>
              </div>
            </section>

            <TransactionHistory transactions={transactions} />
          </div>
        )}

        {/* Tab 2: Vendors & Spending Policies */}
        {activeTab === 'vendors' && <VendorDirectory />}

        {/* Tab 3: Profile (Shows Sign Up / Sign In if not logged in) */}
        {activeTab === 'profile' && (
          currentUser ? (
            <UserProfile 
              user={currentUser} 
              onLogout={() => setCurrentUser(null)} 
            />
          ) : (
            <div className="space-y-6">
              <AuthModal onSuccess={(user) => setCurrentUser(user)} />
            </div>
          )
        )}

      </div>
    </div>
  );
}
