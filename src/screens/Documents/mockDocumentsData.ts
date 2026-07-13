export interface PartnerDocument {
  id: string;
  icon: 'car' | 'user' | 'shield' | 'invoice';
  title: string;
  sub: string;
  status: 'Verified' | 'Pending';
  verifiedOn: string;
  validTill: string;
}

export const PARTNER_DOCUMENTS: PartnerDocument[] = [
  {
    id: 'dl',
    icon: 'car',
    title: 'Driving License',
    sub: 'DL-0420110012345',
    status: 'Verified',
    verifiedOn: '18 Jan 2026',
    validTill: '12 Mar 2032',
  },
  {
    id: 'rc',
    icon: 'car',
    title: 'Vehicle RC',
    sub: 'UP16 AB 4821',
    status: 'Verified',
    verifiedOn: '18 Jan 2026',
    validTill: 'Lifetime',
  },
  {
    id: 'aadhaar',
    icon: 'user',
    title: 'Aadhaar Card',
    sub: 'XXXX XXXX 8421',
    status: 'Verified',
    verifiedOn: '18 Jan 2026',
    validTill: 'Lifetime',
  },
  {
    id: 'insurance',
    icon: 'shield',
    title: 'Insurance Certificate',
    sub: 'Policy HD-88213-2027',
    status: 'Verified',
    verifiedOn: '2 Feb 2026',
    validTill: '18 Mar 2027',
  },
  {
    id: 'permit',
    icon: 'invoice',
    title: 'Vehicle Permit',
    sub: 'NCR Commercial Permit',
    status: 'Verified',
    verifiedOn: '2 Feb 2026',
    validTill: '18 Sep 2026',
  },
];
