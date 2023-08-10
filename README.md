# icekr-reader

这个仓库包含了一个简洁的阅读器，可以从 [冰氪漫画（icekr）](https://www.icekr.com) 中获取图片并提供更好的阅读体验。

## 用途

- 可以从冰氪漫画网站中获取图片，并提供更好的阅读体验。
- 可以通过本地服务器实现图片的发送和跳转到下一话的命令。

## 用法

1. 下载并安装 Node.js，可以从 [官网](https://nodejs.org) 中获取。
2. 在命令行中进入到本软件的文件夹，并运行 `npm install` 命令，安装所需的依赖。
3. 运行 `node server.js` 命令，启动 HTTP 服务器。
4. 使用用户脚本管理器，安装用户脚本。
5. 打开任意冰氪漫画的具体阅读页面（不是详情页），并在 URL 前面添加 `http://localhost:8080/`。
6. 打开浏览器中的 localhost:8080，即可使用阅读器。

### 自定义 favicon

你可以通过`--favicon`标志来设置自定义的 favicon。下面是一些可能的用法：

- 禁用 favicon：`npm run start -- --favicon disable` 或 `./manga-reader --favicon disable`
- 使用本地文件作为 favicon：`npm run start -- --favicon /path/to/your/favicon.png`
- 使用网络地址作为 favicon：`npm run start -- --favicon https://example.com/favicon.png`

如果没有提供 `--favicon`标志，或者提供的路径不存在，系统将默认使用 `https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/f1a996fc1f45497819f261965f897780_syeAMS9yEl.png`。

### HTTP Strict Transport Security (HSTS)

如果你的请求头包含 `.serveo.net`，系统将默认启用 HSTS，并将 'max-age' 设置为 15552000 并包括所有子域。如果你想禁用 HSTS，你可以使用 `--disableHSTS` 标志。

### Serveo

如果你想禁用 Serveo，你可以使用 `--disableServeo` 标志。

### 自定义端口

你可以通过 `--port` 标志来自定义服务的端口。例如，如果你想要服务运行在 3000 端口，你可以使用以下命令：`npm run start -- --port 3000`。如果没有提供 `--port` 标志，系统将默认使用 8080 端口。

## 注意事项

- 请确保已经安装了 Node.js。
- 使用阅读器时，请打开具体阅读页面，而不是漫画的详情页。
- 请在本地服务器运行后，再打开浏览器并使用阅读器。

## 其他

本软件使用 MIT license，可以在仓库中查看详细信息。

### 常见报错

- 服务器无法启动：
    - 请确认已经安装了 Node.js。
    - 请确认已经运行了 `npm install` 命令。
    - 请确认当前目录是否包含 server.js 文件。
- 图片无法加载：
    - 请确认已经打开了冰氪漫画的具体阅读页面。
    - 请确认已经启动了本地服务器。
    - 请确保网络连接正常。

### 安装 Node.js

1. 打开 [官网](https://nodejs.org)，点击“Download”。
2. 选择适合自己操作系统的版本，下载并安装。
3. 在命令行中输入 `node -v`，确认 Node.js 已经成功安装。
