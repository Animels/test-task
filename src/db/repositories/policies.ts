import { PolicyType } from '../../types/policy';
import { prisma } from '../prisma/index';

class Policies {
  getPolicy(id: number) {
    return prisma.policies.findUnique({ where: { id } });
  }

  getPoliciesByRegion(regionId: number) {
    return prisma.policies.findMany({ where: { regionId } });
  }

  createPolicy(regionId: number, types: PolicyType[]) {
    return prisma.policies.create({ data: { regionId, type: types } });
  }

  updatePolicy(id: number, types: PolicyType[]) {
    return prisma.policies.update({ where: { id }, data: { type: types } });
  }
}

export const policiesRepository = new Policies();
