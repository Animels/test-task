import { Router, Request, Response } from 'express';
import { channelsRepository } from '../db/repositories/channels';
import type { Channel } from '../types/shared/channel';

type ChannelParams = { channel: string };
type IdParams = { id: string };
type CreateBody = { channel: Channel };
type UpdateBody = { channel: Channel };

export class ChannelController {
  static async get(req: Request<ChannelParams>, res: Response) {
    const channel = req.params.channel as Channel;

    const result = await channelsRepository.getChannel(channel);
    if (!result) return res.status(404).json({ error: 'Channel not found' });

    res.json(result);
  }

  static async create(req: Request<{}, {}, CreateBody>, res: Response) {
    const { channel } = req.body;

    const result = await channelsRepository.createChannel(channel);
    res.status(201).json(result);
  }

  static async update(req: Request<IdParams, {}, UpdateBody>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { channel } = req.body;

    const result = await channelsRepository.updateChannel(id, channel);
    res.json(result);
  }
}

export const channelRouter = Router();
channelRouter.get('/channels/:channel', ChannelController.get);
channelRouter.post('/channels', ChannelController.create);
channelRouter.put('/channels/:id', ChannelController.update);
