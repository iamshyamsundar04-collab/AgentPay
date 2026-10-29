import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "";
const PAYPAL_API_BASE = Deno.env.get("PAYPAL_API_BASE") || "https://sandbox.paypal.com";

/**
 * 1. Generate an OAuth2 Access Token from PayPal
 */
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

async function getPayPalAccessToken(): Promise<string> {
  const credentials = `${PAYPAL_CLIENT_ID.trim()}:${PAYPAL_CLIENT_SECRET.trim()}`;
  const basicAuth = encodeBase64(new TextEncoder().encode(credentials));

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`PayPal OAuth Failed: ${res.status} - ${errorBody}`);
  }

  const data = await res.json();
  return data.access_token;
}


/**
 * 2. Create a PayPal Order with capture intent
 */
async function createOrder(accessToken: string, amount: number, currency: string, description: string) {
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        description: description || "Autonomous Agent Purchase",
        amount: {
          currency_code: currency || "USD",
          value: amount.toFixed(2),
        },
      },
    ],
  };

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal Create Order Failed: ${JSON.stringify(data)}`);
  }

  return data;
}

/**
 * 3. Capture an Authorized Order
 */
async function captureOrder(accessToken: string, orderId: string) {
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal Capture Failed: ${JSON.stringify(data)}`);
  }

  return data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, amount, currency = "USD", description, orderId } = body;

    const accessToken = await getPayPalAccessToken();

    if (action === "create_order") {
      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "Amount must be greater than 0" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const order = await createOrder(accessToken, Number(amount), currency, description);
      return new Response(JSON.stringify({ success: true, order }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "capture_order") {
      if (!orderId) {
        return new Response(JSON.stringify({ error: "orderId is required for capture" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const capture = await captureOrder(accessToken, orderId);
      return new Response(JSON.stringify({ success: true, capture }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unsupported action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
