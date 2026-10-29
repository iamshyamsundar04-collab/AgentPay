import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  Bot, 
  Sliders, 
  DollarSign, 
  Calendar,
  Lock
} from 'lucide-react';

export interface VendorPolicy {
  id: string;
  name: string;
  category: string;
  isConnected: boolean;
  autoPayEnabled: boolean; // if false, ALWAYS routes to human approval
  maxAutoAmount: number;   // max transaction approved without asking human
  limitPeriod: 'monthly' | 'annual';
  periodLimit: number;
  periodSpent: number;
}

const defaultVendors: VendorPolicy[] = [
  {
    id: 'v-1',
    name: 'OpenAI API',
    category: 'AI Models',
    isConnected: true,
    autoPayEnabled: true,
    maxAutoAmount: 10.00,
    limitPeriod: 'monthly',
    periodLimit: 150.00,
    periodSpent: 42.80
  },
  {
    id: 'v-2',
    name: 'SerpAPI Search Credits',
    category: 'Search & Scrape',
    isConnected: true,
    autoPayEnabled: true,
    maxAutoAmount: 5.00,
    limitPeriod: 'monthly',
    periodLimit: 50.00,
    periodSpent: 18.50
  },
  {
    id: 'v-3',
    name: 'AWS Cloud Infrastructure',
    category: 'Cloud Compute',
    isConnected: true,
    autoPayEnabled: false, // High-risk: always asks human
    maxAutoAmount: 0.00,
    limitPeriod: 'monthly',
    periodLimit: 500.00,
    periodSpent: 128.00
  },
  {
    id: 'v-4',
    name: 'Anthropic Claude',
    category: 'AI Models',
    isConnected: true,
    autoPayEnabled: true,
    maxAutoAmount: 15.00,
    limitPeriod: 'annual',
    periodLimit: 1200.00,
    periodSpent: 310.00
  },
  {
    id: 'v-5',
    name: 'Cloudflare Workers',
    category: 'Cloud Compute',
    isConnected: false,
    autoPayEnabled: false,
    maxAutoAmount: 5.00,
    limitPeriod: 'monthly',
    periodLimit: 50.00,
    periodSpent: 0.00
  },
  {
    id: 'v-6',
    name: 'Twilio SMS & Voice',
    category: 'Communications',
    isConnected: false,
    autoPayEnabled: false,
    maxAutoAmount: 10.00,
    limitPeriod: 'monthly',
    periodLimit: 75.00,
    periodSpent: 0.00
  }
];

export const VendorDirectory: React.FC = () => {
  const [vendors, setVendors] = useState<VendorPolicy[]>(defaultVendors);

  const totalPlatformVendors = vendors.length;
  const connectedCount = vendors.filter(v => v.isConnected).length;
  const autoPayActiveCount = vendors.filter(v => v.isConnected && v.autoPayEnabled).length;

  // Toggle connection status
  const handleToggleConnection = (id: string) => {
    setVendors(prev => prev.map(v => 
      v.id === id ? { ...v, isConnected: !v.isConnected, autoPayEnabled: !v.isConnected ? false : v.autoPayEnabled } : v
    ));
  };

  // Toggle Auto-Pay vs Require Permission
  const handleToggleAutoPay = (id: string) => {
    setVendors(prev => prev.map(v => 
      v.id === id ? { ...v, autoPayEnabled: !v.autoPayEnabled } : v
    ));
  };

  // Change Period (monthly vs annual)
  const handleChangePeriod = (id: string, period: 'monthly' | 'annual') => {
    setVendors(prev => prev.map(v => 
      v.id === id ? { ...v, limitPeriod: period } : v
    ));
  };

  // Update Limit Amount
  const handleUpdateLimit = (id: string, limit: number) => {
    setVendors(prev => prev.map(v => 
      v.id === id ? { ...v, periodLimit: Math.max(0, limit) } : v
    ));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-400" /> Platform Directory
          </span>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {totalPlatformVendors} Supported
          </p>
          <p className="text-xs text-slate-500 mt-1">Available across AgentPay ecosystem</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Connected to Your Profile
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">
            {connectedCount} of {totalPlatformVendors} Active
          </p>
          <p className="text-xs text-slate-500 mt-1">Linked for your autonomous agents</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-purple-400" /> Auto-Pay Allowed
          </span>
          <p className="text-2xl font-bold font-mono text-purple-300 mt-2">
            {autoPayActiveCount} Vendors
          </p>
          <p className="text-xs text-slate-500 mt-1">{connectedCount - autoPayActiveCount} require manual approval</p>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {vendors.map((vendor) => {
          const percentUsed = vendor.periodLimit > 0 
            ? Math.min(100, Math.round((vendor.periodSpent / vendor.periodLimit) * 100))
            : 0;

          return (
            <div 
              key={vendor.id} 
              className={`bg-slate-900 border rounded-2xl p-6 transition-all ${
                vendor.isConnected 
                  ? 'border-slate-800 shadow-lg' 
                  : 'border-slate-800/50 opacity-60 bg-slate-950/40'
              }`}
            >
              {/* Header: Name, Category, Connect Toggle */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{vendor.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {vendor.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {vendor.isConnected ? 'Connected & ready for agents' : 'Not linked to your account'}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleConnection(vendor.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    vendor.isConnected 
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800/80 hover:bg-rose-900/60' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
                  }`}
                >
                  {vendor.isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>

              {/* Policy Controls (Only active if connected) */}
              {vendor.isConnected ? (
                <div className="mt-4 space-y-4">
                  {/* Mode Selector: Auto-Pay vs Require Approval */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {vendor.autoPayEnabled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <Bot className="w-3.5 h-3.5" /> Autonomous Auto-Pay
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                            <Lock className="w-3.5 h-3.5" /> Human Approval Required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {vendor.autoPayEnabled 
                          ? `Agents can auto-settle spends up to $${vendor.maxAutoAmount.toFixed(2)}`
                          : 'Every payment requires your explicit authorization'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleAutoPay(vendor.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        vendor.autoPayEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {vendor.autoPayEnabled ? 'Change to Require Approval' : 'Enable Auto-Pay'}
                    </button>
                  </div>

                  {/* Monthly / Annual Limit Setting */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Spend Limit Period:
                      </span>
                      <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                        <button
                          onClick={() => handleChangePeriod(vendor.id, 'monthly')}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            vendor.limitPeriod === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => handleChangePeriod(vendor.id, 'annual')}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            vendor.limitPeriod === 'annual' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Annual
                        </button>
                      </div>
                    </div>

                    {/* Limit Input & Visual Budget Progress */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Limit Cap ($):</span>
                      <input
                        type="number"
                        value={vendor.periodLimit}
                        onChange={(e) => handleUpdateLimit(vendor.id, parseFloat(e.target.value) || 0)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white w-28 font-mono focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-500">per {vendor.limitPeriod}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span>Used: ${vendor.periodSpent.toFixed(2)}</span>
                        <span>{percentUsed}% of ${vendor.periodLimit.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            percentUsed >= 90 ? 'bg-rose-500' : percentUsed >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 py-6 text-center text-slate-500 text-xs">
                  Connect this vendor to allow your agents to spend against it.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
