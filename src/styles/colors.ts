export const colors = {
  bgPrimary: '#000000',
  bgCard: '#121214',
  bgSubtle: '#1C1C20',
  borderSubtle: '#27272A',
  borderFocus: '#38BDF8',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  brandPrimary: '#38BDF8',
  brandSuccess: '#22C55E',
  brandWarning: '#F59E0B',
  brandDanger: '#EF4444',
  tagCourse: '#3B82F6',
  tagVideo: '#EF4444',
  tagDoc: '#10B981',
  tagTask: '#F59E0B',
  tagBrainstorm: '#8B5CF6',
} as const;

export type ColorKey = keyof typeof colors;
