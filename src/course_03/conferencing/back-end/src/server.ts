import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import express from 'express'
import type { Worker } from 'mediasoup/types'
import { Server } from 'socket.io'
import log4js from "log4js";

import { config } from '@/config/config.js'
import { CLIENT_REQ, SERVER_REQ } from '@/constant/signaling-msg.js'
import { Client } from "@/model/Client.js";
import { Room } from "@/model/Room.js";
import { createWorkers } from '@/util/create-workers.js'
import { getWorker } from "@/util/get-worker.js";
import { JoinRoomRequest, JoinRoomResponse } from "@/type/common-type.js";
import { updateActiveSpeakers } from "@/util/update-active-speakers.js";

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
      `https://${process.env.APP_SIGNALING_SERVER_IP}:${process.env.APP_SIGNALING_CLIENT_PORT}`,
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
      const producerClient = client.room?.clients.find(c => c?.producer?.audio?.id === audioId)
      const returnId = producerClient?.producer?.video?.id
      return returnId ? returnId : null
    })
    // 获取对应的 5 个 client user name
    const associatedUserNames = audioPidsToCreate.map((audioId) => {
      const producerClient = client.room?.clients.find(c => c?.producer?.audio?.id === audioId)
      const returnName = producerClient?.userName
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
  socket.on(CLIENT_REQ.CONNECT_TRANSPORT, async ({dtlsParameters, type, audioPid}, ack) => {
    if (type === 'producer') {
      try {
        await client.upstreamTransport!.connect({dtlsParameters})
        ack("success")
      } catch (err) {
        console.log(err)
        ack("error")
      }
    } else if (type === 'consumer') {
      try {
        const downstreamTransport = client.downstreamTransports.find(
          t => t.associatedAudioPid === audioPid
        )
        await downstreamTransport?.transport?.connect({dtlsParameters})
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
      if (kind === 'audio') {
        // 新 produce 对象需要加入 最近发言人列表
        client.room!.activeSpeakerList.push(newProducer.id)
      }
      ack(newProducer.id)
    } catch (err) {
      console.log(err)
      ack("error")
    }
    // 通知房间其他人需要接收
    const newTransportsByPeer = await updateActiveSpeakers(client.room!, socket)
    // 找到 socket 发送 NEW_PRODUCER 消息
    for (const [socketId, audioPidsToCreate] of newTransportsByPeer.entries()) {
      console.log(socketId, audioPidsToCreate)
      const videoPidsToCreate = audioPidsToCreate.map(aPid => {
        const producerClient = client.room!.clients.find(c => c.producer?.audio?.id == aPid)
        const returnId = producerClient?.producer?.video?.id
        return returnId ? returnId : null
      })
      const associatedUserNames = audioPidsToCreate.map(aPid => {
        const producerClient = client.room!.clients.find(c => c.producer?.audio?.id == aPid)
        const returnName = producerClient?.userName
        return returnName ? returnName : null
      })
      io.to(socketId).emit(SERVER_REQ.NEW_PRODUCER, {
        routerRtpCapabilities: client.room!.router!.rtpCapabilities,
        audioPidsToCreate,
        videoPidsToCreate,
        associatedUserNames,
        activeSpeakerList: client.room!.activeSpeakerList.slice(0, 5)
      })
    }
  })

  // 处理关闭, 打开音频
  socket.on(CLIENT_REQ.AUDIO_CHANGE, async ({type}) => {
    if (type === 'mute') {
      client?.producer?.audio?.pause()
    } else {
      client?.producer?.audio?.resume()
    }
  })

  // consume media
  socket.on(CLIENT_REQ.CONSUME_MEDIA, async({rtpCapabilities,pid, kind}, ack) => {
    // video & audio
    logger.info(`kind: ${kind}, pid: ${pid}`)

    // 判断能不能 consume
    // TODO 需要判断 Room-Client-Producer-kind-pid 是否存在, 有断开可能性
    if (!client.room!.router!.canConsume({producerId: pid, rtpCapabilities})) {
      ack("cannotConsume")
      return
    }

    const downStreamTransport = client.downstreamTransports.find(
        t => {
          if (kind === 'audio') {
            return t.associatedAudioPid === pid
          } else if (kind === 'video') {
            return t.associatedVideoPid === pid
          } else {
            return false
          }
        }
    )
    if (!downStreamTransport) {
      logger.error(`pid ${pid}, kind ${kind} downstreamTransport 未找到`)
      ack("cannotFindTransport")
      return
    }

    try {
      const newConsumer = await downStreamTransport.transport.consume({
        producerId: pid,
        rtpCapabilities,
        paused: true,   // 最佳实践 paused
      })

      client.addConsumer(kind, newConsumer, downStreamTransport)

      let consumerParams = {
        id: newConsumer.id,
        producerId: pid,
        kind: newConsumer.kind,
        rtpParameters: newConsumer.rtpParameters,
      }
      ack(consumerParams)
    } catch (err) {
      console.log(err)
      ack("error")
    }
  })

  // consume unpause
  socket.on(CLIENT_REQ.CONSUME_UNPAUSE, async({pid, kind}, ack) => {
    const downStreamTransport = client.downstreamTransports.find(
      t => {
        if (kind === 'audio') {
          return t.associatedAudioPid === pid
        } else if (kind === 'video') {
          return t.associatedVideoPid === pid
        } else {
          return false
        }
      }
    )
    if (!downStreamTransport) {
      ack('cannotFindTransport')
      return
    }
    if (kind === 'audio') {
      await downStreamTransport.audio?.resume()
      ack('success')
      return
    } else if (kind === 'video') {
      await downStreamTransport.video?.resume()
      ack('success')
      return
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
