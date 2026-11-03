# 安装 Node.js
- 下载 fnm
- `.bashrc` 末尾追加 `eval "$(fnm env --use-on-cd)"`
- `source ~/.bashrc`
- `fnm install 14`
- `fnm use 14`

# 安装 Coturn
- 安装开发依赖 
  - `sudo apt install -y libssl‐dev`
  - `sudo apt install -y libevent‐dev`
  - `sudo apt install -y pkg-config`
- 解压源代码 `tar -zxvf coturn-docker-4.18.0-r0.tar.gz -C ./`
- 配置 `./configure`
- 构建 `make`
- 安装 `sudo make install`
- 测试
  - 启动服务 `sudo nohup turnserver -L 0.0.0.0 -a -u lqf:123456 -v -f -r nort.gov &`
  - 查看端口 `sudo lsof ‐i:3478`
  - 查看日志 `sudo tail -f nohup.out`
  - 测试网址 `https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/`
  - 测试 STUN `stun:192.168.10.113:3478` `lqf` `123456` all 模式
  - 测试 TURN `turn:192.168.10.113:3478` `lqf` `123456` all / relay 模式
