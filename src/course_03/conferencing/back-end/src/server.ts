import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import express from 'express'
import * as mediasoup from 'mediasoup'
import type { Worker, Router } from 'mediasoup/types'
import { Server } from 'socket.io'

import { createWorkers } from './util/create-workers.js'
import { config } from './config/config.js'
import { MSG } from './constant/signaling-msg.js'


const app = express()

// 读取 ca 证书, 通过 express 创建 https 服务

// TODO 待验证, 证书路径:用 process.cwd() 而不是相对模块路径，避免编译到 dist 后找不到
const key = fs.readFileSync(path.resolve(process.cwd(), 'config/cert.key'))
const cert = fs.readFileSync(path.resolve(process.cwd(), 'config/cert.crt'))
const options = {key, cert}
const httpsServer = https.createServer(options, app)
// const key = fs.readFileSync('./config/cert.key')
// const cert = fs.readFileSync('./config/cert.crt')

let workers: Worker[] | null = null
let router: Router | null = null

// 初始化 mediasoup
const initMediasoup = async () : Promise<void> => {
  workers = await createWorkers()
  router = await workers[0]!.createRouter({
    mediaCodecs: config.routerMediaCodecs
  })
}

initMediasoup()

// ---- Socket.IO 事件类型 ----
interface ClientToServerEvents {
  [MSG.JOIN_ROOM]: (
    data: { roomId: string; username: string },
    ack: (res: { ok: boolean; error?: string }) => void
  ) => void
  [MSG.LEAVE_ROOM]: (data: { roomId: string }, ack?: () => void) => void
  // 后续按需补充 produce / consume / transport 事件
}

interface ServerToClientEvents {
  // 例如：'new-producer': (data: { producerId: string }) => void
}

interface InterServerEvents {}

interface SocketData {
  roomId?: string
  username?: string
}

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpsServer, {
  cors: {
    origin: [`https://${config.ip}:${config.port}`],
  },
})

io.on('connect', socket => {

})
// // 通过 https 服务 创建 socketio
// const io = socketio(httpsServer, {
//   cors: [
//     `https://${config.ip}:${config.port}`
//   ]
// })


httpsServer.listen(config.port)


// ---- 启动流程：先初始化 mediasoup，再监听 ----
async function main(): Promise<void> {
  await initMediasoup()

  httpsServer.listen(config.port, () => {
    console.log(`Signaling server: https://${config.ip}:${config.port}`)
  })
}

main().catch((err) => {
  console.error('Failed to start signaling server:', err)
  process.exit(1)
})

