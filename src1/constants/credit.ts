// Demo-only plan catalog for the Buy Credit / Choose Plan screen.
// No billing API exists yet — see utils/credit.ts for how these get
// "activated" locally. Swap this list for a real catalog call once one
// exists; the shape (id/price/hours/label) is what BuyCreditScreen expects.
export interface CreditPlan {
  id: string;
  price: number; // ₹
  hours: number; // validity window once activated, in hours
  label: string;
}

export const CREDIT_PLANS: CreditPlan[] = [
  { id: 'plan_6h', price: 50, hours: 6, label: '6 Hours' },
  { id: 'plan_12h', price: 100, hours: 12, label: '12 Hours' },
];

/**
 * Demo-only effective rate shown on each plan card ("₹8.3/hr"). Both plans
 * happen to work out to the same rate today — real pricing/rate will come
 * from the backend once it exists, this is just so the screen isn't blank.
 */
export const ratePerHour = (plan: CreditPlan) =>
  Math.round((plan.price / plan.hours) * 100) / 100;
