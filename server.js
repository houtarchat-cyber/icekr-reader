const http = require('http');
const dns = require('dns');
const Client = require("ssh2").Client;
const Socket = require("net").Socket;
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

async function getInfo(url) {
    try {
        const response = await axios.get(url, {
            httpAgent: new http.Agent({
                lookup: (hostname, options, callback) => {
                    if (hostname == 'www.xlsmh.com') {
                        return callback(null, '8.210.86.198', 4);
                    }
                    return dns.lookup(hostname, options, callback);
                },
            }),
        });
        if (response.status !== 200) {
            console.error(`Failed to get ${url}. Status code: ${response.status}`);
            return await getInfo(url);
        }
        html = response.data.split('\n');
        const regex = /var (.*?) = (.*?);/gs;
        let match;
        let jsData = {};
        let data;
        if (url.includes('xlsmh')) {
            data = html[19];
        } else {
            data = html[38];
        }
        while ((match = regex.exec(data)) !== null) {
            const key = match[1];
            const value = match[2].replace(/'/g, '"');
            try {
                jsData[key] = JSON.parse(value);
            } catch (e) {
                console.error(`Failed to parse value for variable '${key}'. Error: ${e}`);
            }
        } if ((match = /SinTheme\.initChapter\(\d+,"(.*?)",\d+,"(.*?)"\);/s.exec(html)) !== null) {
            jsData.title = (`${match[1]} - ${match[2]}`)
                // 先将“话”字全部替换为“回”
                .replace(/话/g, '回')
                // 再将符合“...回”的字符串替换为“...话”
                .replace(/[一二三四五六七八九十百千万亿\d]+回/g, (match) => {
                    return match.replace('回', '话');
                });
        }
        return jsData;
    } catch (error) {
        console.error(error);
        return await getInfo(url);
    }
}

const getDataPath = filename =>
    path.join(
        process.pkg ?
            __dirname :
            process.cwd(),
        filename);

const argv = yargs(hideBin(process.argv)).argv;

// 创建 HTTP 服务器
const httpServer = http.createServer();

// 读取文件
let indexHtml = fs.readFileSync(getDataPath('general.html'), 'utf8').toString();
let currentChapter;

// 当 HTTP 服务器接收到请求时触发
httpServer.on('request', async (request, response) => {
    if (!argv.disableServeo && request.headers.host.endsWith('.serveo.net')) {
        if (argv.disableHSTS) {
            response.setHeader('Strict-Transport-Security', 'max-age=0');
            console.warn('HSTS is disabled. This is not recommended and may cause security issues.');
        } else {
            response.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
            // 检查 'secure' cookie
            if (!/(?<=secure=)[^;]*/.test(request?.headers?.cookie)) {
                // 如果 cookie 不存在，重定向到 HTTPS 并设置 'secure' cookie
                response.writeHead(301, {
                    'Location': 'https://' + request.headers.host + request.url,
                    'Set-Cookie': 'secure=1; HttpOnly'
                });
                response.end();
                return;
            }
        }
    }
    if (request.method === 'OPTIONS') {
        response.writeHead(204, {
            'Access-Control-Allow-Methods': 'OPTIONS, GET',
            'Access-Control-Max-Age': 2592000, // 30 days
        });
        response.end();
        return;
    }
    if (request.url === '/favicon.ico') {
        const [faviconUrl, code] = (() => {
            if (argv.favicon === 'disable') {
                console.log('Favicon disabled. You can use --favicon to set a custom favicon or empty --favicon to use the default favicon.');
                return [Buffer.from('R0lGODlhAQABAAAAACwAAAAAAQABAAA=', 'base64'), 200];
            }

            if (argv.favicon) {
                console.log('Using custom favicon');
                if (fs.existsSync(argv.favicon)) {
                    return [fs.readFileSync(argv.favicon), 200];
                } else if (argv.favicon.startsWith('http')) {
                    return [argv.favicon, 301];
                } else {
                    console.error('Custom favicon not found, using default favicon');
                }
            }

            return ['https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/f1a996fc1f45497819f261965f897780_syeAMS9yEl.png', 301];
        })();
        if (code === 301) {
            response.writeHead(code, {
                'Location': faviconUrl,
            });
            response.end();
        } else {
            response.writeHead(code, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS, GET',
                'Access-Control-Max-Age': 2592000, // 30 days
            });
            response.end(faviconUrl);
        }
        return;
    }
    console.log('Received request from client: ', request.url);
    if (request.url === '/get_next_page') {
        currentChapter = await getInfo(currentChapter.nextChapterData.url);
        response.writeHead(200, {
            'Content-Type': 'text/json;charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, GET',
            'Access-Control-Max-Age': 2592000, // 30 days
        });
        response.end(JSON.stringify([
            currentChapter.title,
            currentChapter.chapterImages,
        ]));
        return;
    }
    if (request.url.startsWith('/https://')) {
        const url = request.url.slice(1);
        const data = await getInfo(url);
        if (data) {
            currentChapter = data;
        }
        response.writeHead(200, {
            'Content-Type': 'text/plain;charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, GET',
            'Access-Control-Max-Age': 2592000, // 30 days
        });
        response.end(`已设置为 ${data.title}`);
        return;
    }
    try {
        if (!currentChapter) {
            throw new Error('未设置章节信息');
        }

        // 设置响应头
        response.writeHead(200, {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, GET',
            'Access-Control-Max-Age': 2592000, // 30 days
        });

        // 替换响应内容中的变量
        // 返回响应
        let text = indexHtml
            .replace('Manga Reader', currentChapter.title)
            .replace('$resText', JSON.stringify(currentChapter.chapterImages));

        response.end(text);
    } catch (err) {
        // 设置响应头
        response.writeHead(500, {
            'Content-Type': 'text/html;charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, GET',
            'Access-Control-Max-Age': 2592000, // 30 days
        });

        // 返回响应
        const text = `
            <button id="refresh-page">刷新本地网页</button>
            <script>
                // 获取按钮元素
                const refreshPageButton = document.getElementById('refresh-page');
            
                // 为按钮绑定事件处理函数
                refreshPageButton.addEventListener('click', () => {
                    // 刷新本地网页
                    window.location.reload();
                });
            </script>
        `;
        response.end(`服务器内部错误：${err.message}<br><br>${text}`);
    }
});


// 监听 port 端口
const port = argv.port ?? 8080;
httpServer.listen(port, () => {
    console.log("==========================================");
    console.log("Server Status:");
    console.log("==========================================");
    console.log("The server is currently up and running.");
    console.log(`It is listening for incoming connections on port ${port}.`);
    console.log();
    console.log("You can connect to the server using the following addresses:");
    const addressesMessage = [
        "1. Localhost Address: ",
        "2. Local Network Address: "
    ]
    Object.values(os.networkInterfaces())
        .flat()
        .filter(iface => iface.family === 'IPv4')
        .map((iface, index) => [addressesMessage[index], iface.address])
        .slice(0, 2)
        .forEach(ip => console.log(`${ip[0]}http://${ip[1]}:${port}/`));

    if (argv.disableServeo) {
        console.log();
        console.log("Serveo is currently disabled.");
        console.log("You can enable Serveo by removing the --disableServeo flag.");
        console.log();
        console.log("Please choose the address that is most appropriate for your needs.");
        console.log("==========================================");
    } else {
        // 创建一个新的 Socket 并设置错误处理
        const createSocket = reject => {
            const srcSocket = new Socket();
            srcSocket.on('error', () => {
                if (!srcSocket.remote) reject();
                else srcSocket.remote.end();
            });
            return srcSocket;
        }

        const maxReconnectTries = 10;
        const maxReconnectInterval = 60000; // 1 minute

        const connect = conn => {
            try {
                conn.connect({
                    host: 'serveo.net',
                    username: os.userInfo().username,
                    tryKeyboard: true,
                    keepaliveInterval: 60 * 1000, // 防止连接断开, 单位为毫秒
                });
            } catch (err) {
                console.error(err);
                reconnect(conn);
            }
        }

        const reconnect = conn => {
            try {
                console.log('与远程服务器的连接已断开');
                conn.reconnectTries = conn.reconnectTries ?? 0;
                if (conn.reconnectTries >= maxReconnectTries) {
                    console.error('已达到最大重连次数, 停止尝试');
                    return;
                }
                conn.reconnectTries++;
                setTimeout(() => {
                    connect(conn);
                }, Math.min(1000 * Math.pow(2, conn.reconnectTries), maxReconnectInterval));
                console.log(`正在尝试重新连接到远程服务器... (第 ${conn.reconnectTries} 次)`);
            }
            catch (err) {
                console.log(err);
            }
        }

        // Create an SSH client
        const conn = new Client();

        connect(
            conn.on('ready', async () => {
                // 开始一个交互式 shell 会话
                conn.shell((err, stream) => {
                    if (err) {
                        console.error(err);
                        reconnect(conn);
                        return;
                    };
                    const ansiEscapeSequenceRegex = /\x1b\[\d+m/g;
                    stream.on('data', data => {
                        data = data.toString().replace(ansiEscapeSequenceRegex, '');
                        if (data === '') return;
                        if (data.startsWith('Forwarding')) {
                            console.log(`3. Public Address (via Serveo): ${data.split(' ').pop().slice(0, -2) + '/'}`);
                            console.log();
                            console.log("Please choose the address that is most appropriate for your needs.");
                            console.log("==========================================");
                            return;
                        }
                        console.log(data.slice(0, -2));
                    });
                })

                // 请求从远程服务器转发端口
                conn.forwardIn('LOCALHOST', 80, err => {
                    if (err) {
                        console.error(err);
                        reconnect(conn);
                        return;
                    }
                    conn.emit('forward-in', 80);
                });
            }).on('connect', () => {
                conn.reconnectTries = 0;
            }).on('close', () => {
                reconnect(conn);
            }).on('error', err => {
                console.error(err);
                reconnect(conn);
            }).on('end', () => {
                reconnect(conn);
            }).on('timeout', () => {
                reconnect(conn);
            }).on('tcp connection', (_, accept, reject) => {
                try {
                    const srcSocket = createSocket(reject);
                    srcSocket.connect(port, 'localhost', () => {
                        srcSocket.remote = accept();
                        srcSocket.pipe(srcSocket.remote).pipe(srcSocket);
                    });
                }
                catch (err) {
                    console.error(err);
                    reject();
                }
            })
        );
    }
});
