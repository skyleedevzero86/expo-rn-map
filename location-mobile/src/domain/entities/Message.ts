export interface Message {
  readonly no: number;
  readonly sender: string;
  readonly message: string;
  readonly sendDate: string;
  readonly status: number;
}

export function createMessage(params: {
  no: number;
  sender: string;
  message: string;
  sendDate: string;
  status: number;
}): Message {
  return {
    no: params.no,
    sender: params.sender,
    message: params.message,
    sendDate: params.sendDate,
    status: params.status,
  };
}
