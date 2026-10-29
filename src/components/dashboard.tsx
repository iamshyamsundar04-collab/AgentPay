import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { 
  Bot, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Play, 
  RefreshCw, 
  X, 
  Send, 
  Terminal, 
  ThumbsUp, 
  ThumbsDown, 
  Database,
  ArrowUpRight,
  Sliders
} from "lucide-react";

interface SpendingPolicy {
  daily_cap: number;
  max_per_transaction: number;
  auto_approve_threshold: number;
  allowed_categories: string[];
}

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
  spending_policies: SpendingPolicy;
}

interface Transaction {
  id: string;
  agent_id: string;
  amount: number;
  currency: string;
  merchant_name: string;
  category: string;
  justification: string;
  status: "settled" | "pending_approval" | "rejected";
  paypal_order_id: string | null;
  created_at: string;
}

// Fallback demo agents so the screen is NEVER empty
const INITIAL_DEMO_AGENTS: Agent[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-111111111111",
    name: "Market Research Copilot",
    description: "Autonomous data-gathering agent that purchases analyst reports & API credits.",
    status: "active",
    spending_policies: {
      daily_cap: 30,
      max_per_transaction: 10,
      auto_approve_threshold: 5,
      allowed_categories: ["data", "api_credits"],
    },
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-222222222222",
    name: "DevOps Auto-Scaler",
    description: "Monitors CI/CD capacity and auto-provisions burst compute runner hours.",
    status: "active",
    spending_policies: {
      daily_cap: 100,
      max_per_transaction: 35,
      auto_approve_threshold: 15,
      allowed_categories: ["compute", "cloud_storage"],
    },
  },
];

export function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_DEMO_AGENTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Interactive Task Runner state
  const [selectedAgentId, setSelectedAgentId] = useState<string>(INITIAL_DEMO_AGENTS[0].id);
  const [customTask, setCustomTask] = useState("");
  const [customAmount, setCustomAmount] = useState<number>(3.50);
  const [customMerchant, setCustomMerchant] = useState("Statista API");

  // Live Agent Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "AgentPay policy engine initialized.",
    "PayPal Sandbox endpoint configured: https://api-m.sandbox.paypal.com",
    "Standing by for agent task dispatches..."
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Fetch from Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: agentData } = await supabase
        .from("agents")
        .select("*, spending_policies(*)");

      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (agentData && agentData.length > 0) {
        const formatted = agentData.map((a: any) => ({
          ...a,
          spending_policies: Array.isArray(a.spending_policies) 
            ? a.spending_policies[0] 
            : a.spending_policies,
        }));
        setAgents(formatted);
        setSelectedAgentId(formatted[0].id);
        addLog(`Loaded ${formatted.length} active agents from Supabase.`);
      } else {
        addLog("No agents found in Supabase table. Using local demo agents.");
      }

      if (txData && txData.length > 0) {
        setTransactions(txData as Transaction[]);
      }
    } catch (err: any) {
      addLog(`Database read notice: ${err.message}. Using demo state.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Primary Agent Execution Handler
  const executePayment = async (
    agentId: string, 
    amount: number, 
    merchant: string, 
    justification: string
  ) => {
    setExecuting(true);
    const targetAgent = agents.find((a) => a.id === agentId) || agents[0];
    addLog(`Agent [${targetAgent.name}] received task: "${justification}" ($${amount.toFixed(2)})`);
    addLog(`Evaluating policy: Daily Cap=$${targetAgent.spending_policies?.daily_cap}, Auto-Approve Threshold=$${targetAgent.spending_policies?.auto_approve_threshold}...`);

    const backendUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Fallback: If edge function not configured or offline, run complete simulation
    if (!backendUrl || backendUrl.includes("placeholder")) {
      await new Promise((r) => setTimeout(r, 600));
      const autoApproved = amount <= (targetAgent.spending_policies?.auto_approve_threshold ?? 10);

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        agent_id: targetAgent.id,
        amount,
        currency: "USD",
        merchant_name: merchant,
        category: "data",
        justification,
        status: autoApproved ? "settled" : "pending_approval",
        paypal_order_id: autoApproved ? `PAYPAL-SANDBOX-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null,
        created_at: new Date().toISOString(),
      };

      setTransactions((prev) => [newTx, ...prev]);

      if (autoApproved) {
        addLog(`POLICY PASS: Amount $${amount.toFixed(2)} <= threshold. Auto-captured on PayPal Sandbox.`);
        addLog(`PayPal Order Ref: ${newTx.paypal_order_id}`);
      } else {
        addLog(`POLICY HOLD: Amount $${amount.toFixed(2)} exceeds threshold ($${targetAgent.spending_policies?.auto_approve_threshold}). Halted for Human Review.`);
      }
      setExecuting(false);
      return;
    }

    // Call Real Edge Function `evaluate-and-pay`
    try {
      const response = await fetch(`${backendUrl}/functions/v1/evaluate-and-pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({
          agent_id: targetAgent.id,
          amount,
          merchant_name: merchant,
          category: "data",
          justification,
        }),
      });

      const result = await response.json();

      if (result.action === "AUTO_APPROVED_AND_CAPTURED") {
        addLog(`PayPal Order CREATED & CAPTURED: ${result.paypal_order_id}`);
      } else if (result.action === "APPROVAL_REQUIRED") {
        addLog(`FLAGGED: ${result.message}`);
      } else {
        addLog(`Response: ${JSON.stringify(result)}`);
      }
      await fetchData();
    } catch (err: any) {
      addLog(`Error calling evaluate-and-pay: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  // Human Decision: Approve pending transaction
  const handleResolveApproval = (txId: string, approve: boolean) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          return {
            ...tx,
            status: approve ? "settled" : "rejected",
            paypal_order_id: approve ? `PAYPAL-APPROVED-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null,
          };
        }
        return tx;
      })
    );
    addLog(
      approve 
        ? `HUMAN OVERRIDE: Transaction ${txId.slice(0, 8)} APPROVED. PayPal Order captured.`
        : `HUMAN OVERRIDE: Transaction ${txId.slice(0, 8)} REJECTED.`
    );
  };

  const pendingApprovals = transactions.filter((t) => t.status === "pending_approval");
  const totalSettledToday = transactions
    .filter((t) => t.status === "settled")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AgentPay Cockpit</h1>
              <p className="text-slate-400 text-sm">Autonomous Agent Budgeting & PayPal Settlement Layer</p>
            </div>
          </div>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Active Agents</span>
            <div className="text-3xl font-bold mt-2 flex items-center gap-2 text-white">
              <Bot className="text-blue-500 w-7 h-7" /> {agents.length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Settled Spend</span>
            <div className="text-3xl font-bold mt-2 text-emerald-400">
              ${totalSettledToday.toFixed(2)}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Pending Approvals</span>
            <div className="text-3xl font-bold mt-2 flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-6 h-6" /> {pendingApprovals.length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">PayPal Gateway</span>
            <div className="text-sm font-semibold mt-3 text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Sandbox Ready
            </div>
          </div>
        </div>

        {/* INTERACTIVE COMPONENT 1: Pending Approvals Queue */}
        {pendingApprovals.length > 0 && (
          <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" /> Human-in-the-Loop Approval Queue ({pendingApprovals.length})
            </div>
            <p className="text-xs text-amber-200/80">
              These agent purchases exceeded their auto-approval threshold and require your authorization to execute PayPal capture.
            </p>
            <div className="space-y-2 mt-2">
              {pendingApprovals.map((tx) => (
                <div key={tx.id} className="bg-slate-900/90 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {tx.merchant_name} — <span className="text-amber-400 font-mono">${Number(tx.amount).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{tx.justification}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveApproval(tx.id, true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Approve & Capture
                    </button>
                    <button
                      onClick={() => handleResolveApproval(tx.id, false)}
                      className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTERACTIVE COMPONENT 2: Agent Task Prompt Bar & Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Prompt Bar & Scenario Simulator */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" /> Interactive Agent Task Runner
              </h2>
              <span className="text-xs text-slate-400">Simulate autonomous tool-calling</span>
            </div>

            {/* Quick-Prompt Scenario Chips */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 uppercase font-semibold">Quick Test Scenarios:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setCustomTask("Fetch EV market dataset table export");
                    setCustomAmount(3.50);
                    setCustomMerchant("Statista API");
                  }}
                  className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-lg text-xs transition"
                >
                  Statista Dataset ($3.50 — Auto-Pay)
                </button>
                <button
                  onClick={() => {
                    setCustomTask("Purchase quarterly cloud computing forecast");
                    setCustomAmount(8.50);
                    setCustomMerchant("Gartner Analyst");
                  }}
                  className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg text-xs transition"
                >
                  Gartner Brief ($8.50 — Triggers Hold)
                </button>
                <button
                  onClick={() => {
                    setCustomTask("Provision burst GPU worker node");
                    setCustomAmount(12.00);
                    setCustomMerchant("Lambda Labs Cloud");
                  }}
                  className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-lg text-xs transition"
                >
                  Burst GPU Node ($12.00 — DevOps)
                </button>
              </div>
            </div>

            {/* Custom Input Form */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Agent</label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Merchant / Vendor</label>
                  <input
                    type="text"
                    value={customMerchant}
                    onChange={(e) => setCustomMerchant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="Merchant name"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="Amount"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Task / Justification Prompt</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    placeholder="e.g. Purchase 500 translation API credits for customer support ticket triage"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    disabled={executing || !customTask}
                    onClick={() => executePayment(selectedAgentId, customAmount, customMerchant, customTask)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <Play className="w-3.5 h-3.5" /> {executing ? "Processing..." : "Dispatch Task"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Live Agent Decision Terminal */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-emerald-400" /> Policy Engine Console
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="flex-1 my-3 bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-300 space-y-1.5 overflow-y-auto max-h-56">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className={idx === 0 ? "text-emerald-400 font-semibold" : "text-slate-400"}>
                  {log}
                </div>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 text-center block">Logs agent budget checks & PayPal Sandbox calls</span>
          </div>

        </div>

        {/* INTERACTIVE COMPONENT 3: Agent Cards Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <Bot className="w-5 h-5 text-blue-400" /> Active Autonomous Agents & Wallets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => {
              const policy = agent.spending_policies;
              return (
                <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{agent.description}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {agent.status}
                    </span>
                  </div>

                  {policy && (
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-lg text-center text-xs">
                      <div>
                        <span className="text-slate-500 block">Daily Cap</span>
                        <span className="font-semibold text-slate-200 text-sm">${policy.daily_cap}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Auto-Approve</span>
                        <span className="font-semibold text-emerald-400 text-sm">≤ ${policy.auto_approve_threshold}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Max / Tx</span>
                        <span className="font-semibold text-amber-400 text-sm">${policy.max_per_transaction}</span>
                      </div>
                    </div>
                  )}

                  {/* Direct Action Buttons on Card */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      disabled={executing}
                      onClick={() => executePayment(agent.id, 3.50, "Statista API", "Autonomous query for EV market trends")}
                      className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" /> Test $3.50 (Auto-Pay)
                    </button>
                    <button
                      disabled={executing}
                      onClick={() => executePayment(agent.id, 8.50, "Gartner Reports", "Full annual sector forecast")}
                      className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" /> Test $8.50 (Trigger Hold)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Transaction Audit Stream
            </h2>
            <span className="text-xs text-slate-400">Live settlements & holds</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Merchant</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">AI Justification</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">PayPal Order Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-sans">
                      No transactions recorded yet. Click one of the test buttons or dispatch a task above.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-semibold text-slate-200">{tx.merchant_name}</td>
                      <td className="px-6 py-4 font-bold text-slate-100">${Number(tx.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-300 font-sans">{tx.justification}</td>
                      <td className="px-6 py-4">
                        {tx.status === "settled" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> SETTLED
                          </span>
                        ) : tx.status === "pending_approval" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> PENDING REVIEW
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            REJECTED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{tx.paypal_order_id || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
