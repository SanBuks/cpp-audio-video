// 定义 JOIN_ROOM 事件的 Ack 响应类型
import type { RtpCapabilities } from "mediasoup-client/types";

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
