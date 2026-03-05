import type { Coordinates } from '@domain/value-objects/Coordinates';
import type { Messages } from '@domain/entities/Messages';

export interface IMessageApi {
  uploadLocationAndGetMessages(coords: Coordinates): Promise<Messages>;
}
