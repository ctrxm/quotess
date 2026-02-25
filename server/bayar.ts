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
    console.error("[bayar.gg] BAYAR_GG_API_KEY not set");
    return { success: false, error: "API key not configured" };
  }
  try {
    const url = `${BAYAR_GG_BASE}/create-payment.php?apiKey=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        payment_method: "gopay_qris",
        callback_url: callbackUrl || undefined,
      }),
    });
    const json = await res.json();
    console.log("[bayar.gg] create-payment response:", JSON.stringify(json));
    return json;
  } catch (e: any) {
    console.error("[bayar.gg] create-payment error:", e.message);
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
