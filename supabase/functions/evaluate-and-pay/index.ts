import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { agent_id, vendor_name, amount, justification } = await req.json();

    // 1. Fetch Agent and Owner details
    const { data: agent, error: agentErr } = await supabaseClient
      .from("agents")
      .select("*, spending_policies(*)")
      .eq("id", agent_id)
      .single();

    if (agentErr || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = agent.user_id;

    // 2. Fetch Vendor & User's Custom Policy for this vendor
    const { data: vendor } = await supabaseClient
      .from("vendors")
      .select("id, name")
      .ilike("name", `%${vendor_name}%`)
      .maybeSingle();

    let vendorPolicy = null;
    if (vendor) {
      const { data: policy } = await supabaseClient
        .from("user_vendor_policies")
        .select("*")
        .eq("user_id", userId)
        .eq("vendor_id", vendor.id)
        .maybeSingle();
      vendorPolicy = policy;
    }

    // ------------------------------------------------------------------
    // POLICY ENGINE CHECKS (The 4 Gates)
    // ------------------------------------------------------------------

    let requiresApproval = false;
    let reason = "";

    // GATE 1: Is this vendor connected to the user profile?
    if (vendorPolicy && !vendorPolicy.is_connected) {
      requiresApproval = true;
      reason = `Vendor "${vendor_name}" is disconnected in user settings`;
    }

    // GATE 2: Did the user disable auto-pay for this vendor?
    else if (vendorPolicy && !vendorPolicy.auto_pay_enabled) {
      requiresApproval = true;
      reason = `User requires manual approval for all payments to ${vendor_name}`;
    }

    // GATE 3: Check monthly / annual spend limit for this vendor
    else if (
      vendorPolicy &&
      Number(vendorPolicy.period_spent) + Number(amount) > Number(vendorPolicy.period_limit)
    ) {
      requiresApproval = true;
      reason = `Exceeds ${vendorPolicy.limit_period} limit of $${vendorPolicy.period_limit} for ${vendor_name}`;
    }

    // GATE 4: Check single transaction auto-cap (Vendor limit or Agent policy limit)
    else {
      const maxSingleAuto = vendorPolicy?.max_auto_amount ?? agent.spending_policies?.auto_approval_threshold ?? 10.0;
      if (amount > maxSingleAuto) {
        requiresApproval = true;
        reason = `Amount ($${amount}) exceeds auto-approval threshold ($${maxSingleAuto})`;
      }
    }

    // ------------------------------------------------------------------
    // ROUTE A: Escalation to Human Approval (Cockpit)
    // ------------------------------------------------------------------
    if (requiresApproval) {
      const { data: approvalReq } = await supabaseClient
        .from("approval_requests")
        .insert({
          agent_id: agent.id,
          user_id: userId,
          vendor: vendor_name,
          amount,
          justification,
          status: "pending",
          flag_reason: reason,
        })
        .select()
        .single();

      return new Response(
        JSON.stringify({
          status: "pending_approval",
          message: "Payment paused by policy firewall; awaiting your approval in Cockpit",
          reason,
          approval_id: approvalReq?.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ------------------------------------------------------------------
    // ROUTE B: Auto-Execute via PayPal Sandbox
    // ------------------------------------------------------------------
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Call our deployed paypal-service function
    const payRes = await fetch(`${supabaseUrl}/functions/v1/paypal-service`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        action: "create_order",
        amount: amount.toFixed(2),
        currency: "USD",
        description: `AgentPay [${agent.name}]: ${justification}`,
      }),
    });

    const paypalData = await payRes.json();

    if (!payRes.ok || !paypalData.success) {
      throw new Error(paypalData.error || "PayPal payment failed");
    }

    // 1. Log transaction in ledger
    await supabaseClient.from("transactions").insert({
      agent_id: agent.id,
      amount,
      vendor: vendor_name,
      status: "completed",
      authorization_type: "auto_agent",
      paypal_order_id: paypalData.orderId,
      notes: justification,
    });

    // 2. Increment vendor's period spend
    if (vendorPolicy) {
      await supabaseClient
        .from("user_vendor_policies")
        .update({
          period_spent: Number(vendorPolicy.period_spent) + Number(amount),
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendorPolicy.id);
    }

    return new Response(
      JSON.stringify({
        status: "settled",
        message: "Payment autonomously executed & settled via PayPal Sandbox",
        paypal_order_id: paypalData.orderId,
        amount,
        vendor: vendor_name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
