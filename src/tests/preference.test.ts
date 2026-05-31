import { PreferenceController } from '../controllers/PreferenceController';
import { preferencesRepository } from '../db/repositories/preferences';
import { mockReq, mockRes, timeDate } from './utils';

jest.mock('../db/repositories/preferences', () => ({
  preferencesRepository: { getPreference: jest.fn(), createPreference: jest.fn(), updatePreference: jest.fn() },
}));

const mocked = jest.mocked(preferencesRepository);

beforeEach(() => jest.clearAllMocks());

const basePreference = {
  id: 1,
  userId: 1,
  enabled: ['email_system', 'email_marketing'],
  timezone: 'UTC',
  quie_hours_start: null,
  quie_hours_end: null,
};

describe('PreferenceController.get', () => {
  it('returns 404 when no preference exists for the user', async () => {
    mocked.getPreference.mockResolvedValue(null);

    const res = mockRes();
    await PreferenceController.get(mockReq({}, { userId: '1' }), res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns the preference record', async () => {
    mocked.getPreference.mockResolvedValue(basePreference as any);

    const res = mockRes();
    await PreferenceController.get(mockReq({}, { userId: '1' }), res as any);

    expect(mocked.getPreference).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(basePreference);
  });
});

describe('PreferenceController.update', () => {
  it('updates the enabled notification types', async () => {
    const updated = { ...basePreference, enabled: ['sms_system', 'sms_marketing'] };
    mocked.updatePreference.mockResolvedValue(updated as any);

    const res = mockRes();
    await PreferenceController.update(
      mockReq({ enabled: ['sms_system', 'sms_marketing'] }, { userId: '1' }),
      res as any,
    );

    expect(mocked.updatePreference).toHaveBeenCalledWith(1, { enabled: ['sms_system', 'sms_marketing'] });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('can enable marketing types while keeping system types', async () => {
    const updated = { ...basePreference, enabled: ['email_system', 'email_marketing', 'sms_system', 'sms_marketing'] };
    mocked.updatePreference.mockResolvedValue(updated as any);

    const res = mockRes();
    await PreferenceController.update(
      mockReq({ enabled: ['email_system', 'email_marketing', 'sms_system', 'sms_marketing'] }, { userId: '1' }),
      res as any,
    );

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('sets quiet hours', async () => {
    const start = timeDate(22);
    const end = timeDate(8);
    const updated = { ...basePreference, quie_hours_start: start, quie_hours_end: end };
    mocked.updatePreference.mockResolvedValue(updated as any);

    const res = mockRes();
    await PreferenceController.update(
      mockReq({ quietHoursStart: start.toISOString(), quietHoursEnd: end.toISOString() }, { userId: '1' }),
      res as any,
    );

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('clears quiet hours when nulls are passed', async () => {
    const updated = { ...basePreference, quie_hours_start: null, quie_hours_end: null };
    mocked.updatePreference.mockResolvedValue(updated as any);

    const res = mockRes();
    await PreferenceController.update(
      mockReq({ quietHoursStart: null, quietHoursEnd: null }, { userId: '1' }),
      res as any,
    );

    expect(mocked.updatePreference).toHaveBeenCalledWith(1, {
      quietHoursStart: null,
      quietHoursEnd: null,
    });
  });
});

describe('Idempotency', () => {
  it('applying the same enabled update twice yields the same result', async () => {
    const payload = { enabled: ['email_system', 'email_marketing'] };
    const updated = { ...basePreference, enabled: payload.enabled };
    mocked.updatePreference.mockResolvedValue(updated as any);

    const res1 = mockRes();
    await PreferenceController.update(mockReq(payload, { userId: '1' }), res1 as any);

    const res2 = mockRes();
    await PreferenceController.update(mockReq(payload, { userId: '1' }), res2 as any);

    const result1 = res1.json.mock.calls[0][0];
    const result2 = res2.json.mock.calls[0][0];

    expect(result1).toEqual(result2);
    expect(mocked.updatePreference).toHaveBeenCalledTimes(2);
    expect(mocked.updatePreference).toHaveBeenNthCalledWith(1, 1, payload);
    expect(mocked.updatePreference).toHaveBeenNthCalledWith(2, 1, payload);
  });

  it('disabling a notification type twice leaves it disabled', async () => {
    const payload = { enabled: ['email_system'] };
    const updated = { ...basePreference, enabled: ['email_system'] };
    mocked.updatePreference.mockResolvedValue(updated as any);

    for (let i = 0; i < 2; i++) {
      const res = mockRes();
      await PreferenceController.update(mockReq(payload, { userId: '1' }), res as any);
      expect(res.json.mock.calls[0][0].enabled).toEqual(['email_system']);
    }
  });
});
