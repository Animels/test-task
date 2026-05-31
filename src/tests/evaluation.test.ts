import { EvaluationController } from '../controllers/EvaluationController';
import { usersRepository } from '../db/repositories/users';
import { mockReq, mockRes, makeUser, timeDate, timestampAt } from './utils';

jest.mock('../db/repositories/users', () => ({
  usersRepository: { getUser: jest.fn(), createUser: jest.fn(), updateUser: jest.fn() },
}));

const mocked = jest.mocked(usersRepository);

beforeEach(() => jest.clearAllMocks());

const evaluate = (body: object) =>
  EvaluationController.evaluate(mockReq(body) as any, mockRes() as any);

const evaluateAndGetRes = async (body: object) => {
  const res = mockRes();
  await EvaluationController.evaluate(mockReq(body) as any, res as any);
  return res.json.mock.calls[0][0] as { decision: string; reasons: string[] };
};

describe('Evaluation — allow', () => {
  it('allows when channel+type is enabled, no quiet hours, no policies', async () => {
    mocked.getUser.mockResolvedValue(makeUser() as any);

    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: timestampAt(14),
    });

    expect(result.decision).toBe('allow');
    expect(result.reasons).toHaveLength(0);
  });

  it('allows system notifications in regions with only marketing restrictions', async () => {
    mocked.getUser.mockResolvedValue(makeUser({
      region: { policies: [{ id: 1, regionId: 1, type: ['email_marketing'] }] },
    }) as any);

    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'system', timestamp: timestampAt(14),
    });

    expect(result.decision).toBe('allow');
  });
});

describe('Evaluation — channel_disabled', () => {
  it('denies when the requested channel+type is not in user enabled list', async () => {
    mocked.getUser.mockResolvedValue(makeUser({
      preferences: { enabled: ['email_system', 'email_marketing'] },
    }) as any);

    const result = await evaluateAndGetRes({
      userId: 1, channel: 'sms', type: 'marketing', timestamp: timestampAt(14),
    });

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('channel_disabled');
  });

  it('denies when user has marketing disabled for a channel but system is still allowed', async () => {
    mocked.getUser.mockResolvedValue(makeUser({
      preferences: { enabled: ['email_system'] },
    }) as any);

    const systemResult = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'system', timestamp: timestampAt(14),
    });
    const marketingResult = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: timestampAt(14),
    });

    expect(systemResult.decision).toBe('allow');
    expect(marketingResult.decision).toBe('deny');
    expect(marketingResult.reasons).toContain('channel_disabled');
  });

  it('denies when user has no preferences at all', async () => {
    mocked.getUser.mockResolvedValue(makeUser({ preferences: null }) as any);

    const result = await evaluateAndGetRes({
      userId: 1, channel: 'push', type: 'system', timestamp: timestampAt(14),
    });

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('channel_disabled');
  });
});

describe('Evaluation — quiet_hours', () => {
  const quietUser = () => makeUser({
    preferences: {
      quie_hours_start: timeDate(22),
      quie_hours_end: timeDate(8),
      timezone: 'UTC',
    },
  });

  it('denies marketing at 23:00 (inside overnight window)', async () => {
    mocked.getUser.mockResolvedValue(quietUser() as any);
    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: timestampAt(23),
    });
    expect(result.reasons).toContain('quiet_hours');
  });

  it('denies marketing at 00:00 (midnight, inside overnight window)', async () => {
    mocked.getUser.mockResolvedValue(quietUser() as any);
    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: timestampAt(0),
    });
    expect(result.reasons).toContain('quiet_hours');
  });

  it('denies marketing at 07:00 (still inside overnight window)', async () => {
    mocked.getUser.mockResolvedValue(quietUser() as any);
    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: timestampAt(7),
    });
    expect(result.reasons).toContain('quiet_hours');
  });

  it('allows marketing at 14:00 (outside window)', async () => {
    mocked.getUser.mockResolvedValue(quietUser() as any);
    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: timestampAt(14),
    });
    expect(result.reasons).not.toContain('quiet_hours');
  });

  it('allows system notifications during quiet hours', async () => {
    mocked.getUser.mockResolvedValue(quietUser() as any);
    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'system', timestamp: timestampAt(23),
    });
    expect(result.reasons).not.toContain('quiet_hours');
    expect(result.decision).toBe('allow');
  });

  it('allows when no quiet hours are set', async () => {
    mocked.getUser.mockResolvedValue(makeUser() as any);
    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: timestampAt(23),
    });
    expect(result.reasons).not.toContain('quiet_hours');
  });
});

describe('Evaluation — quiet_hours timezone', () => {
  it('blocks marketing when UTC timestamp falls in quiet hours after timezone conversion (UTC+3)', async () => {
    mocked.getUser.mockResolvedValue(makeUser({
      preferences: {
        quie_hours_start: timeDate(22),
        quie_hours_end: timeDate(8),
        timezone: 'Etc/GMT-3',
      },
    }) as any);

    const d = new Date();
    d.setUTCHours(20, 0, 0, 0);
    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: d.toISOString(),
    });

    expect(result.reasons).toContain('quiet_hours');
  });

  it('allows marketing when UTC timestamp is outside quiet hours after timezone conversion (UTC-5)', async () => {
    mocked.getUser.mockResolvedValue(makeUser({
      preferences: {
        quie_hours_start: timeDate(22),
        quie_hours_end: timeDate(8),
        timezone: 'Etc/GMT+5',
      },
    }) as any);

    const d = new Date();
    d.setUTCHours(20, 0, 0, 0);
    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: d.toISOString(),
    });

    expect(result.reasons).not.toContain('quiet_hours');
  });
});

describe('Evaluation — policy_violation', () => {
  it('denies when region restricts the channel+type combination', async () => {
    mocked.getUser.mockResolvedValue(makeUser({
      region: { policies: [{ id: 1, regionId: 1, type: ['email_marketing'] }] },
    }) as any);

    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: timestampAt(14),
    });

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('policy_violation');
  });

  it('allows when region policy covers a different channel', async () => {
    mocked.getUser.mockResolvedValue(makeUser({
      region: { policies: [{ id: 1, regionId: 1, type: ['sms_marketing'] }] },
    }) as any);

    const result = await evaluateAndGetRes({
      userId: 1, channel: 'email', type: 'marketing', timestamp: timestampAt(14),
    });

    expect(result.decision).toBe('allow');
    expect(result.reasons).not.toContain('policy_violation');
  });

  it('denies in restricted region but allows for same user in unrestricted region', async () => {
    const restrictedUser = makeUser({
      regionId: 1,
      region: { name: 'Europe West', policies: [{ id: 1, regionId: 1, type: ['email_marketing', 'sms_marketing'] }] },
    });
    const freeUser = makeUser({
      regionId: 2,
      region: { name: 'Africa South', policies: [] },
    });

    const notification = { userId: 1, channel: 'email', type: 'marketing', timestamp: timestampAt(14) };

    mocked.getUser.mockResolvedValue(restrictedUser as any);
    const restrictedResult = await evaluateAndGetRes(notification);

    mocked.getUser.mockResolvedValue(freeUser as any);
    const freeResult = await evaluateAndGetRes(notification);

    expect(restrictedResult.decision).toBe('deny');
    expect(freeResult.decision).toBe('allow');
  });

  it('applies newly added policy — region gains a restriction', async () => {
    const notification = { userId: 1, channel: 'push', type: 'marketing', timestamp: timestampAt(14) };

    mocked.getUser.mockResolvedValue(makeUser({ region: { policies: [] } }) as any);
    const before = await evaluateAndGetRes(notification);

    mocked.getUser.mockResolvedValue(makeUser({
      region: { policies: [{ id: 2, regionId: 1, type: ['push_marketing'] }] },
    }) as any);
    const after = await evaluateAndGetRes(notification);

    expect(before.decision).toBe('allow');
    expect(after.decision).toBe('deny');
    expect(after.reasons).toContain('policy_violation');
  });
});

describe('Evaluation — multiple reasons', () => {
  it('accumulates all applicable denial reasons', async () => {
    mocked.getUser.mockResolvedValue(makeUser({
      preferences: {
        enabled: ['email_system', 'email_marketing'],
        quie_hours_start: timeDate(22),
        quie_hours_end: timeDate(8),
      },
      region: { policies: [{ id: 1, regionId: 1, type: ['sms_marketing'] }] },
    }) as any);

    const result = await evaluateAndGetRes({
      userId: 1, channel: 'sms', type: 'marketing', timestamp: timestampAt(23),
    });

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('channel_disabled');
    expect(result.reasons).toContain('quiet_hours');
    expect(result.reasons).toContain('policy_violation');
    expect(result.reasons).toHaveLength(3);
  });
});

describe('Evaluation — user not found', () => {
  it('returns 404', async () => {
    mocked.getUser.mockResolvedValue(null);

    const res = mockRes();
    await EvaluationController.evaluate(
      mockReq({ userId: 99, channel: 'email', type: 'marketing', timestamp: timestampAt(14) }) as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
