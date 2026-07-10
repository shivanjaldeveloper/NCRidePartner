// Static stand-ins for the window.PARTNER_* globals from the design source.
// Swap these for real API-backed state once the partner dashboard endpoints
// are wired up — the shapes here mirror the fields the source screen reads.

export interface PartnerProfile {
  initials: string;
  name: string;
  phone: string;
}

export interface PartnerStats {
  todayEarnings: number;
  todayTrips: number;
  onlineHours: string;
  rating: number;
  acceptanceRate: number;
  cancellationRate: number;
  totalTrips: number;
}

export interface DemandZone {
  name: string;
  tag: string;
  dot: string;
}

export interface Incentive {
  title: string;
  sub: string;
  current: number;
  target: number;
  reward: number;
}

export interface Vehicle {
  number: string;
  type: string;
  model: string;
}

export interface Payout {
  amount: number;
  date: string;
}

export interface Trip {
  id: string;
  from: string;
  to: string;
  date: string;
  dist: string;
  earning: number;
  status: 'Completed' | 'Cancelled';
  type?: 'intercity' | 'local';
}

export interface RideRequest {
  pickup: string;
  pickupDist: string;
  drop: string;
  tripDist: string;
  earning: number;
  duration: string;
  payment: string;
  passengerName: string;
  passengerTrips: number;
  passengerRating: number;
  service: string;
}

export const PARTNER_PROFILE: PartnerProfile = {
  initials: 'RK',
  name: 'Rajesh Kumar',
  phone: '+91 98765 43210',
};

export const PARTNER_STATS: PartnerStats = {
  todayEarnings: 2840,
  todayTrips: 14,
  onlineHours: '4h 35m',
  rating: 4.8,
  acceptanceRate: 92,
  cancellationRate: 3,
  totalTrips: 2847,
};

export const PARTNER_DEMAND_ZONES: DemandZone[] = [
  { name: 'Sector 62, Noida', tag: 'HIGH DEMAND', dot: '#E0524E' },
  { name: 'Cyber Hub, Gurugram', tag: 'SURGE 1.4x', dot: '#F2A03D' },
  { name: 'Connaught Place, Delhi', tag: 'STEADY', dot: '#1F9D6B' },
];

export const PARTNER_INCENTIVES: Incentive[] = [
  {
    title: 'Weekly bonus',
    sub: 'Complete 60 trips this week for ₹500 bonus',
    current: 42,
    target: 60,
    reward: 500,
  },
];

export const PARTNER_VEHICLES: Vehicle[] = [
  { number: 'UP16 AB 4821', type: 'Sedan', model: 'Maruti Swift Dzire' },
];

export const PARTNER_PAYOUTS: Payout[] = [{ amount: 8740, date: 'Monday' }];

export const PARTNER_TRIPS: Trip[] = [
  {
    id: 't1',
    from: 'Sector 62',
    to: 'Cyber Hub',
    date: 'Today, 2:10 PM',
    dist: '8.4 km',
    earning: 186,
    status: 'Completed',
    type: 'local',
  },
  {
    id: 't2',
    from: 'Sector 18',
    to: 'Botanical Garden',
    date: 'Today, 1:05 PM',
    dist: '4.1 km',
    earning: 98,
    status: 'Completed',
    type: 'local',
  },
  {
    id: 't3',
    from: 'Noida Extension',
    to: 'Kalindi Kunj',
    date: 'Today, 11:40 AM',
    dist: '6.7 km',
    earning: 0,
    status: 'Cancelled',
    type: 'local',
  },
];

export const PARTNER_RIDE_REQUEST: RideRequest = {
  pickup: 'Sector 62 Metro, Noida',
  pickupDist: '1.2 km',
  drop: 'DLF Mall of India',
  tripDist: '8.4 km',
  earning: 186,
  duration: '22 min',
  payment: 'UPI',
  passengerName: 'Priya S.',
  passengerTrips: 84,
  passengerRating: 4.8,
  service: 'Car · Sedan',
};
