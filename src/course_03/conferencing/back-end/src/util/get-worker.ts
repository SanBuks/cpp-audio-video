import type { Worker } from 'mediasoup/types'
import { Logger, getLogger } from '@/util/get-logger.js'

const logger: Logger = getLogger();

export async function getWorker(workers: Worker[]): Promise<Worker> {
  if (workers.length === 0) {
    throw new Error('getWorker(): 没有 worker')
  }
  if (workers.length === 1)  {
    return workers[0]
  }

  const results = await Promise.allSettled(
    workers.map(async worker => {
      // 获取每个子进程使用 cpu 资源统计
      const stats = await worker.getResourceUsage()
      return stats.ru_utime + stats.ru_stime
    })
  )

  let leastLoadedWorker = -1;
  let leastWorkerLoad = Infinity

  // 找最低的子进程
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status !== 'fulfilled') {
      logger.warn(`getWorker: worker[${i}] getResourceUsage 调用失败`, r.reason)
      continue
    }
    if (r.value < leastWorkerLoad) {
      leastWorkerLoad = r.value
      leastLoadedWorker = i
    }
  }
  return workers[leastLoadedWorker === -1 ? 0 : leastLoadedWorker]
}
