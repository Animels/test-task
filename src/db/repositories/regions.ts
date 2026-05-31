import { prisma } from '../prisma/index';

class Regions {
  getRegion(id: number) {
    return prisma.region.findUnique({
      where: { id },
      include: { policies: true },
    });
  }

  createRegion(name: string) {
    return prisma.region.create({ data: { name } });
  }

  updateRegion(id: number, name: string) {
    return prisma.region.update({ where: { id }, data: { name } });
  }
}

export const regionsRepository = new Regions();
