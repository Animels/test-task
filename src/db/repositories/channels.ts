import { prisma } from '../prisma/index';
import type { Channel } from '../../types/shared/channel';

class Channels {
  getChannel(channel: Channel) {
    return prisma.channels.findUnique({ where: { channel } });
  }

  createChannel(channel: Channel) {
    return prisma.channels.create({ data: { channel } });
  }

  updateChannel(id: number, channel: Channel) {
    return prisma.channels.update({ where: { id }, data: { channel } });
  }
}

export const channelsRepository = new Channels();
