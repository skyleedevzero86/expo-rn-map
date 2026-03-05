import type { Message } from './Message';

export interface Messages {
  readonly message: readonly Message[];
}

export function createMessages(params: { message: Message[] }): Messages {
  return { message: params.message };
}
