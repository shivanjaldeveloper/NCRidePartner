export interface SupportItem {
  icon: 'car' | 'cash' | 'user' | 'settings';
  title: string;
  sub: string;
}

export const PARTNER_SUPPORT_ITEMS: SupportItem[] = [
  {
    icon: 'car',
    title: 'Trip or fare issue',
    sub: 'Wrong fare, route, or trip problem',
  },
  {
    icon: 'cash',
    title: 'Payment or payout issue',
    sub: 'Missing payout or payment mismatch',
  },
  {
    icon: 'user',
    title: 'Passenger behavior',
    sub: 'Report an issue with a passenger',
  },
  {
    icon: 'settings',
    title: 'App or technical issue',
    sub: 'Bugs, crashes, or app problems',
  },
];
