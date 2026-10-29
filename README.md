# 🛡️ AgentPay — Autonomous Agent Budgeting & PayPal Settlement Engine

> **Built for the PayPal AI Hackathon 2026**  
> An autonomous financial firewall enabling AI agents to budget, evaluate policies, and execute real-time PayPal settlements with human-in-the-loop (HITL) safeguards.

[![PayPal Sandbox](https://img.shields.io/badge/PayPal-Sandbox_v2-blue?logo=paypal)](https://developer.paypal.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_Edge_Functions-emerald?logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React_+_Vite_+_Tailwind-indigo?logo=react)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Problem Statement

Autonomous AI agents (e.g., market research bots, DevOps auto-scalers, code refactorers) frequently need to procure paid APIs, cloud burst compute, or proxy credits to finish their tasks. 

Today, giving an autonomous agent a static credit card or PayPal credentials is a recipe for disaster:
1. **Loop Risk:** A single recursive prompt or infinite retry loop can drain thousands of dollars in minutes.
2. **Binary Choice:** Current platforms offer an all-or-nothing approach — either total unrestricted spending or requiring a human to approve every tiny $0.10 API call.
3. **Lack of Auditability:** No clear record exists to show whether a transaction was initiated autonomously by the agent or manually authorized by a team lead.

---

## 💡 The Solution: AgentPay

**AgentPay** acts as an **autonomous financial proxy and policy firewall** between autonomous AI agents and the PayPal settlement network:

- **Autonomous Micro-Spends:** AI agents can instantly auto-settle necessary vendor expenses up to strict policy caps (e.g., `$5.00` per call, max `$30/day`) without human delay.
- **Human-in-the-Loop Escalation:** Any request that exceeds transaction caps, hits monthly vendor limits, or targets an unverified vendor is immediately frozen and routed to the **AgentPay Cockpit** for human approval.
- **Granular Vendor & Period Limits:** Admins configure monthly/annual caps per vendor (e.g., OpenAI, SerpAPI, AWS Cloud) and choose whether auto-pay is permitted.
- **Cryptographic Audit Stream:** Every settlement logs the exact authorization path (`auto_agent` vs. `human_approved`), the agent’s task justification, and the PayPal Order ID.

---

## 🏗️ Architecture & Policy Engine Flow


---

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| **Financial Cockpit** | Live dashboard displaying total settled spend, auto-executed count, human interventions, and active agent health. |
| **Autonomous Policy Firewall** | Multi-gate policy evaluator protecting against prompt injections, budget overruns, and unexpected vendor charges. |
| **Vendors & Policies Directory** | Configure per-vendor controls: toggle auto-pay on/off, set monthly/annual caps, and monitor live budget progress bars. |
| **Payment Vault & Card Limits** | Link corporate cards or PayPal accounts with custom autonomous debit caps. |
| **Cryptographic Audit Ledger** | Filterable transaction table with visual badges for `Autonomous (Agent)`, `Human Approved (Us)`, and `Declined`. |
| **Supabase Authentication** | Multi-tenant auth ensuring only verified workspace owners can adjust financial thresholds and approve pending funds. |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend & Database:** Supabase (PostgreSQL with Row Level Security)
- **Serverless Compute:** Supabase Edge Functions (Deno / TypeScript)
- **Payment Processing:** PayPal REST API (Sandbox Orders v2 & OAuth 2.0)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+) & `npm`
- A free [Supabase Account](https://supabase.com)
- A [PayPal Developer Account](https://developer.paypal.com) (Sandbox)

### 2. Clone & Install Frontend
```bash
git clone https://github.com/your-username/agentpay.git
cd agentpay
npm install
