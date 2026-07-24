// ────────────────────────────────────────────────────────────────────────
// ⚠️ DEV-ONLY — calls api.razorpay.com directly from the app using the key
// SECRET (see constants/razorpay.ts for why that's unsafe to ship).
//
// This exists purely so the app can be tested against the real
// order → Checkout → verify flow before the backend team's own
// "create order" endpoint exists. The ONLY function that should need to
// change once that endpoint is ready is createRazorpayOrder_DEV_ONLY below
// — swap its body for a call to your backend (e.g.
// postAuthForm('CreateRazorpayOrder', {...}) against partnerauth.asmx),
// and rename/re-export it as createRazorpayOrder so PaymentScreen doesn't
// need to change at all.
// ────────────────────────────────────────────────────────────────────────
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '../../constants/razorpay';

export interface RazorpayOrder {
  id: string;
  amount: number; // paise
  currency: string;
  receipt?: string;
  status?: string;
}

export interface CreateOrderParams {
  /** Rupees, e.g. "499" or 499 — converted to paise before the request. */
  amountRupees: string | number;
  receipt: string;
  notes: Record<string, string>;
}

// Minimal ASCII-only base64 encoder — RN/Hermes doesn't reliably expose a
// global btoa/Buffer, and this only ever needs to encode "key:secret".
const base64Encode = (input: string): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let i = 0;
  while (i < input.length) {
    const c1 = input.charCodeAt(i++);
    const c2 = i < input.length ? input.charCodeAt(i++) : NaN;
    const c3 = i < input.length ? input.charCodeAt(i++) : NaN;

    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
    const e3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6);
    const e4 = isNaN(c3) ? 64 : c3 & 63;

    output += chars[e1] + chars[e2] + chars[e3] + chars[e4];
  }
  return output;
};

/**
 * DEV-ONLY order creation — hits Razorpay directly from the app. See the
 * file banner above before reusing this pattern anywhere else.
 */
export async function createRazorpayOrder_DEV_ONLY(
  params: CreateOrderParams,
): Promise<RazorpayOrder> {
  const amountPaise = Math.round(Number(params.amountRupees) * 100);
  const authToken = base64Encode(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${authToken}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      // Defensive clamp — Razorpay rejects receipt > 40 chars. The call
      // site should already keep it short, but this guarantees it.
      receipt: params.receipt.slice(0, 40),
      notes: params.notes,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data?.id) {
    const message =
      data?.error?.description ||
      data?.error?.reason ||
      'Order creation failed';
    throw new Error(message);
  }

  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt,
    status: data.status,
  };
}
