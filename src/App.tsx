import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Bot, 
  Layers, 
  UserCheck, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  Check, 
  X,
  CreditCard,
  DollarSign
} from 'lucide-react';
import TransactionHistory from './components/TransactionHistory';
import VendorDirectory from './components/VendorDirectory';
import UserProfile from './components/UserProfile';
import AuthModal from './components/AuthModal';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'paused';
  dailyBudget: number;
  spent24h: number;
  maxPerTx: number;
  autoApproveThreshold: number;
}

interface PendingApproval {
  id: string;
  agentName: string;
  vendor: string;
  amount: number;
  currency: string;
  justification: string;
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'vendors' | 'profile'>('cockpit');
  const [user, setUser] = useState<any>(null);

  // Active Demo Agents
  const [agents] = useState<Agent[]>([
    {
      id: 'ag-01',
      name: 'Market Research Copilot',
      status: 'active',
      dailyBudget: 30.0,
      spent24h: 7.7,
      maxPerTx: 10.0,
      autoApproveThreshold: 5.0
    },
    {
      id: 'ag-02',
      name: 'DevOps Auto-Scaler',
      status: 'active',
      dailyBudget: 100.0,
      spent24h: 38.2,
      maxPerTx: 35.0,
      autoApproveThreshold: 15.0
    }
  ]);

  // Pending Approvals Queue
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    {
      id: 'req-901',
      agentName: 'DevOps Auto-Scaler',
      vendor: 'AWS Cloud Compute (GPU Cluster)',
      amount: 45.0,
      currency: 'USD',
      justification: 'Emergency GPU scale-up due to queued workflow backlog',
      timestamp: '2 mins ago'
    }
  ]);

  // Transaction Ledger State
  const [transactions, setTransactions] = useState<any[]>([
    {
      id: 'tx-101',
      agentName: 'Market Research Copilot',
      vendor: 'SerpAPI Search Credits',
      amount: 4.5,
      currency: 'USD',
      type: 'auto_agent',
      approvedBy: 'Auto-Policy Engine (< $5.00 threshold)',
      paypalOrderId: '89B72134LM09923',
      taskDescription: 'Batch Google SERP scraping for competitor price check',
      timestamp: '12 mins ago'
    },
    {
      id: 'tx-102',
      agentName: 'DevOps Auto-Scaler',
      vendor: 'Datadog Log Streaming',
      amount: 18.0,
      currency: 'USD',
      type: 'manual_approval',
      approvedBy: 'Approved by Us (Admin)',
      paypalOrderId: '44K88129OP10921',
      taskDescription: 'Emergency server log ingestion during traffic spike',
      timestamp: '25 mins ago'
    },
    {
      id: 'tx-103',
      agentName: 'Market Research Copilot',
      vendor: 'OpenAI API Token Topup',
      amount: 3.2,
      currency: 'USD',
      type: 'auto_agent',
      approvedBy: 'Auto-Policy Engine (< $5.00 threshold)',
      paypalOrderId: '19C45678AA99301',
      taskDescription: 'Embeddings generation for newly gathered articles',
      timestamp: '1 hour ago'
    }
  ]);

  // Task Runner Form State
  const [selectedAgent, setSelectedAgent] = useState(agents[0].name);
  const [vendor, setVendor] = useState('SerpAPI');
  const [amount, setAmount] = useState('4.50');
  const [justification, setJustification] = useState('Scraping competitor market data');
  const [lastNotice, setLastNotice] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  // Trigger Spending Logic
  const handleTriggerTask = (customAmount?: number, customVendor?: string, customJust?: string) => {
    const amt = customAmount !== undefined ? customAmount : parseFloat(amount);
    const ven = customVendor || vendor;
    const just = customJust || justification;
    const ag = agents.find(a => a.name === selectedAgent) || agents[0];

    if (isNaN(amt) || amt <= 0) return;

    // Check Auto-approval Threshold
    if (amt <= ag.autoApproveThreshold) {
      // Auto-approved & Settled via PayPal
      const newTx = {
        id: `tx-${Date.now().toString().slice(-4)}`,
        agentName: ag.name,
        vendor: ven,
        amount: amt,
        currency: 'USD',
        type: 'auto_agent',
        approvedBy: `Auto-Policy Engine (< $${ag.autoApproveThreshold.toFixed(2)} threshold)`,
        paypalOrderId: `PP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        taskDescription: just,
        timestamp: 'Just now'
      };
      setTransactions([newTx, ...transactions]);
      setLastNotice({
        text: `Success: $${amt.toFixed(2)} auto-approved and settled via PayPal (Order: ${newTx.paypalOrderId})`,
        type: 'success'
      });
    } else {
      // Requires Human Approval
      const newApproval: PendingApproval = {
        id: `req-${Date.now().toString().slice(-3)}`,
        agentName: ag.name,
        vendor: ven,
        amount: amt,
        currency: 'USD',
        justification: just,
        timestamp: 'Just now'
      };
      setPendingApprovals([newApproval, ...pendingApprovals]);
      setLastNotice({
        text: `Policy Flag: $${amt.toFixed(2)} exceeds $${ag.autoApproveThreshold.toFixed(2)} auto-limit. Routed to Pending Approvals queue.`,
        type: 'warning'
      });
    }
  };

  // Human Approval Handler
  const handleApprove = (req: PendingApproval) => {
    const newTx = {
      id: `tx-${Date.now().toString().slice(-4)}`,
      agentName: req.agentName,
      vendor: req.vendor,
      amount: req.amount,
      currency: req.currency,
      type: 'manual_approval',
      approvedBy: 'Approved by Us (Admin)',
      paypalOrderId: `PP-MANUAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      taskDescription: req.justification,
      timestamp: 'Just now'
    };
    setTransactions([newTx, ...transactions]);
    setPendingApprovals(pendingApprovals.filter(p => p.id !== req.id));
    setLastNotice({
      text: `Approved: $${req.amount.toFixed(2)} settled via PayPal (Order: ${newTx.paypalOrderId})`,
      type: 'success'
    });
  };

  // Human Decline Handler
  const handleDecline = (id: string) => {
    setPendingApprovals(pendingApprovals.filter(p => p.id !== id));
    setLastNotice({
      text: 'Declined: Spending request rejected. No PayPal funds drawn.',
      type: 'warning'
    });
  };

  // Metrics
  const totalSettled = transactions.reduce((sum, t) => sum + t.amount, 0);
  const autoCount = transactions.filter(t => t.type === 'auto_agent').length;
  const manualCount = transactions.filter(t => t.type === 'manual_approval').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">AgentPay</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md">
                  PayPal Sandbox
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Autonomous Agent Budgeting & Policy Firewall
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-950/80 p-1 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setActiveTab('cockpit')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'cockpit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> Cockpit
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'vendors' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Vendors & Policies
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'profile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> {user ? 'Profile' : 'Sign Up / Profile'}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'cockpit' && (
          <div className="space-y-8">
            {/* Top Metrics Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Settled Spend
                </span>
                <p className="text-2xl font-bold font-mono text-white mt-1.5">${totalSettled.toFixed(2)}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto-Executed
                </span>
                <p className="text-2xl font-bold font-mono text-emerald-300 mt-1.5">{autoCount}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-400" /> Human Approved
                </span>
                <p className="text-2xl font-bold font-mono text-blue-300 mt-1.5">{manualCount}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" /> Pending Queue
                </span>
                <p className="text-2xl font-bold font-mono text-amber-300 mt-1.5">{pendingApprovals.length}</p>
              </div>
            </section>

            {/* Notification Banner */}
            {lastNotice && (
              <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
                lastNotice.type === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' 
                  : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
              }`}>
                <span>{lastNotice.text}</span>
                <button onClick={() => setLastNotice(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
            )}

            {/* Middle Section: Active Agents & Task Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Active Agents (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" /> Active Autonomous Agents
                </h3>
                <div className="space-y-3">
                  {agents.map(ag => (
                    <div key={ag.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{ag.name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                          ACTIVE
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>24h Budget Spent</span>
                          <span className="font-mono text-white font-medium">${ag.spent24h.toFixed(2)} / ${ag.dailyBudget.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all" 
                            style={{ width: `${(ag.spent24h / ag.dailyBudget) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60 text-slate-400">
                        <div>Max / Tx: <span className="text-white font-mono">${ag.maxPerTx.toFixed(2)}</span></div>
                        <div>Auto-Approve: <span className="text-emerald-400 font-mono">&lt; ${ag.autoApproveThreshold.toFixed(2)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Trigger Simulator (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400" /> Interactive Task Simulator
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-medium">Select Agent</label>
                      <select 
                        value={selectedAgent} 
                        onChange={e => setSelectedAgent(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-medium">Vendor Service</label>
                      <input 
                        type="text" 
                        value={vendor} 
                        onChange={e => setVendor(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-medium">Amount (USD)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-medium">Task Justification</label>
                      <input 
                        type="text" 
                        value={justification} 
                        onChange={e => setJustification(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Quick Scenarios for Instant Video Demo */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] text-slate-400">Quick Test:</span>
                    <button
                      type="button"
                      onClick={() => handleTriggerTask(4.50, 'SerpAPI Search Credits', 'Scraping competitor market data')}
                      className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-300 rounded-lg text-[11px] font-medium"
                    >
                      ⚡ Auto-Pay ($4.50 SerpAPI)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerTask(45.00, 'AWS Cloud Compute (GPU Cluster)', 'Emergency GPU scale-up due to backlog')}
                      className="px-2.5 py-1 bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900/60 text-amber-300 rounded-lg text-[11px] font-medium"
                    >
                      ⚠️ Needs Approval ($45.00 AWS)
                    </button>
                  </div>

                  <button
                    onClick={() => handleTriggerTask()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Agent Payment Request
                  </button>
                </div>
              </div>
            </div>

            {/* Pending Approvals Queue */}
            {pendingApprovals.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Pending Approvals Queue ({pendingApprovals.length})
                  </h3>
                  <span className="text-xs text-slate-400">Awaiting Human Sign-off</span>
                </div>
                <div className="space-y-3">
                  {pendingApprovals.map(req => (
                    <div key={req.id} className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{req.vendor}</span>
                          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                            ${req.amount.toFixed(2)} {req.currency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Agent: <span className="text-white font-medium">{req.agentName}</span> — "{req.justification}"
                        </p>
                        <span className="text-[10px] text-slate-400">{req.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(req)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve & Pay (PayPal)
                        </button>
                        <button
                          onClick={() => handleDecline(req.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Settled Transactions Audit History */}
            <section className="space-y-3">
              <TransactionHistory transactions={transactions} />
            </section>
          </div>
        )}

        {/* Vendors Tab */}
        {activeTab === 'vendors' && <VendorDirectory />}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          user ? (
            <UserProfile user={user} onLogout={() => setUser(null)} />
          ) : (
            <div className="space-y-6">
              <AuthModal onSuccess={u => setUser(u)} />
            </div>
          )
        )}
      </main>
    </div>
  );
}
