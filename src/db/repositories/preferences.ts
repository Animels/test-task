import { prisma } from '../prisma/index';
import type { Preference, PreferenceInput } from '../../types/preference';

class Preferences {
  getPreference(userId: number) {
    return prisma.preferences.findUnique({ where: { userId } });
  }

  createPreference(data: Preference) {
    return prisma.preferences.create({
      data: {
        userId: data.userId,
        enabled: data.enabled,
        timezone: data.timezone,
        quie_hours_start: data.quietHoursStart ?? undefined,
        quie_hours_end: data.quietHoursEnd ?? undefined,
      },
    });
  }

  updatePreference(userId: number, data: PreferenceInput) {
    return prisma.preferences.update({
      where: { userId },
      data: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        quie_hours_start: data.quietHoursStart ?? undefined,
        quie_hours_end: data.quietHoursEnd ?? undefined,
      },
    });
  }
}

export const preferencesRepository = new Preferences();
