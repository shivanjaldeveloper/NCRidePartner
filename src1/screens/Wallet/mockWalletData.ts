export interface WalletTransaction {
  icon: 'cash' | 'taxi';
  title: string;
  meta: string;
  amount: string;
  positive: boolean;
}

export const PARTNER_WALLET_BALANCE = 1240;

export const PARTNER_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    icon: 'cash',
    title: 'Weekly payout credited',
    meta: '2 Jul · HDFC ••3421',
    amount: '+₹9,820',
    positive: true,
  },
  {
    icon: 'taxi',
    title: 'Trip earning · Sector 62 → DLF Mall',
    meta: 'Today · 10:24',
    amount: '+₹186',
    positive: false,
  },
  {
    icon: 'taxi',
    title: 'Trip earning · Botanical Garden → CP',
    meta: 'Today · 08:10',
    amount: '+₹312',
    positive: false,
  },
  {
    icon: 'cash',
    title: 'Weekly payout credited',
    meta: '26 Jun · HDFC ••3421',
    amount: '+₹8,140',
    positive: true,
  },
  {
    icon: 'taxi',
    title: 'Trip earning · Sector 18 → Cyber Hub',
    meta: 'Yesterday · 17:45',
    amount: '+₹684',
    positive: false,
  },
];
