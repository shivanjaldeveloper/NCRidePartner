// Small display-formatting helpers shared by HomeScreen/ProfileScreen now
// that the partner's Name/Username come from the real VerifyCookie response
// instead of the PARTNER_PROFILE mock.

/** "Hathi Bhai" -> "HB". Falls back to '' if name is empty/未定. */
export const getInitials = (name?: string | null): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};

/** "1111111111" -> "+911111111111". Leaves already-formatted/odd values as-is. */
export const formatPhone = (username?: string | null): string => {
  if (!username) return '';
  const digits = username.replace(/\D/g, '');
  if (digits.length !== 10) return username;
  return `+91${digits}`;
};

/** Good morning / afternoon / evening / night, based on the device clock. */
export const getGreeting = (date: Date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};
