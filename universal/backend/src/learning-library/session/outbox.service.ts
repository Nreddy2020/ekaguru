import { Injectable } from '@nestjs/common';
import { Prisma, NotificationEventType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OutboxService {
  computeHash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  async createEvent(
    tx: Prisma.TransactionClient,
    learnerId: string,
    eventType: NotificationEventType,
    aggregateType: string,
    aggregateId: string,
    payload: any,
    utcDateString?: string
  ): Promise<any> {
    const keyData = `${learnerId}|${eventType}|${aggregateType}|${aggregateId}${
      utcDateString ? `|${utcDateString}` : ''
    }`;
    const eventKey = this.computeHash(keyData);

    const sanitizedPayload: any = {};
    const forbiddenKeys = [
      'content',
      'storageKey',
      'correctAnswer',
      'correctOption',
      'correctOptions',
      'answer',
      'response',
      'responsePayload',
      'credentials',
      'password',
      'token',
      'jwt',
      'evidenceKey',
    ];

    if (payload && typeof payload === 'object') {
      for (const [key, val] of Object.entries(payload)) {
        if (
          !forbiddenKeys.includes(key) &&
          !key.toLowerCase().includes('password') &&
          !key.toLowerCase().includes('jwt')
        ) {
          sanitizedPayload[key] = val;
        }
      }
    }

    try {
      return await tx.notificationEvent.create({
        data: {
          learnerId,
          eventType,
          aggregateType,
          aggregateId,
          eventKey,
          payload: sanitizedPayload,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002' || (err.message && err.message.includes('Unique constraint'))) {
        return null;
      }
      throw err;
    }
  }
}
