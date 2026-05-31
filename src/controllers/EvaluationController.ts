import { Router, Request, Response } from 'express';
import { usersRepository } from '../db/repositories/users';
import type { Notification } from '../types/shared/notification';
import type { Decision } from '../types/shared/decision';
import type { Reason } from '../types/shared/reason';
import type { PolicyType } from '../types/policy';

function localMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date);
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value) % 24;
  const minute = parseInt(parts.find(p => p.type === 'minute')!.value);
  return hour * 60 + minute;
}

function isInQuietHours(timestamp: Date, start: Date | null, end: Date | null, timezone: string): boolean {
  if (!start || !end) return false;
  const t = localMinutes(timestamp, timezone);
  const s = start.getHours() * 60 + start.getMinutes();
  const e = end.getHours() * 60 + end.getMinutes();
  return s > e ? t >= s || t < e : t >= s && t < e;
}

export class EvaluationController {
  static async evaluate(req: Request<{}, {}, Notification>, res: Response) {
    const { userId, channel, type, timestamp } = req.body;

    const user = await usersRepository.getUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const reasons: Reason[] = [];

    const policyKey: PolicyType = `${channel}_${type}`;
    const enabled = (user.preferences?.enabled ?? []) as string[];
    if (!enabled.includes(policyKey)) {
      reasons.push('channel_disabled');
    }

    const timezone = user.preferences?.timezone ?? 'UTC';
    if (type === 'marketing' && isInQuietHours(new Date(timestamp), user.preferences?.quie_hours_start ?? null, user.preferences?.quie_hours_end ?? null, timezone)) {
      reasons.push('quiet_hours');
    }

    const isRestricted = user.region.policies.some((p) => (p.type as string[]).includes(policyKey));
    if (isRestricted) {
      reasons.push('policy_violation');
    }

    const decision: Decision = reasons.length === 0 ? 'allow' : 'deny';

    console.log(JSON.stringify({ event: 'evaluate', userId, channel, type, decision, reasons }));

    res.json({ decision, reasons });
  }
}

export const evaluationRouter = Router();
evaluationRouter.post('/evaluate', EvaluationController.evaluate);
