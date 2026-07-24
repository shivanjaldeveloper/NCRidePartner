declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    key: string;
    amount: number; // paise
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    order_id?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
      method?: 'card' | 'netbanking' | 'wallet' | 'upi' | 'emi';
    };
    theme?: { color?: string };
    notes?: Record<string, string>;
  }

  export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  export interface RazorpayErrorResponse {
    code?: number | string;
    description?: string;
    reason?: string;
    error?: unknown;
  }

  const RazorpayCheckout: {
    open: (
      options: RazorpayCheckoutOptions,
    ) => Promise<RazorpaySuccessResponse>;
  };

  export default RazorpayCheckout;
}
