const os = require('os')
const mediasoup = require('mediasoup')
const config = require('./config/config')

const totalThreads = os.cpus().length

const createWorkers = async () => new Promise(async (resolve, reject)=>{
  let workers = []
  for (let i = 0; i < totalThreads; ++i) {
    let worker = await mediasoup.createWorker({
      logLevel: config.workerSettings.logLevel,
      rtcMaxPort: config.workerSettings.rtcMaxPort,
      rtcMinPort: config.workerSettings.rtcMinPort,
    })
    worker.on('died', () => {
      // mediasoup 规定 其中一个 worker 挂了, 程序直接退出
      console.log('worker has died!')
      process.exit(1)
    })
    workers.push(worker)
  }
  resolve(workers)
})

module.exports = createWorkers