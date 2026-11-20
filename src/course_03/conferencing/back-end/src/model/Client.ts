import { Room } from "@/model/Room.js"
import { config } from '@/config/config.js'
import { Logger, getLogger } from '@/util/get-logger.js'
import { Socket } from "socket.io";
import { Transport } from "mediasoup/types";

const logger: Logger = getLogger();

export class Client {
  userName: string          // 用户名
  socket: Socket            // socket 连接
  room: Room | null = null  // 参与的房间

  upstreamTransport: Transport | null = null
  downstreamTransport: Transport [] = []
  producer: {}                // 两个部分 音频和视频
  consumers: any[]            // 也分两个部分

  constructor(userName: string, socket: Socket) {
    this.userName = userName
    this.socket = socket
    this.producer = {}
    this.consumers = []
  }

  async addTransport(type: string): Promise<any> {
    if (!this.room || !this.room.router) {
      throw new Error("addTransport(): room 或 router 不存在!")
    }

    // 获取配置
    const {listenInfos, maxIncomingBitrate, initialAvailableOutgoingBitrate} = config
    // 创建 传输对象
    const transport = await this.room.router.createWebRtcTransport({
      enableUdp: true,
      enableTcp: true,  // 优先使用 udp
      preferUdp: true,
      listenInfos: listenInfos,
      maxIncomingBitrate: maxIncomingBitrate,
      initialAvailableOutgoingBitrate: initialAvailableOutgoingBitrate
    })
    // 打印 iceCandidates
    logger.info(`(${this.socket.id}) Server ICE Candidates:`, transport.iceCandidates)

    const clientTransportParams = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    }

    if (type === 'producer') {
      this.upstreamTransport = transport
    } else if (type === 'consumer') {

    }

    return new Promise(resolve => {
      resolve(clientTransportParams)
    })
  }

}


