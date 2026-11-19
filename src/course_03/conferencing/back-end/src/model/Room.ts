import type { Worker, Router } from 'mediasoup/types'
import { Client } from "@/model/Client.js";
import { config } from '@/config/config.js'

export class Room {
  roomName: string                  // 房间名
  worker: any                       // 处理所属的子进程
  router: Router | null = null      // 处理路由
  clients: Client[] = []            // 房间中的客户数组
  activeSpeakerList: string[] = []  // 最近发言的用户 id 列表

  constructor(roomName: string, workerToUse: Worker) {
    this.roomName = roomName
    this.worker = workerToUse
  }

  addClient(client: Client) {
    this.clients.push(client)
  }

  async createRouter(): Promise<void> {
    this.router = await this.worker.createRouter({
      mediaCodecs: config.routerMediaCodecs
    })
  }

}
