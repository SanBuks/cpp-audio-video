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
import { JoinRoomRequest, JoinRoomResponse } from "@/type/common-type.js";

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

  // ---- 连接闭包对象 ----
  let client: Client;  // socket 对应的 用户

  // 处理加入房间请求
  socket.on(CLIENT_REQ.JOIN_ROOM, async (
    { roomName, userName }: JoinRoomRequest,
    ack: (response: JoinRoomResponse) => void
  ) => {
    client = new Client(userName, socket)
    let newRoom = false  // 是否是新的房间
    let requestRoom = rooms.find(room => room.roomName === roomName)
    if (!requestRoom) {  // 没有房间则创建
      newRoom = true
      // 找到消耗最小的子进程
      const workerToUse = await getWorker(workers)
      requestRoom  = new Room(roomName, workerToUse)
      await requestRoom.createRouter(socket)
      rooms.push(requestRoom)
    }
    // 加入房间
    client.room = requestRoom
    client.room.addClient(client)
    // socket 加入房间
    socket.join(roomName)

    // 获取前 5 个活跃 audio id
    const audioPidsToCreate = client.room.activeSpeakerList.slice(0, 5)
    // 获取对应的 5 个 video id
    const videoPidsToCreate = audioPidsToCreate.map((audioId) => {
      const findClient = client.room?.clients.find(c => c?.producer?.audio?.id === audioId)
      const returnId = findClient?.producer?.video?.id
      return returnId ? returnId : null
    })
    // 获取对应的 5 个 client user name
    const associatedUserNames = audioPidsToCreate.map((audioId) => {
      const findClient = client.room?.clients.find(c => c?.producer?.audio?.id === audioId)
      const returnName = findClient?.userName
      return returnName ? returnName : null
    })

    ack({
      routerRtpCapabilities: client.room.router!.rtpCapabilities,
      newRoom,
      audioPidsToCreate,
      videoPidsToCreate,
      associatedUserNames,
    })
  })

  // 处理创建传输请求, consumer & producer
  socket.on(CLIENT_REQ.CREATE_TRANSPORT, async ({type, audioPid}, ack)=> {
    let clientTransportParams = null
    if (type === 'producer') {
      clientTransportParams = await client.addTransport(type)
    } else if (type === 'consumer') {
      // 从房间中查找 audioPid 对应的 客户端, 创建一个 transport, 每个 transport 中含有 video-producer / audio-producer
      const producingClient = client.room?.clients.find(c => c?.producer?.audio?.id === audioPid)
      const videoPid = producingClient?.producer?.video?.id
      clientTransportParams = await client.addTransport(type, audioPid, videoPid)
    }
    ack(clientTransportParams)
  })

  // 处理传输连接请求, consumer & producer
  socket.on(CLIENT_REQ.CONNECT_TRANSPORT, async ({dtlsParameters, type}, ack) => {
    if (type === 'producer') {
      try {
        await client.upstreamTransport!.connect({dtlsParameters})
        ack("success")
      } catch (err) {
        console.log(err)
        ack("error")
      }
    }
  })

  // produce, consume
  socket.on(CLIENT_REQ.START_PRODUCE, async({kind, rtpParameters}, ack) => {
    try {
      const newProducer = await client.upstreamTransport!.produce({kind, rtpParameters})
      await client.addProducer(kind, newProducer)
      ack(newProducer.id)
    } catch (err) {
      console.log(err)
      ack("error")
    }
    // TODO 1 audio track 需要加入正在通话显示列表
    // TODO 2 通知房间其他人需要接收
  })

  // 处理关闭, 打开音频
  socket.on(CLIENT_REQ.AUDIO_CHANGE, async ({type}) => {
    if (type === 'mute') {
      client?.producer?.audio?.pause()
    } else {
      client?.producer?.audio?.resume()
    }
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
