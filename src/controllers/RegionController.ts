import { Router, Request, Response } from 'express';
import { regionsRepository } from '../db/repositories/regions';

type Params = { id: string };
type CreateBody = { name: string };
type UpdateBody = { name: string };

export class RegionController {
  static async get(req: Request<Params>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const region = await regionsRepository.getRegion(id);
    if (!region) return res.status(404).json({ error: 'Region not found' });

    res.json(region);
  }

  static async create(req: Request<{}, {}, CreateBody>, res: Response) {
    const { name } = req.body;

    const region = await regionsRepository.createRegion(name);
    res.status(201).json(region);
  }

  static async update(req: Request<Params, {}, UpdateBody>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { name } = req.body;

    const region = await regionsRepository.updateRegion(id, name);
    res.json(region);
  }
}

export const regionRouter = Router();
regionRouter.get('/regions/:id', RegionController.get);
regionRouter.post('/regions', RegionController.create);
regionRouter.put('/regions/:id', RegionController.update);
