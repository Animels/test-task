import type { PolicyType } from './policy';

export interface Preference {
  userId: number;
  enabled: PolicyType[];
  timezone: string;
  quietHoursStart: Date | null;
  quietHoursEnd: Date | null;
}

export interface PreferenceInput {
  enabled?: PolicyType[];
  timezone?: string;
  quietHoursStart?: Date | null;
  quietHoursEnd?: Date | null;
}
