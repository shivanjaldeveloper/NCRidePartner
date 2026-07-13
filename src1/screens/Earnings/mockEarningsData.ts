export interface TodayEarnings {
  amount: number;
  trips: number;
  hours: string;
  base: number;
  distance: number;
  time: number;
  platform: number;
}

export interface WeekDay {
  day: string;
  amount: number;
  trips: number;
}

export interface WeekEarnings {
  amount: number;
  trips: number;
  days: WeekDay[];
}

export const PARTNER_EARNINGS_TODAY: TodayEarnings = {
  amount: 2840,
  trips: 14,
  hours: '4h 35m',
  base: 1840,
  distance: 720,
  time: 280,
  platform: 184,
};

export const PARTNER_EARNINGS_WEEK: WeekEarnings = {
  amount: 18420,
  trips: 87,
  days: [
    { day: 'Mon', amount: 2400, trips: 11 },
    { day: 'Tue', amount: 2680, trips: 13 },
    { day: 'Wed', amount: 2210, trips: 10 },
    { day: 'Thu', amount: 3120, trips: 15 },
    { day: 'Fri', amount: 2840, trips: 14 },
    { day: 'Sat', amount: 2980, trips: 14 },
    { day: 'Sun', amount: 2190, trips: 10 },
  ],
};

export const PARTNER_EARNINGS_MONTH = {
  label: 'June 2026',
  net: 72800,
  gross: 79800,
  platformFees: 6384,
  tds: 798,
  incentives: 5182,
  trips: 312,
  acceptance: 94,
};
