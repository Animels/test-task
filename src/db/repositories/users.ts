import { prisma } from '../prisma/index';

class Users {
  getAllUsers() {
    return prisma.users.findMany({
      include: {
        region: { include: { policies: true } },
        preferences: true,
      },
    });
  }

  getUser(id: number) {
    return prisma.users.findUnique({
      where: { id },
      include: {
        region: { include: { policies: true } },
        preferences: true,
      },
    });
  }

  createUser(regionId: number) {
    return prisma.users.create({ data: { regionId } });
  }

  updateUser(id: number, regionId: number) {
    return prisma.users.update({ where: { id }, data: { regionId } });
  }
}

export const usersRepository = new Users();
