import type { Channel, ChannelType } from './shared/channel';

export type PolicyType = `${Channel}_${ChannelType}`;

export interface Policy {
  id: number;
  regionId: number;
  type: PolicyType[];
}
