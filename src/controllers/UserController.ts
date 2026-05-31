import { Router, Request, Response } from 'express';
import { usersRepository } from '../db/repositories/users';
import { preferencesRepository } from '../db/repositories/preferences';
import type { PolicyType } from '../types/policy';

const DEFAULT_ENABLED: PolicyType[] = [
  'email_system',
  'sms_system',
  'push_system',
  'in-app_system',
];

type Params = { id: string };
type CreateBody = { regionId: number };
type UpdateBody = { regionId: number };

export class UserController {
  static async getAll(req: Request, res: Response) {
    const users = await usersRepository.getAllUsers();
    res.json(users);
  }

  static async get(req: Request<Params>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const user = await usersRepository.getUser(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  }

  static async create(req: Request<{}, {}, CreateBody>, res: Response) {
    const { regionId } = req.body;

    const user = await usersRepository.createUser(regionId);
    await preferencesRepository.createPreference({
      userId: user.id,
      enabled: DEFAULT_ENABLED,
      timezone: 'UTC',
      quietHoursStart: null,
      quietHoursEnd: null,
    });

    res.status(201).json(user);
  }

  static async update(req: Request<Params, {}, UpdateBody>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { regionId } = req.body;

    const user = await usersRepository.updateUser(id, regionId);
    res.json(user);
  }
}

export const userRouter = Router();
userRouter.get('/users', UserController.getAll);
userRouter.get('/users/:id', UserController.get);
userRouter.post('/users', UserController.create);
userRouter.put('/users/:id', UserController.update);
