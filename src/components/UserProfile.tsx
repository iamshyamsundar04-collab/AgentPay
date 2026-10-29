import React, { useState } from 'react';
import { 
  User, 
  CreditCard, 
  LogOut, 
  CheckCircle2, 
  Key, 
  Mail, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Settings2, 
  RefreshCw, 
  X,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  Bot
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  name: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
  autoDebitLimit: number;
}

interface Props {
  user: any | null;
  onLogout?: () => void;
}

export const UserProfile: React.FC<Props> = ({ user, onLogout }) => {
  // If no user is logged in, show empty information
  const userEmail = user?.email || 'No user logged in';
  const userId = user?.id || '';

  // API Key & credentials
  const [apiKey, setApiKey] = useState(user ? `ap_live_${userId.slice(0, 16)}` : '');
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // PayPal Sandbox Credentials Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecret, setPaypalSecret] = useState('');
  const [environment, setEnvironment] = useState<'sandbox' | 'live'>('sandbox');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvv, setNewCardCvv] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('50.00');

  // Sign out states
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleCopyKey = async () => {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleRegenerateKey = () => {
    const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setApiKey(`ap_live_${randomHex}`);
    setCopied(false);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsModalOpen(false);
    }, 1200);
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    const last4 = newCardNumber.replace(/\s+/g, '').slice(-4) || '0000';
    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      type: 'card',
      name: newCardName || 'Corporate Expense Card',
      last4,
      expiry: newCardExpiry || '12/28',
      isDefault: paymentMethods.length === 0,
      autoDebitLimit: parseFloat(newCardLimit) || 25.00
    };

    setPaymentMethods(prev => [...prev, newMethod]);
    setIsCardModalOpen(false);
    setNewCardNumber('');
    setNewCardName('');
    setNewCardExpiry('');
    setNewCardCvv('');
  };

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      if (onLogout) onLogout();
    } catch (err) {
      console.error('Sign out error:', err);
      if (onLogout) onLogout();
    } finally {
      setIsSigningOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* User Profile Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {user?.user_metadata?.full_name || userEmail.split('@')[0] || 'User Profile'}
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
              <Mail className="w-3.5 h-3.5 text-slate-500" /> {userEmail}
            </p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Authenticated Owner
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                Linked Payment Methods & Credit Cards
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Agents draw funds up to your set auto-spend limits
              </p>
            </div>
            
            <button
              onClick={() => setIsCardModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Card
            </button>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-500 text-xs">
              No cards or accounts linked yet. Click "Add Card" to configure a payment method.
            </div>
          ) : (
            <div className="space-y-2.5">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id} 
                  className={`border rounded-xl p-4 flex items-center justify-between transition-all ${
                    method.isDefault ? 'bg-slate-950 border-indigo-500/50' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{method.name}</span>
                        <span className="text-xs font-mono text-slate-400">•••• {method.last4}</span>
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-0.5">
                        Auto-spend limit: ${method.autoDebitLimit.toFixed(2)} (Amounts above require manual approval)
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPaymentMethods(prev => prev.filter(m => m.id !== method.id))}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PayPal Sandbox Gateway */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              PayPal API Gateway Credentials
            </h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              paypalClientId ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/80' : 'text-slate-500 bg-slate-800'
            }`}>
              {paypalClientId ? 'Configured' : 'Not Set'}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-sm text-white">PayPal Sandbox Business Account</span>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {paypalClientId ? `Client ID: ${paypalClientId.slice(0, 16)}••••` : 'No Client ID saved'}
              </p>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white flex items-center gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              Configure Credentials
            </button>
          </div>
        </div>

        {/* Agent Bearer Token */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              Agent Bearer Token
            </h3>
            <button
              onClick={handleRegenerateKey}
              className="text-[11px] text-slate-400 hover:text-purple-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Roll Key
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs">
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-lg font-mono text-slate-300 text-xs">
              <span className="truncate mr-2">
                {apiKey ? (showKey ? apiKey : `${apiKey.slice(0, 12)}••••••••••••••••`) : 'No key generated'}
              </span>

              {apiKey && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-slate-400 hover:text-slate-200"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                      copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
          <p className="text-xs text-slate-500">Connected to Supabase Project</p>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-800/80 hover:bg-rose-900/60 flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Add Card Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" /> Add Payment Method
              </h3>
              <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cardholder Name / Account Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Primary Business Visa"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  placeholder="4000 1234 5678 9010"
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="MM/YY"
                    value={newCardExpiry}
                    onChange={(e) => setNewCardExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CVV</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="•••"
                    value={newCardCvv}
                    onChange={(e) => setNewCardCvv(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Autonomous Auto-Spend Cap ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newCardLimit}
                  onChange={(e) => setNewCardLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure PayPal Credentials Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                Configure PayPal Credentials
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Environment</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEnvironment('sandbox')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      environment === 'sandbox' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvironment('live')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      environment === 'live' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Live
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PayPal Client ID</label>
                <input
                  type="text"
                  required
                  value={paypalClientId}
                  onChange={(e) => setPaypalClientId(e.target.value)}
                  placeholder="sb-client-id..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PayPal Secret Key</label>
                <input
                  type="password"
                  required
                  value={paypalSecret}
                  onChange={(e) => setPaypalSecret(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {saveSuccess ? 'Saved!' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Confirm Sign Out</h3>
            </div>
            
            <p className="text-xs text-slate-400">
              This will clear your Supabase session. Autonomous agent tasks requiring approval will pause until you sign back in.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={handleConfirmSignOut}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
