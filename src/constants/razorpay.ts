// Razorpay TEST key id — this is the public "key_id", safe to ship inside
// the app bundle (it's how Razorpay identifies your account when opening
// Checkout). It is NOT a secret.
//
// CreatePartnerPlanOrder's response (partnerpayments.asmx) does NOT
// include this value — confirmed via real curl, it only returns
// RazorpayOrderId/AmountPaise/Currency/etc. So Checkout needs this key
// from here, combined with the order details the server did return.
//
// The key SECRET must never be added to this file or anywhere else in the
// mobile codebase — it can be pulled straight out of a built APK/IPA and
// used to call Razorpay's authenticated APIs as if it were your backend
// (create refunds, read payment/customer data, etc.). The secret only
// belongs on your server, which is where VerifyPartnerPlanPayment already
// uses it to recompute the payment signature.
//
// If this ever needs to change (e.g. switching to the live key), update
// it here only — PaymentScreen.tsx just imports RAZORPAY_KEY_ID.
export const RAZORPAY_KEY_ID = 'rzp_test_TGuVycUJXGAtAe';

//export const RAZORPAY_KEY_ID = 'pO1jBjg1Am4PTdDgGjG7520h';
