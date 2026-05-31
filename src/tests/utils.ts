import type { Request, Response } from 'express';

export const mockReq = (body: object = {}, params: object = {}): any =>
  ({ body, params });

export const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as jest.Mocked<Response> & { status: jest.Mock; json: jest.Mock };
};

export const timeDate = (hours: number, minutes = 0): Date => {
  const d = new Date(0);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// Uses setUTCHours so the ISO string reflects the intended UTC hour regardless of test machine timezone
export const timestampAt = (hours: number, minutes = 0): string => {
  const d = new Date();
  d.setUTCHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const makeUser = (overrides: {
  region?: Partial<{ id: number; name: string; policies: { id: number; regionId: number; type: string[] }[] }>;
  preferences?: Partial<{
    enabled: string[];
    timezone: string;
    quie_hours_start: Date | null;
    quie_hours_end: Date | null;
  }> | null;
  [key: string]: any;
} = {}) => {
  const { region, preferences, ...rest } = overrides;
  return {
    id: 1,
    regionId: 1,
    region: {
      id: 1,
      name: 'Test Region',
      policies: [] as { id: number; regionId: number; type: string[] }[],
      ...region,
    },
    preferences: preferences === null ? null : {
      id: 1,
      userId: 1,
      enabled: [
        'email_system', 'email_marketing',
        'sms_system', 'sms_marketing',
        'push_system', 'push_marketing',
        'in-app_system', 'in-app_marketing',
      ],
      timezone: 'UTC',
      quie_hours_start: null as Date | null,
      quie_hours_end: null as Date | null,
      ...preferences,
    },
    ...rest,
  };
};
