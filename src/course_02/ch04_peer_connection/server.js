"use strict";

const http = require('http');
const https = require('https');
const fs = require('fs');
const yargs = require('yargs');
const log4js = require('log4js');
const WebSocketServer = require('websocket').server;

// 信令类别
const SIGNAL_CONNECT_ID = "id";
// 非重命名后缀
let appendToMakeUnique = 1;


// 配置日志库
log4js.configure('./log4js.json')
const logger = log4js.getLogger();

// 解析命令行
const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 123')
  .version('WebRTC Server 0.1')
  .help()
  .option('cert', {
    alias: 'c',
    demandOption: false,
    describe: 'ssl certificate file',
    type: 'string',
  })
  .option('key', {
    alias: 'k',
    demandOption: false,
    describe: 'ssl certificate key file',
    type: 'string',
  })
  .parse()
// 读取证书路径
let certPath = null;
if (argv.cert && argv.key) {
  certPath = {
    certFilePath: argv.cert,
    keyFilePath: argv.key
  }
  logger.info('use cert file: ' + certPath.certFilePath);
  logger.info('use key file: ' + certPath.keyFilePath);
}

// 读取证书内容
let certFile = {
  cert: null,
  key: null
};
if (certPath) {
  try {
    certFile.cert = fs.readFileSync(certPath.certFilePath)
    certFile.key = fs.readFileSync(certPath.certKeyPath)
  } catch (err) {
    certFile.cert = null;
    certFile.key = null;
  }
}

// 禁止 http 访问回调
function handleWebRequest(request, response) {
  logger.info("Received request for " + request.url);
  response.writeHead(404);
  response.end();
}

// 创建 web 服务器
let webServer = null;
try {
  if (certFile.key && certFile.cert) {
    webServer = https.createServer(certFile, handleWebRequest);
    logger.info('创建 https 服务');
  } else {
    webServer = http.createServer({}, handleWebRequest);
    logger.info('创建 http 服务');
  }
} catch (err) {
  logger.error(`创建 web 服务器错误: ${err}`);
  return;
}
// web 服务监听端口
webServer.listen(6503, () => logger.info("Server is listening on port 6503"));
// 创建 WebSocket 服务
const wsServer = new WebSocketServer({
  httpServer: webServer,
  autoAcceptConnections: false
});
if (!wsServer) {
  logger.error("ERROR: 无法创建 Websocket 服务!");
}

let connectionArray = []; // 连接池
let nextID = 0;           // 用户连接 ID

wsServer.on('request', (request) => {
  // accept 连接, 塞入连接池
  let conn = request.accept("json", request.origin);
  logger.info("Connection accepted from " + conn.remoteAddress + ".");
  connectionArray.push(conn);
  // 增加 clientID 属性
  conn.clientID = nextID;
  nextID++;

  // 发送客户端 连接信息
  let msg = {
    type: SIGNAL_CONNECT_ID,
    id: conn.clientID
  };
  conn.sendUTF(JSON.stringify(msg));

  conn.on('message', (message) => {
    logger.info(`Received Message: ${message}`)
    if (message.type !== 'utf8') {
      logger.error(`接收信息类型不是 utf8; ${message}`);
      return;
    }

    logger.info("Received Message utf8 Data: " + message.utf8Data);
    let sendToClients = true;  // 是否转发给其他连接
    msg = JSON.parse(message.utf8Data);
    let connect = getConnectionForID(msg.id);

    switch(msg.type) {
      case "message": { // 转发消息
        msg.name = connect.username;
        msg.text = msg.text.replace(/(<([^>]+)>)/ig, "");  // TODO ?
        break;
      }
      case "username": { // 业务处理
        let nameChanged = false;
        let origName = msg.name
        // 循环直到 不重名
        while (!isUsernameUnique(msg.name)) {
          msg.name = origName + appendToMakeUnique;
          appendToMakeUnique++;
          nameChanged = true;
        }
        if (nameChanged) {
          let changeMsg = {
            id: msg.id,
            type: "rejectusername",
            name: msg.name
          };
          connect.sendUTF(JSON.stringify(changeMsg));
        }
        connect.username = msg.name;
        sendUserListToAll();
        sendToClients = false;  // We already sent the proper responses
        break;
      }
      default:
    }

    if (!sendToClients) return ;

    let msgString = JSON.stringify(msg);
    let i;
    if (msg.target && msg.target.length !== 0) {
      sendToOneUser(msg.target, msgString);
    } else {
      for (i = 0; i < connectionArray.length; i++) {
        connectionArray[i].sendUTF(msgString);
      }
    }
  })

  conn.on('close', (reason, description) => {
    // 删除 断开的连接
    connectionArray = connectionArray.filter((el, idx, ar) => {
      return el.connected;
    });

    // 重新更新用户列表
    sendUserListToAll();
    let logMessage = "Connection closed: " + conn.remoteAddress + " (" + reason;
    if (description !== null && description.length !== 0) {
      logMessage += ": " + description;
    }
    logMessage += ")";
    log(logMessage);
  });
});

// 根据 用户端ID 遍历从连接池查找连接
function getConnectionForID(id) {
  let connect = null;
  for (let co of connectionArray) {
    if (co.clientID === id) {
      connect = co;
       break;
    }
  }
  return connect;
}

// 根据 用户名称 遍历从连接池查找连接
function isUsernameUnique(name) {
  let isUnique = true;
  for (let co of connectionArray) {
    if (co.username === name) {
      isUnique = false;
      break;
    }
  }
  return isUnique;
}

// 将用户列表发给所有 连接的用户
function sendUserListToAll() {
  let userListMsg = makeUserListMessage();
  let userListMsgStr = JSON.stringify(userListMsg);
  for (let co of connectionArray) {
    co.sendUTF(userListMsgStr);
  }
}

// 构建用户列表
function makeUserListMessage() {
  let userListMsg = {
    type: "userlist",
    users: []
  };
  for (let co of connectionArray)
    userListMsg.users.push(co.username);
  return userListMsg;
}

// 发送给目标连接
function sendToOneUser(target, msgString) {
  let i = 0;

  for (; i<connectionArray.length; i++) {
    if (connectionArray[i].username === target) {
      connectionArray[i].sendUTF(msgString);
      break;
    }
  }
}

