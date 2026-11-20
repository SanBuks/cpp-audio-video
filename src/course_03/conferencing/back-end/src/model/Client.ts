import { Room } from "@/model/Room.js"
import { config } from '@/config/config.js'
import { Logger, getLogger } from '@/util/get-logger.js'
import { Socket } from "socket.io";
import { MediaKind, Producer, Transport } from "mediasoup/types";
import { ProducerPair } from "@/type/common-type.js";

const logger: Logger = getLogger();

export class Client {
  userName: string          // 用户名
  socket: Socket            // socket 连接
  room: Room | null = null  // 参与的房间

  upstreamTransport: Transport | null = null
  downstreamTransport: Transport [] = []
  producer: ProducerPair                      // 两个部分音频和视频
  consumers: any[] = []                       // 两个部分音频和视频

  constructor(userName: string, socket: Socket) {
    this.userName = userName
    this.socket = socket
    this.producer = {}
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

    return clientTransportParams
  }

  async addProducer(kind: MediaKind, producer: Producer) {
    this.producer[kind] = producer
    if (kind === 'audio') {
      // 加入 监听
      await this.room!.activeSpeakerObserver!.addProducer({producerId: producer.id})
    }
  }
}


