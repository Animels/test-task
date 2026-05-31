import { Router, Request, Response } from 'express';
import { policiesRepository } from '../db/repositories/policies';
import type { PolicyType } from '../types/policy';

type IdParams = { id: string };
type RegionIdParams = { regionId: string };
type CreateBody = { regionId: number; types: PolicyType[] };
type UpdateBody = { types: PolicyType[] };

export class PolicyController {
  static async get(req: Request<IdParams>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const policy = await policiesRepository.getPolicy(id);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });

    res.json(policy);
  }

  static async getByRegion(req: Request<RegionIdParams>, res: Response) {
    const regionId = parseInt(req.params.regionId);
    if (isNaN(regionId)) return res.status(400).json({ error: 'Invalid regionId' });

    const policies = await policiesRepository.getPoliciesByRegion(regionId);
    res.json(policies);
  }

  static async create(req: Request<{}, {}, CreateBody>, res: Response) {
    const { regionId, types } = req.body;

    const policy = await policiesRepository.createPolicy(regionId, types);
    res.status(201).json(policy);
  }

  static async update(req: Request<IdParams, {}, UpdateBody>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { types } = req.body;

    const policy = await policiesRepository.updatePolicy(id, types);
    res.json(policy);
  }
}

export const policyRouter = Router();
policyRouter.get('/policies/region/:regionId', PolicyController.getByRegion);
policyRouter.get('/policies/:id', PolicyController.get);
policyRouter.post('/policies', PolicyController.create);
policyRouter.put('/policies/:id', PolicyController.update);
