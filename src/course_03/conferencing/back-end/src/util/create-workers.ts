import os from 'node:os'
import mediasoup from 'mediasoup'
import type { Worker } from 'mediasoup/types'

export async function createWorkers(): Promise<Worker[]> {
  const workers: Worker[] = []
  const numCpus = os.cpus().length

  for (let i = 0; i < numCpus; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort: 20000,
      rtcMaxPort: 20200,
    })
    worker.on('died', (error) => {
      console.error('mediasoup worker died:', error)
      setTimeout(() => process.exit(1), 2000)
    })
    workers.push(worker)
  }
  return workers
}
