import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import express from 'express'
import * as mediasoup from 'mediasoup'
import type { Worker, Router } from 'mediasoup/types'
import { Server } from 'socket.io'
import log4js from "log4js";

import { config } from '@/config/config.js'
import { CLIENT_REQ, CLIENT_ANS } from '@/constant/signaling-msg.js'
import { Client } from "@/model/Client.js";
import { Room } from "@/model/Room.js";
import { createWorkers } from '@/util/create-workers.js'
import { getWorker } from "@/util/get-worker.js";

const app = express()
const logger = log4js.configure(path.resolve(process.cwd(), 'log4js-config.json')).getLogger()

// 读取 ca 证书, 通过 express 创建 https 服务
const certDir = path.resolve(import.meta.dirname, '../cert')
const key = fs.readFileSync(path.join(certDir, 'cert.key'))
const cert = fs.readFileSync(path.join(certDir, 'cert.crt'))
const options = {key, cert}
const httpsServer = https.createServer(options, app)

let workers: Worker[]     // 处理子进程
const rooms: Room[] = []  // 房间列表

// 初始化 mediasoup
const initMediasoup = async (): Promise<void> => {
  workers = await createWorkers()
}

// socket.io 配置
let socketIoConfig = {
  cors: {
    origin: [
      `https://127.0.0.1:3032`,
      `https://localhost:3032`,
      `https://192.168.0.19:3032`,
    ],
  },
}
// 创建 socket.io 服务
const io = new Server(httpsServer, socketIoConfig)
// 业务处理逻辑
io.on('connect', socket => {
  // TODO socket.io 断连会重新连接, 这里需要解决重复连接问题, 比如 token, cookie 避免监听事件重复发生
  // TODO 鉴权逻辑需要增加

  logger.info(`socket id(${socket.id}) 已连接服务器`)

  let client: Client;
  socket.on(CLIENT_REQ.JOIN_ROOM, async ({roomName, userName}, ack) => {
    client = new Client(userName, socket)
    let newRoom = false  // 是否是新的房间
    let requestRoom = rooms.find(room => room.roomName === roomName)
    if (!requestRoom) {  // 没有房间则创建
      newRoom = true
      // 找到消耗最小的子进程
      const workerToUse = await getWorker(workers)
      requestRoom  = new Room(roomName, workerToUse)
      await requestRoom.createRouter()
      rooms.push(requestRoom)
    }
    // 加入房间
    client.room = requestRoom
    client.room.addClient(client)

    // TODO create producer, consumer

    // socket 加入房间
    socket.join(roomName)
    ack({
      routerRtpCapabilities: client.room.router?.rtpCapabilities,
      newRoom
    })
  })
})

// 启动流程, 先初始化 mediasoup, 再开始监听
async function main(): Promise<void> {
  logger.info("后台服务开始启动")
  await initMediasoup()
  logger.info("[Mediasoup] 服务加载完成")

  httpsServer.listen(config.port, () => {
    logger.info(`[Signaling] 服务开始监听: https://${config.ip}:${config.port}`)
  })
}

main().catch((err) => {
  logger.error('启动服务失败: ', err)
  process.exit(1)
})
