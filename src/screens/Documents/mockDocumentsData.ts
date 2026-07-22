export interface PartnerDocument {
  id: string;
  icon: 'car' | 'user' | 'shield' | 'invoice';
  // Points at documents.items.<id>.title in the locale files — screens
  // should render via t(doc.titleKey), not doc.title directly.
  titleKey: string;
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
    titleKey: 'documents.items.dl.title',
    title: 'Driving License',
    sub: 'DL-0420110012345',
    status: 'Verified',
    verifiedOn: '18 Jan 2026',
    validTill: '12 Mar 2032',
  },
  {
    id: 'rc',
    icon: 'car',
    titleKey: 'documents.items.rc.title',
    title: 'Vehicle RC',
    sub: 'UP16 AB 4821',
    status: 'Verified',
    verifiedOn: '18 Jan 2026',
    validTill: 'Lifetime',
  },
  {
    id: 'aadhaar',
    icon: 'user',
    titleKey: 'documents.items.aadhaar.title',
    title: 'Aadhaar Card',
    sub: 'XXXX XXXX 8421',
    status: 'Verified',
    verifiedOn: '18 Jan 2026',
    validTill: 'Lifetime',
  },
  {
    id: 'insurance',
    icon: 'shield',
    titleKey: 'documents.items.insurance.title',
    title: 'Insurance Certificate',
    sub: 'Policy HD-88213-2027',
    status: 'Verified',
    verifiedOn: '2 Feb 2026',
    validTill: '18 Mar 2027',
  },
  {
    id: 'permit',
    icon: 'invoice',
    titleKey: 'documents.items.permit.title',
    title: 'Vehicle Permit',
    sub: 'NCR Commercial Permit',
    status: 'Verified',
    verifiedOn: '2 Feb 2026',
    validTill: '18 Sep 2026',
  },
];

// doc.status stays an untranslated literal (used for both display and the
// Verified/Pending colour branching) — resolve it to a translation key at
// render time with t(docStatusKey(doc.status)) rather than translating the
// stored value itself.
export const docStatusKey = (status: PartnerDocument['status']) =>
  status === 'Verified'
    ? 'documents.status.verified'
    : 'documents.status.pending';
