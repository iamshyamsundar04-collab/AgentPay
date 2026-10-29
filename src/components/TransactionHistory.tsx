import React, { useState } from 'react';
import { 
  CheckCircle2, 
  UserCheck, 
  Clock, 
  XCircle, 
  ExternalLink, 
  Filter, 
  Search,
  Bot,
  User,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export interface TransactionRecord {
  id: string;
  agentName: string;
  vendor: string;
  amount: number;
  currency: string;
  type: 'auto_agent' | 'human_approved' | 'pending' | 'declined';
  approvedBy?: string; // e.g., 'Agent Policy Engine' or 'Shyam (Admin)'
  paypalOrderId?: string;
  taskDescription: string;
  timestamp: string;
}

// Fallback seed data so your screen is never blank while developing
export const initialTransactions: TransactionRecord[] = [
  {
    id: 'tx-101',
    agentName: 'Market Research Copilot',
    vendor: 'SerpAPI Search Credits',
    amount: 4.50,
    currency: 'USD',
    type: 'auto_agent',
    approvedBy: 'Auto-Policy Engine (< $5.00 threshold)',
    paypalOrderId: '89B72134LM09923',
    taskDescription: 'Keyword intelligence scraping batch #44',
    timestamp: 'Just now'
  },
  {
    id: 'tx-102',
    agentName: 'DevOps Auto-Scaler',
    vendor: 'AWS Cloud Compute Burst',
    amount: 28.50,
    currency: 'USD',
    type: 'human_approved',
    approvedBy: 'Shyam (Manual Approval)',
    paypalOrderId: '74X90123PP11290',
    taskDescription: 'Emergency server scaling during memory spike',
    timestamp: '25 mins ago'
  },
  {
    id: 'tx-103',
    agentName: 'Market Research Copilot',
    vendor: 'OpenAI API Token Topup',
    amount: 3.20,
    currency: 'USD',
    type: 'auto_agent',
    approvedBy: 'Auto-Policy Engine (< $5.00 threshold)',
    paypalOrderId: '19C45678AA99301',
    taskDescription: 'Embedding generation for competitor PDFs',
    timestamp: '2 hours ago'
  },
  {
    id: 'tx-104',
    agentName: 'Data Scraper Bot',
    vendor: 'BrightData Proxies',
    amount: 65.00,
    currency: 'USD',
    type: 'declined',
    approvedBy: 'Rejected: Exceeded $35 max transaction limit',
    taskDescription: 'Residential proxy bandwidth purchase',
    timestamp: 'Yesterday'
  }
];

interface Props {
  transactions?: TransactionRecord[];
}

export const TransactionHistory: React.FC<Props> = ({ transactions = initialTransactions }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate summary statistics
  const totalAutoSpent = transactions
    .filter(t => t.type === 'auto_agent')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalHumanSpent = transactions
    .filter(t => t.type === 'human_approved')
    .reduce((acc, t) => acc + t.amount, 0);

  // Filter list based on tabs and search query
  const filteredList = transactions.filter(tx => {
    const matchesFilter = 
      filterType === 'all' || 
      (filterType === 'auto' && tx.type === 'auto_agent') ||
      (filterType === 'human' && tx.type === 'human_approved') ||
      (filterType === 'declined' && tx.type === 'declined');

    const matchesSearch = 
      tx.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.paypalOrderId && tx.paypalOrderId.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Header & Stat Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            Settlement Audit & Transaction History
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete cryptographic audit trail of autonomous vs human-authorized PayPal spends
          </p>
        </div>

        {/* Quick Balance Breakdown */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-3 py-2 text-right">
            <span className="text-[10px] uppercase font-semibold text-emerald-400 flex items-center justify-end gap-1">
              <Bot className="w-3 h-3" /> Auto Settled
            </span>
            <p className="text-base font-bold text-emerald-300 font-mono">${totalAutoSpent.toFixed(2)}</p>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl px-3 py-2 text-right">
            <span className="text-[10px] uppercase font-semibold text-blue-400 flex items-center justify-end gap-1">
              <User className="w-3 h-3" /> Human Approved
            </span>
            <p className="text-base font-bold text-blue-300 font-mono">${totalHumanSpent.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Type Tabs */}
        <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'all' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Activity ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('auto')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              filterType === 'auto' 
                ? 'bg-emerald-600 text-white shadow' 
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Auto by Agent
          </button>
          <button
            onClick={() => setFilterType('human')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              filterType === 'human' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-slate-400 hover:text-blue-400'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Approved by Us
          </button>
          <button
            onClick={() => setFilterType('declined')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              filterType === 'declined' 
                ? 'bg-rose-600 text-white shadow' 
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Declined
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search vendor or PayPal ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Transactions Table / Card List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Agent & Purpose</th>
              <th className="py-3 px-4">Vendor</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Authorization Path</th>
              <th className="py-3 px-4">PayPal Ref</th>
              <th className="py-3 px-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No transactions match the selected filter.
                </td>
              </tr>
            ) : (
              filteredList.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors group">
                  {/* Agent & Task */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{tx.agentName}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{tx.taskDescription}</div>
                  </td>

                  {/* Vendor */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-300">{tx.vendor}</span>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4">
                    <span className={`font-mono font-bold text-sm ${
                      tx.type === 'declined' ? 'line-through text-slate-500' : 'text-white'
                    }`}>
                      ${tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">{tx.currency}</span>
                  </td>

                  {/* Authorization Badge */}
                  <td className="py-3.5 px-4">
                    {tx.type === 'auto_agent' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/70">
                        <Bot className="w-3 h-3 text-emerald-400" />
                        Autonomous (Agent)
                      </span>
                    )}
                    {tx.type === 'human_approved' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/70">
                        <UserCheck className="w-3 h-3 text-blue-400" />
                        Human Approved (Us)
                      </span>
                    )}
                    {tx.type === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/70">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Pending Approval
                      </span>
                    )}
                    {tx.type === 'declined' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800/70">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        Declined by Policy
                      </span>
                    )}
                    {tx.approvedBy && (
                      <div className="text-[10px] text-slate-400 mt-1 pl-1 truncate max-w-[200px]">
                        {tx.approvedBy}
                      </div>
                    )}
                  </td>

                  {/* PayPal ID */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {tx.paypalOrderId ? (
                      <a
                        href={`https://www.sandbox.paypal.com/activity/payment/${tx.paypalOrderId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group-hover:underline"
                      >
                        {tx.paypalOrderId}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-600">N/A</span>
                    )}
                  </td>

                  {/* Timestamp */}
                  <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                    {tx.timestamp}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
