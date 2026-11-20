import { CLIENT_REQ, CLIENT_ANS } from '@/constant/signaling-msg.js'
import { Producer } from "mediasoup/types";

type AckData<T = void> = {
  ok: boolean;
  data?: T;
  error?: string
}
type Ack<T = void> = (res: AckData<T>) => void

// 客户端事件
export interface ClientToServerEvents {
  [CLIENT_REQ.JOIN_ROOM]: ( data: { roomId: string; username: string }, ack: Ack ) => void
}

// 服务器事件
export interface ServerToClientEvents {
  [CLIENT_ANS.NEW_PRODUCER] : (data: { producerId: string; username: string }) => void
}

// 服务器间事件
export interface InterServerEvents {}

// 数据类型
export interface SocketData {
  roomId?: string
  username?: string
}

export type ProducerPair = {
  audio?: Producer
  video?: Producer
}
