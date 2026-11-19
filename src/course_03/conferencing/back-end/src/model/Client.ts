import { Room } from "@/model/Room.js";

export class Client {
  userName: string      // 用户名
  socket: any           // socket 连接
  room: Room | null     // 参与的房间

  upstreamTransport: any
  downstreamTransport: any[]
  producer: {}                // 两个部分 音频和视频
  consumers: any[]            // 也分两个部分

  constructor(userName: string, socket: any) {
    this.userName = userName
    this.socket = socket
    this.upstreamTransport = null
    this.producer = {}
    this.downstreamTransport = []
    this.consumers = []
    this.room = null
  }

}
