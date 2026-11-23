import type { Consumer, RtpCapabilities, Transport } from "mediasoup-client/types";

// 定义加入房间的返回参数类型
export interface JoinRoomResponse {
  routerRtpCapabilities: RtpCapabilities
  newRoom: boolean
  audioPidsToCreate: string[]
  videoPidsToCreate: (string | null) []
  associatedUserNames: (string | null) []
}

// 定义加入房间的请求参数类型
export interface JoinRoomRequest {
  roomName: string
  userName: string
}

// 客户端 consumer 综合类型
export interface ConsumerEntity {
  userName: string              // 客户名称
  combinedStream: MediaStream   // 综合流
  consumerTransport: Transport  // 传输连接
  audioConsumer: Consumer       // 音频拉流
  videoConsumer?: Consumer      // 视频拉流
}

// 客户端 consumers 集合
export type ClientConsumers = Map<string, ConsumerEntity>
