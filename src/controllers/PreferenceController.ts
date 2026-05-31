import { Router, Request, Response } from 'express';
import { preferencesRepository } from '../db/repositories/preferences';
import type { Preference, PreferenceInput } from '../types/preference';

type Params = { userId: string };

export class PreferenceController {
  static async get(req: Request<Params>, res: Response) {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });

    const preference = await preferencesRepository.getPreference(userId);
    if (!preference) return res.status(404).json({ error: 'Preference not found' });

    res.json(preference);
  }

  static async create(req: Request<{}, {}, Preference>, res: Response) {
    const preference = await preferencesRepository.createPreference(req.body);
    console.log(JSON.stringify({ event: 'preference_created', userId: req.body.userId }));
    res.status(201).json(preference);
  }

  static async update(req: Request<Params, {}, PreferenceInput>, res: Response) {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });

    const preference = await preferencesRepository.updatePreference(userId, req.body);
    console.log(JSON.stringify({ event: 'preference_updated', userId, changes: req.body }));
    res.json(preference);
  }
}

export const preferenceRouter = Router();
preferenceRouter.get('/preferences/:userId', PreferenceController.get);
preferenceRouter.post('/preferences', PreferenceController.create);
preferenceRouter.put('/preferences/:userId', PreferenceController.update);
