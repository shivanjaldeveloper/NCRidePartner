// Razorpay TEST key id — this is the public "key_id", safe to ship inside
// the app bundle (it's how Razorpay identifies your account when opening
// Checkout). It is NOT a secret.
//
// The key SECRET must never be added to this file or anywhere else in the
// mobile codebase — it can be pulled straight out of a built APK/IPA and
// used to call Razorpay's authenticated APIs as if it were your backend
// (create refunds, read payment/customer data, etc.). The secret only
// belongs on a server.
//
// Right now Checkout is opened without a server-created `order_id`, which
// is fine for trying things out in Test Mode but skips Razorpay's
// amount-tamper protection and payment-signature verification. Once the
// backend team exposes an "create order" endpoint (which uses the secret
// server-side to call POST /v1/orders), swap PaymentScreen to:
//   1. fetch an order_id from that endpoint before opening Checkout,
//   2. pass it as `options.order_id` below,
//   3. send the returned razorpay_payment_id/order_id/signature back to
//      the backend for verification instead of trusting the client.
export const RAZORPAY_KEY_ID = 'rzp_test_TGuVycUJXGAtAe';

// ────────────────────────────────────────────────────────────────────────
// ⚠️ DEV-ONLY. DO NOT SHIP THIS TO A RELEASE BUILD. ⚠️
// This lets the app call POST /v1/orders directly against Razorpay so you
// can test the real order-create → Checkout → verify flow before the
// backend team's own "create order" endpoint exists. The moment that
// endpoint is ready, delete RAZORPAY_KEY_SECRET and everything in
// razorpayOrderService.ts that reads it — the app should call YOUR
// backend, which holds this secret server-side, never the app.
//
// Anyone can pull this string back out of a built APK/IPA. With it they
// can create orders, issue refunds, and read payment data on your
// account — treat it as if it were your Razorpay account password.
// Don't commit a release build with this in it.
export const RAZORPAY_KEY_SECRET = 'pO1jBjg1Am4PTdDgGjG7520h';
// ────────────────────────────────────────────────────────────────────────
