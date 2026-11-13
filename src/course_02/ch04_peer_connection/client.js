"use strict";

let logBox = null;      // 控制台
let myHostname = null;  // 域名
let myUsername = null;
let websock = null;     // WebSocket
let clientID = 0;
let pc = null;          // local RTCPeerConnection

let transceiver = null;
let webcamStream = null;
let targetUsername = null;

// 打印信息到页面控制台
function print2Html(type, text) {
  const time = new Date();
  const p = document.createElement('p');
  p.className = type;
  p.textContent = `[${time.toLocaleTimeString()}] ${text}`;
  logBox.appendChild(p);
  logBox.scrollTop = logBox.scrollHeight - logBox.clientHeight;
}

function log(text) {
  print2Html(null, text);
  console.log(text);
}

function warn(text) {
  print2Html('warn', text);
  console.log(text);
}

function error(text) {
  print2Html('error', text);
  console.error(text);
}

// 发送 websocket 报文
// message: { ..., type }
function sendToServer(msg) {
  const msgJSON = JSON.stringify(msg);

  log("Sending '" + msg.type + "' message: " + msgJSON);
  websock.send(msgJSON);
}

window.onload = () => {
  logBox = document.querySelector(".logbox");
  if (!logBox) {
    console.error('get logbox error!');
  }
  myHostname = window.location.hostname;
  if (!myHostname) {
    myHostname = "localhost";
  }
  log("Hostname: " + myHostname);
  console.log('document loaded');
}

function connect() {
  let scheme = document.location.protocol === "https:" ? "wss" : "ws";
  const serverUrl = scheme + "://" + myHostname + ":6503";

  log(`Connecting to server: ${serverUrl}`);
  try {
    websock = new WebSocket(serverUrl, "json");
  } catch(err) {
    error(`建立连接错误, 请重新刷新页面`);
    return;
  }

  websock.onerror = (evt) => {
    console.dir(evt);
  }
  websock.onmessage = (evt) => {
    console.log(evt);

    const msg = JSON.parse(evt.data);
    log("Message received: " + evt.data);

    let text = "";
    const time = new Date(msg.date);
    const timeStr = time.toLocaleTimeString();

    switch (msg.type) {
      case "id": {
        clientID = msg.id;
        setUsername();
        break;
      }
    }
  }
}

// 给服务发送 用户名
function setUsername() {
  myUsername = document.getElementById("name").value;

  sendToServer({
    name: myUsername,
    date: Date.now(),
    id: clientID,
    type: "username"
  });
}

