
let socket = null
let device = null

function initConnect() {
  socket = io("https://localhost:3030")
  connectButton.innerHTML = "connecting..."
  connectButton.disabled = true
  addSocketListeners()
}

function addSocketListeners() {
  socket.on('connect', () => {
    connectButton.innerHTML = "connected"
    deviceButton.disabled = false
  })
}

async function deviceSetup() {
  device = new mediasoupClient.Device()
  const routerRtpCapabilities =  await socket.emitWithAck('getRtpCap')
  console.log(routerRtpCapabilities)
  await device.load({routerRtpCapabilities})
  console.log(device.loaded)
}