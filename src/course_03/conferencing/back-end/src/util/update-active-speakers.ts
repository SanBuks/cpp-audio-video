import { Logger, getLogger } from '@/util/get-logger.js'
import { Room } from "@/model/Room.js";
import { Socket } from "socket.io";
import { SERVER_REQ } from "@/constant/signaling-msg.js";
import { NewTransportsByPeer } from "@/type/common-type.js";

const logger: Logger = getLogger();

/**
 * 更新最近发言人列表
 *  1. 新主讲人事件 触发
 *  2. 新 producer 产生而且最近发言人列表数量少于 5 触发
 * 恢复 最近发言人列表 中 producer
 * 创建新 transport
 * @param room 房间对象
 * @param socket 连接
 * @return NewTransportsByPeer 需要建立的连接信息
 */
export async function updateActiveSpeakers(room: Room, socket: Socket): Promise<NewTransportsByPeer> {
  // 发言人
  const activeSpeakers = room.activeSpeakerList.slice(0, 5)  // all-client unmute producer, unpause consumer
  // 屏蔽发言人
  const mutedSpeakers = room.activeSpeakerList.slice(5)      // all-client mute producer, pause consumer

  // 需要建立的连接信息
  const newTransportsByPeer: NewTransportsByPeer = new Map<string, string[]>()

  // 更新所有连接的客户端
  room.clients.forEach((client) => {

    // 遍历需要屏蔽发言的列表
    mutedSpeakers.forEach((pid) => {
      // 找到对象, 停止 producer
      if (client?.producer?.audio?.id === pid) {
        client?.producer?.audio.pause()
        client?.producer?.video?.pause()
        return  // 找到对象 producer, 直接返回不需要 consumer
      }
      // 找到对象, 停止 consumer
      const downstreamToStop = client.downstreamTransports.find(t => t?.associatedAudioPid === pid)
      if (downstreamToStop) {
        downstreamToStop.audio?.pause()
        downstreamToStop.video?.pause()
      }
      // 没找到说明没有订阅过直接忽视
    })

    // 需要订阅的 consume 对象 video pid
    const newSpeakersToThisClient: string[] = []
    // 遍历需要开启发言的列表
    activeSpeakers.forEach((pid) => {
      if (client?.producer?.audio?.id === pid) {
        client?.producer?.audio.resume()
        client?.producer?.video?.resume()
        return
      }
      const downstreamToStart = client.downstreamTransports.find(t => t?.associatedAudioPid === pid)
      if (downstreamToStart) {
        downstreamToStart.audio?.resume()
        downstreamToStart.video?.resume()
      } else {
        // 需要重新创建 consume pid
        newSpeakersToThisClient.push(pid)
      }
    })
    // 更新 newTransportsByPeer
    if (newSpeakersToThisClient.length > 0) {
      newTransportsByPeer.set(client.socket.id, newSpeakersToThisClient)
    }
  })
  // 最后处理新 consume 问题
  // 客户端更新信息
  socket.to(room.roomName).emit(SERVER_REQ.UPDATE_ACTIVE_SPEAKER, activeSpeakers)
  return newTransportsByPeer
}
