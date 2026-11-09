# Websocket
- WebSocket 是 HTML5 开始提供的一种在单个 TCP 连接上进行全双工通讯的协议
- WebSocket 使得客户端和服务器之间的数据交换变得更加简单，允许服务端主动向客户端推送数据。
- 在 WebSocket API 中，浏览器和服务器只需要完成一次握手，两者之间就直接可以创建持久性的连接，并进行双向数据传输。
- 在 WebSocket API 中，浏览器和服务器只需要做一个握手的动作，然后，浏览器和服务器之间就形成了一条快速通道。两者之间就直接可以数据互相传送。
- 现在，很多网站为了实现推送技术，所用的技术都是 Ajax 轮询。
  - 轮询是在特定的的时间间隔（如每1秒），由浏览器对服务器发出HTTP请求，然后由服务器返回最新的数据给客户端的浏览器。
  - 这种传统的模式带来很明显的缺点，即浏览器需要不断的向服务器发出请求，然而HTTP请求可能包含较长的头部，
  - 其中真正有效的数据可能只是很小的一部分，显然这样会浪费很多的带宽等资源。
- HTML5 定义的 WebSocket 协议，能更好的节省服务器资源和带宽，并且能够更实时地进行通讯。


浏览器通过 JavaScript 向服务器发出建立 WebSocket 连接的请求，连接建立以后，客户端和服务器端就可以通过 
TCP 连接直接交换数据。
当你获取 Web Socket 连接后，你可以通过 send() 方法来向服务器发送数据，并通过 onmessage 事件来接收服务 
器返回的数据。
以下 API 用于创建 WebSocket 对象。
var Socket = new WebSocket(url, [protocol] );
以上代码中的第一个参数 url, 指定连接的 URL。第二个参数 protocol 是可选的，指定了可接受的子协议。



Socket.readyState

只读属性 readyState 表示连接状态，可以是以下值：
0 ­ 表示连接尚未建立。
1 ­ 表示连接已建立，可以进行通信。
2 ­ 表示连接正在进行关闭。
3 ­ 表示连接已经关闭或者连接不能打开。

Socket.bufferedAmount

只读属性 bufferedAmount 已被 send() 放入正在队列中等待传输，但是还没有 
发出的 UTF­8 文本字节数。



open Socket.onopen 连接建立时触发
message Socket.onmessage 客户端接收服务端数据时触发 
error Socket.onerror 通信发生错误时触发
close Socket.onclose 连接关闭时触发


Socket.send() 使用连接发送数据

Socket.close() 关闭连接



为了建立一个 WebSocket 连接，客户端浏览器首先要向服务器发起一个 HTTP 请求，这个请求和通常的 HTTP 请求 
不同，包含了一些附加头信息，其中附加头信息"Upgrade: WebSocket"表明这是一个申请协议升级的 HTTP 请求， 
服务器端解析这些附加的头信息然后产生应答信息返回给客户端，客户端和服务器端的 WebSocket 连接就建立起来 
了，双方就可以通过这个连接通道自由的传递信息，并且这个连接会持续存在直到客户端或者服务器端的某一方主动 
的关闭连接


cd 工程目录
# 此刻我们需要执行命令：
sudo npm init 
#创建package.json文件，系统会提示相关配置，也可以使用命令： 
sudo npm init ‐y
sudo npm install nodejs‐websocket


（1）如何创建websocket服务器，通过createServer和listen接口； 
（2）如何判断有新的连接进来，createServer的回调函数判断； 
（3）如何判断关闭事件，通过on("close", callback) 事件的回调函数； 
（4）如何判断接收到数据，通过on("text", callkback)事件的回调函数； 
（5）如何判断接收异常，通过on("error", callkback)事件的回调函数； 
（6）如何主动发送数据，调用sendText 