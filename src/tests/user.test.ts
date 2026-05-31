import { UserController } from '../controllers/UserController';
import { usersRepository } from '../db/repositories/users';
import { preferencesRepository } from '../db/repositories/preferences';
import { mockReq, mockRes, makeUser } from './utils';

jest.mock('../db/repositories/users', () => ({
  usersRepository: { getUser: jest.fn(), createUser: jest.fn(), updateUser: jest.fn() },
}));
jest.mock('../db/repositories/preferences', () => ({
  preferencesRepository: { getPreference: jest.fn(), createPreference: jest.fn(), updatePreference: jest.fn() },
}));

const mockedUsers = jest.mocked(usersRepository);
const mockedPreferences = jest.mocked(preferencesRepository);

beforeEach(() => jest.clearAllMocks());

describe('UserController.create', () => {
  it('creates the user and wires up default preferences', async () => {
    const newUser = { id: 5, regionId: 2 };
    mockedUsers.createUser.mockResolvedValue(newUser as any);
    mockedPreferences.createPreference.mockResolvedValue({} as any);

    const res = mockRes();
    await UserController.create(mockReq({ regionId: 2 }), res as any);

    expect(mockedUsers.createUser).toHaveBeenCalledWith(2);
    expect(mockedPreferences.createPreference).toHaveBeenCalledWith({
      userId: 5,
      enabled: ['email_system', 'sms_system', 'push_system', 'in-app_system'],
      timezone: 'UTC',
      quietHoursStart: null,
      quietHoursEnd: null,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newUser);
  });
});

describe('UserController.get', () => {
  it('returns 404 when user does not exist', async () => {
    mockedUsers.getUser.mockResolvedValue(null);

    const res = mockRes();
    await UserController.get(mockReq({}, { id: '99' }), res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = mockRes();
    await UserController.get(mockReq({}, { id: 'abc' }), res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockedUsers.getUser).not.toHaveBeenCalled();
  });

  it('returns the user with region and preferences', async () => {
    const user = makeUser();
    mockedUsers.getUser.mockResolvedValue(user as any);

    const res = mockRes();
    await UserController.get(mockReq({}, { id: '1' }), res as any);

    expect(mockedUsers.getUser).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(user);
  });
});

describe('UserController.update', () => {
  it('updates the user region and returns the updated user', async () => {
    const updated = { id: 1, regionId: 7 };
    mockedUsers.updateUser.mockResolvedValue(updated as any);

    const res = mockRes();
    await UserController.update(mockReq({ regionId: 7 }, { id: '1' }), res as any);

    expect(mockedUsers.updateUser).toHaveBeenCalledWith(1, 7);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = mockRes();
    await UserController.update(mockReq({ regionId: 2 }, { id: 'bad' }), res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockedUsers.updateUser).not.toHaveBeenCalled();
  });
});
