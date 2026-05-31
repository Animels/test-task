import { prisma } from '../db/prisma/index';
import { channelsRepository } from '../db/repositories/channels';
import { regionsRepository } from '../db/repositories/regions';
import { policiesRepository } from '../db/repositories/policies';
import { usersRepository } from '../db/repositories/users';
import { preferencesRepository } from '../db/repositories/preferences';
import type { Channel } from '../types/shared/channel';
import type { PolicyType } from '../types/policy';

const CHANNELS: Channel[] = ['email', 'sms', 'push', 'in-app'];

const REGIONS = [
  'North America',
  'South America',
  'Europe West',
  'Europe East',
  'Middle East',
  'Africa North',
  'Africa South',
  'Asia Pacific',
  'South Asia',
  'Southeast Asia',
  'East Asia',
  'Oceania',
  'Central America',
  'Caribbean',
  'Central Asia',
  'Scandinavia',
  'Mediterranean',
  'West Africa',
  'East Africa',
  'Pacific Islands',
];

const REGION_POLICIES: Record<string, PolicyType[]> = {
  'Scandinavia': ['email_marketing', 'sms_marketing', 'push_marketing', 'in-app_marketing'],
  'Europe West': ['email_marketing', 'sms_marketing', 'push_marketing'],
  'Europe East': ['email_marketing', 'sms_marketing'],
  'Mediterranean': ['email_marketing', 'sms_marketing'],
  'North America': ['sms_marketing', 'email_marketing'],
  'South America': ['email_marketing'],
  'Middle East': ['sms_marketing', 'sms_system'],
  'Asia Pacific': ['sms_marketing', 'push_marketing'],
  'East Asia': ['email_marketing', 'sms_marketing', 'push_marketing'],
  'South Asia': ['sms_marketing'],
};

// Each user has a different mix of enabled channel+type combinations
const USER_ENABLED_SETS: PolicyType[][] = [
  ['email_system', 'email_marketing', 'push_system', 'push_marketing'],
  ['sms_system', 'sms_marketing', 'in-app_system', 'in-app_marketing'],
  ['email_system'],                                                            // transactional email only
  ['push_system', 'push_marketing', 'in-app_system', 'sms_system', 'sms_marketing'],
  ['email_system', 'email_marketing', 'sms_system', 'sms_marketing'],
  ['in-app_system', 'in-app_marketing'],
  ['email_system', 'email_marketing', 'push_system', 'push_marketing', 'sms_system', 'sms_marketing'],
  ['push_system', 'push_marketing'],
  ['email_system', 'in-app_system', 'in-app_marketing'],
  ['sms_system', 'push_system', 'push_marketing'],
];

function timeOnly(hours: number, minutes = 0): Date {
  const d = new Date(0);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const USER_TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function quietHoursFor(index: number): { start: Date; end: Date } | null {
  if (index % 3 !== 0) return null;
  return { start: timeOnly(22), end: timeOnly(8) };
}

async function purge() {
  console.log('Purging existing data...');
  await prisma.preferences.deleteMany();
  await prisma.users.deleteMany();
  await prisma.policies.deleteMany();
  await prisma.region.deleteMany();
  await prisma.channels.deleteMany();
}

async function seed() {
  await purge();

  console.log('Seeding channels...');
  for (const channel of CHANNELS) {
    await channelsRepository.createChannel(channel);
  }

  console.log('Seeding regions and policies...');
  const regions: { id: number; name: string }[] = [];
  for (const name of REGIONS) {
    const region = await regionsRepository.createRegion(name);
    regions.push(region);
    const types = REGION_POLICIES[name];
    if (types) await policiesRepository.createPolicy(region.id, types);
  }

  console.log('Seeding users and preferences...');
  for (let i = 0; i < 10; i++) {
    const user = await usersRepository.createUser(regions[i].id);
    const quiet = quietHoursFor(i);
    await preferencesRepository.createPreference({
      userId: user.id,
      enabled: USER_ENABLED_SETS[i],
      timezone: USER_TIMEZONES[i],
      quietHoursStart: quiet?.start ?? null,
      quietHoursEnd: quiet?.end ?? null,
    });
  }

  console.log('Seed complete.');
}

seed().catch(console.error);
