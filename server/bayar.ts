const BAYAR_GG_BASE = "https://bayar.gg/api";

function getApiKey(): string {
  return process.env.BAYAR_GG_API_KEY || "";
}

export interface CreatePaymentResponse {
  success: boolean;
  data?: {
    invoice_id: string;
    amount: number;
    unique_code: number;
    final_amount: number;
    payment_url: string;
    expires_at: string;
    status: string;
    payment_method: string;
  };
  error?: string;
}

export interface CheckPaymentResponse {
  success: boolean;
  invoice_id?: string;
  status?: string;
  amount?: string;
  final_amount?: string;
  paid_at?: string | null;
  paid_reff_num?: string | null;
  expires_at?: string;
  error?: string;
}

export async function createQrisPayment(amount: number, callbackUrl?: string): Promise<CreatePaymentResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("[bayar.gg] BAYAR_GG_API_KEY not set. Available env vars with BAYAR:", Object.keys(process.env).filter(k => k.includes("BAYAR")).join(", ") || "none");
    return { success: false, error: "API key not configured" };
  }
  console.log("[bayar.gg] API key found, length:", apiKey.length, "first 4 chars:", apiKey.substring(0, 4));
  try {
    const url = `${BAYAR_GG_BASE}/create-payment.php?apiKey=${apiKey}`;
    const body = {
      amount,
      payment_method: "gopay_qris",
      callback_url: callbackUrl || undefined,
    };
    console.log("[bayar.gg] Request:", JSON.stringify({ url: url.replace(apiKey, "***"), body }));
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log("[bayar.gg] Raw response status:", res.status, "body:", text);
    try {
      const json = JSON.parse(text);
      return json;
    } catch {
      return { success: false, error: `Invalid JSON response: ${text.substring(0, 200)}` };
    }
  } catch (e: any) {
    console.error("[bayar.gg] create-payment fetch error:", e.message, e.stack);
    return { success: false, error: e.message };
  }
}

export async function checkPaymentStatus(invoiceId: string): Promise<CheckPaymentResponse> {
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, error: "API key not configured" };
  try {
    const url = `${BAYAR_GG_BASE}/check-payment?apiKey=${apiKey}&invoice=${encodeURIComponent(invoiceId)}`;
    const res = await fetch(url);
    return res.json();
  } catch (e: any) {
    console.error("[bayar.gg] check-payment error:", e.message);
    return { success: false, error: e.message };
  }
}
