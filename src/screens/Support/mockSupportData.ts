export interface SupportItem {
  icon: 'car' | 'cash' | 'user' | 'settings';
  id: string;
  // Point at support.issues.<id>.title/.sub in the locale files.
  titleKey: string;
  subKey: string;
}

export const PARTNER_SUPPORT_ITEMS: SupportItem[] = [
  {
    icon: 'car',
    id: 'tripFare',
    titleKey: 'support.issues.tripFare.title',
    subKey: 'support.issues.tripFare.sub',
  },
  {
    icon: 'cash',
    id: 'payment',
    titleKey: 'support.issues.payment.title',
    subKey: 'support.issues.payment.sub',
  },
  {
    icon: 'user',
    id: 'passengerBehavior',
    titleKey: 'support.issues.passengerBehavior.title',
    subKey: 'support.issues.passengerBehavior.sub',
  },
  {
    icon: 'settings',
    id: 'appTechnical',
    titleKey: 'support.issues.appTechnical.title',
    subKey: 'support.issues.appTechnical.sub',
  },
];
