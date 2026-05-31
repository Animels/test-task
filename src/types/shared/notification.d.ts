import type { Channel, ChannelType } from './channel';

export interface Notification {
  userId: number;
  channel: Channel;
  type: ChannelType;
  timestamp: Date;
}
