# AI 辩论平台 (AI Debate Arena)

一个基于 Vue 3 和 TypeScript 的 AI 辩论平台，支持两个 AI 角色就特定话题进行辩论，并通过语音合成实时播放辩论内容。该项目实现了语音播放优化，在一方语音播放时预先调用另一方的响应，提高用户体验。

## 功能特点

- 🤖 支持两个 AI 角色（正方和反方）进行辩论
- 🎯 用户可自定义辩论话题
- 🔄 自动轮流生成正反方观点
- 🔊 实时语音合成和播放
- ⚡ 预加载优化：在一方语音播放时预先调用另一方的响应
- 📱 响应式设计，适配不同设备

## 技术栈

- Vue 3 (使用 Composition API 和 <script setup> 语法)
- TypeScript
- Vite
- Axios (用于 API 请求)
- Web Audio API (用于音频处理和播放)
- WebSocket (用于实时语音合成)

大模型可以使用 Deepseek，语音部分使用 COZE 合成语音

## 安装

```
# 克隆项目
git clone <repository-url>
cd AIDebate

# 安装依赖
npm install

# 开发模式运行
npm run dev

```

## 环境变量配置

在项目根目录创建 .env 文件，配置以下环境变量
注意这个项目是在本地执行，在浏览器使用 API Key 直接拉取 API 执行 ，应用部署到公网上会泄漏 API Key.
大模型除了 deepseek、使用 kimi、豆包、openAI 都可以
语音模型因为豆包提供的角色音色丰富，所以采用豆包 tts ,相关文档和 API 参考 https://www.coze.cn/open/docs/developer_guides/tts_api

```
#正方API网址
VITE_POSITIVE_API_URL=https://api.deepseek.com
#正方API key
VITE_POSITIVE_API_KEY=your_api_key
#正方大模型
VITE_POSITIVE_MODEL=deepseek-chat
#反方API网址
VITE_NEGATIVE_API_URL=https://api.deepseek.com
#反方API key
VITE_NEGATIVE_API_KEY=your_api_key
#反方大模型
VITE_NEGATIVE_MODEL=deepseek-chat

#最大辩论轮数，默认为20
VITE_MAX_DEBATE_ROUNDS=20

#语音tts网址
VITE_WS_URL=wss://ws.coze.cn/v1/audio/speech
#语音tts API key
VITE_ACCESS_TOKEN=tts_api_key
#正方音色Id
VITE_POSITIVE_VOICE_ID=7426720361733062665
#反方音色Id
VITE_NEGATIVE_VOICE_ID=7468512265151758363
#是否启用语音
VITE_ENABLE_TEXT_TO_SPEECH=true

# 正方提示词配置
VITE_POSITIVE_PROMPT=你是持正方观点的人，正在与持反方观点的人抬杠讨论关于"{topic}"的话题。请用略带情绪化、坚定的口语风格回应，表达你的观点。回复要简短有力，像抬杠一样，每次回复不要超过3句话。请针对反方的观点进行反驳。
# 反正提示词配置
VITE_NEGATIVE_PROMPT=你是持反方观点的人，正在与持正方观点的人抬杠讨论关于"{topic}"的话题。请用略带挑衅、坚定的口语风格回应，表达你的反对观点。回复要简短有力，像抬杠一样，每次回复不要超过3句话。请针对正方的观点进行反驳。

```

## 使用指南

打开浏览器连接 http://localhost:5173/

1. 在输入框中输入辩论话题
2. 点击"开始聊天"按钮启动辩论
3. 正方 AI 将首先发表观点，并通过语音播放
4. 语音播放完成后，反方 AI 自动回应
5. 辩论将持续进行，直到达到配置的最大轮数
6. 随时可以点击"结束聊天"按钮停止辩论

## 高级功能

### 预加载优化

为了提高用户体验，项目实现了预加载优化功能：

- 在正方语音播放时，预先调用反方的响应生成
- 在反方语音播放时，预先调用正方的响应生成
- 语音播放完成后，直接使用预加载的响应，减少等待时间

### 语音合成

项目使用 WebSocket 连接到语音合成服务：

- 支持实时流式语音合成
- 分别为正反方配置不同的语音 ID，增强辩论效果
- 使用 Web Audio API 处理和播放音频数据
- 实现了音频缓冲队列，确保流畅播放

## 贡献

欢迎提交问题和改进建议！ walksky@gmail.com
