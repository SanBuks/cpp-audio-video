import { CLIENT_REQ, CLIENT_ANS } from '@/constant/signaling-msg.js'
import { Producer, RtpCapabilities, Transport } from "mediasoup/types";

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

// 拉流传输综合类
export type DownStreamTransportType = {
  transport: Transport
  associatedAudioPid: string
  associatedVideoPid?: string
}

// 定义 JOIN_ROOM 事件的 Ack 响应类型
export interface JoinRoomResponse {
  routerRtpCapabilities: RtpCapabilities;
  newRoom: boolean;
  audioPidsToCreate: string[];
  videoPidsToCreate: (string | null) [];
  associatedUserNames: (string | null) [];
}

// 定义加入房间的请求参数类型
export interface JoinRoomRequest {
  roomName: string;
  userName: string;
}
