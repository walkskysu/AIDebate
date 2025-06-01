# AI辩论平台 (AI Debate Arena)
一个基于Vue 3和TypeScript的AI辩论平台，支持两个AI角色就特定话题进行辩论，并通过语音合成实时播放辩论内容。该项目实现了语音播放优化，在一方语音播放时预先调用另一方的响应，提高用户体验。

## 功能特点
- 🤖 支持两个AI角色（正方和反方）进行辩论
- 🎯 用户可自定义辩论话题
- 🔄 自动轮流生成正反方观点
- 🔊 实时语音合成和播放
- ⚡ 预加载优化：在一方语音播放时预先调用另一方的响应
- 📱 响应式设计，适配不同设备
## 技术栈
- Vue 3 (使用Composition API和 <script setup> 语法)
- TypeScript
- Vite
- Axios (用于API请求)
- Web Audio API (用于音频处理和播放)
- WebSocket (用于实时语音合成)
## 安装
```
# 克隆项目
git clone <repository-url>
cd argue

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```
## 环境变量配置
在项目根目录创建 .env 文件，配置以下环境变量：

```
# API配置
VITE_FEMALE_API_URL=<正方API URL>
VITE_FEMALE_API_KEY=<正方API Key>
VITE_FEMALE_MODEL=<正方使用的模型>

VITE_MALE_API_URL=<反方API URL>
VITE_MALE_API_KEY=<反方API Key>
VITE_MALE_MODEL=<反方使用的模型>

# 辩论配置
VITE_MAX_ROUNDS=<最大辩论轮数，默认为5>

# 语音合成配置
VITE_ACCESS_TOKEN=<语音合成服务的访问令牌>
VITE_POSITIVE_VOICE_ID=<正方语音ID>
VITE_NEGATIVE_VOICE_ID=<反方语音ID>
VITE_WS_URL=<语音合成WebSocket URL>
VITE_ENABLE_TEXT_TO_SPEECH=true  # 是否启用文本到语音转换

## 使用指南
1. 在输入框中输入辩论话题
2. 点击"开始聊天"按钮启动辩论
3. 正方AI将首先发表观点，并通过语音播放
4. 语音播放完成后，反方AI自动回应
5. 辩论将持续进行，直到达到配置的最大轮数
6. 随时可以点击"结束聊天"按钮停止辩论
## 项目结构
```
├── public/             # 静态资源
├── src/                # 源代码
│   ├── assets/         # 资源文件（图片
等）
│   ├── components/     # 组件
│   │   └── DebateArena.vue  # 主要辩论组
件
│   ├── services/       # 服务
│   │   └── api.ts      # API调用服务
│   ├── App.vue         # 根组件
│   ├── main.ts         # 入口文件
│   └── style.css       # 全局样式
├── .env                # 环境变量
├── index.html          # HTML模板
├── package.json        # 项目依赖
├── tsconfig.json       # TypeScript配置
└── vite.config.ts      # Vite配置
```
## 高级功能
### 预加载优化
为了提高用户体验，项目实现了预加载优化功能：

- 在正方语音播放时，预先调用反方的响应生成
- 在反方语音播放时，预先调用正方的响应生成
- 语音播放完成后，直接使用预加载的响应，减少等待时间
### 语音合成
项目使用WebSocket连接到语音合成服务：

- 支持实时流式语音合成
- 分别为正反方配置不同的语音ID，增强辩论效果
- 使用Web Audio API处理和播放音频数据
- 实现了音频缓冲队列，确保流畅播放
## 贡献
欢迎提交问题和改进建议！ walksky@gmail.com

## 许可
MIT