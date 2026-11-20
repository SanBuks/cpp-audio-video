import type { Worker, Router, ActiveSpeakerObserver, ActiveSpeakerObserverDominantSpeaker } from 'mediasoup/types'
import { Client } from "@/model/Client.js";
import { config } from '@/config/config.js'
import { newDominantSpeaker } from "@/util/new-dominant-speaker.js";
import { Socket } from "socket.io";

export class Room {
  roomName: string                  // 房间名
  worker: any                       // 处理所属的子进程
  router: Router | null = null      // 处理路由
  clients: Client[] = []            // 房间中的客户数组
  activeSpeakerList: string[] = []  // 最近发言的用户 id 列表
  activeSpeakerObserver: ActiveSpeakerObserver | null = null

  constructor(roomName: string, workerToUse: Worker) {
    this.roomName = roomName
    this.worker = workerToUse
  }

  addClient(client: Client) {
    this.clients.push(client)
  }

  async createRouter(io: Socket): Promise<void> {
    this.router = await this.worker.createRouter({
      mediaCodecs: config.routerMediaCodecs
    })
    // 创建主要说话监听器
    this.activeSpeakerObserver = await this.router!.createActiveSpeakerObserver({
      interval: 300
    })
    this.activeSpeakerObserver.on("dominantspeaker",
      (ds: ActiveSpeakerObserverDominantSpeaker) => newDominantSpeaker(ds, this, io))

  }

}
