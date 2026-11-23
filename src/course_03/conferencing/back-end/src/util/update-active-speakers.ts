import { Logger, getLogger } from '@/util/get-logger.js'
import { Room } from "@/model/Room.js";
import { Socket } from "socket.io";

const logger: Logger = getLogger();

/**
 * 更新最近发言人列表
 *  1. 新主讲人事件 触发
 *  2. 新 producer 产生而且最近发言人列表数量少于 5 触发
 * 恢复 最近发言人列表 中 producer
 * 创建新 transport
 */
export async function updateActiveSpeakers(room: Room, socket: Socket): Promise<void> {
  // 发言人
  const activeSpeakers = room.activeSpeakerList.slice(0, 5)  // all-client unmute producer, unpause consumer
  // 屏蔽发言人
  const mutedSpeakers = room.activeSpeakerList.slice(5)      // all-client mute producer, pause consumer

  const newTransportsByPeer = {}

  // 更新所有连接的客户端
  room.clients.forEach((client) => {

    // 遍历需要屏蔽发言的列表
    mutedSpeakers.forEach((pid) => {
      // 找到屏蔽对象 producer 停止
      if (client?.producer?.audio?.id === pid) {
        client?.producer?.audio.pause()
        client?.producer?.video?.pause()
      }
      // 找到需要停止的接收
      const downstreamToStop = client.downstreamTransports.find(t => t?.audio?.producerId === pid)
      if (downstreamToStop) {
        downstreamToStop.audio?.pause()
        downstreamToStop.video?.pause()
      }
      // 没找到说明没有订阅过直接忽视
    })

    // 当前客户端没有创建 consume 对象
    const newSpeakersToThisClient = []

    // 遍历需要开启发言的列表
    activeSpeakers.forEach((pid) => {
    })
  })
}
