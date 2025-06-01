interface SpeechServiceConfig {
  wsUrl: string;
  sampleRate: number;
  positiveVoiceId: string;
  negativeVoiceId: string;
  enabled: boolean;
  onSpeechEnd: (side: 'positive' | 'negative' | null) => void;
}

class SpeechService {
  private config: SpeechServiceConfig;
  private audioCtx: AudioContext | null = null;
  private websocket: WebSocket | null = null;
  private configSent = false;
  private isPlaying = false;
  private positivePlayQueue: ArrayBuffer[] = [];
  private negativePlayQueue: ArrayBuffer[] = [];
  private playingSource: AudioBufferSourceNode | null = null;
  private pendingSpeechText = "";
  private currentSpeakingSide: 'positive' | 'negative' | null = null;
  private audioFullyReceived = false;

  constructor(config: SpeechServiceConfig) {
    this.config = config;
  }

  // 重置语音状态
  public reset(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.close();
    }
    if (this.playingSource) {
      try { this.playingSource.stop(); } catch {}
      this.playingSource.disconnect();
    }
    this.configSent = false;
    this.positivePlayQueue = [];
    this.negativePlayQueue = [];
    this.isPlaying = false;
    this.pendingSpeechText = "";
    this.currentSpeakingSide = null;
    this.audioFullyReceived = false;
  }

  // 生成唯一事件ID
  private getEventId(): string {
    return crypto.randomUUID();
  }

  // Base64转ArrayBuffer
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  // 播放下一个音频片段
  private playNextChunk(): void {
    if (!this.audioCtx) return;
    
    // 根据当前发言方选择对应的队列
    const currentQueue = this.currentSpeakingSide === 'positive' ? this.positivePlayQueue : this.negativePlayQueue;
    
    if (currentQueue.length === 0) {
      this.isPlaying = false;
      
      // 只有当队列为空且音频已完全接收时才进行下一步操作
      if (this.audioFullyReceived) {
        this.audioFullyReceived = false; // 重置标志
        
        // 如果播放队列为空且有待播放的文本，开始处理下一条语音
        if (this.pendingSpeechText) {
          this.startSpeech();
        } else {
          const lastSide = this.currentSpeakingSide;
          this.currentSpeakingSide = null;
          
          // 通知语音播放完成
          if (lastSide) {
            this.config.onSpeechEnd(lastSide);
          }
        }
      }
      return;
    }

    this.isPlaying = true;

    const pcmBuffer = currentQueue.shift()!;
    const sampleCount = pcmBuffer.byteLength / 2;
    const audioBuffer = this.audioCtx.createBuffer(1, sampleCount, this.config.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    const int16Array = new Int16Array(pcmBuffer);

    for (let i = 0; i < sampleCount; i++) {
      channelData[i] = int16Array[i] / 32768;
    } 

    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioCtx.destination);
    this.playingSource = source;

    source.onended = () => {
      this.playNextChunk();
    };

    source.start();
  }

  // 开始语音合成
  private startSpeech(): void {
    if (!this.pendingSpeechText || !this.currentSpeakingSide || !this.config.enabled) return;
    
    const textToSpeak = this.pendingSpeechText;
    this.pendingSpeechText = "";
    
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.close();
    }
    
    this.configSent = false;
    this.websocket = new WebSocket(this.config.wsUrl);
    
    this.websocket.onopen = () => {
      console.log("✅ WebSocket 已连接，发送 speech.update");
      const voiceId = this.currentSpeakingSide === 'positive' ? 
        this.config.positiveVoiceId : this.config.negativeVoiceId;
      
      const audioconf = {
        id: this.getEventId(),
        event_type: "speech.update",
        data: {
          output_audio: {
            codec: "pcm",
            pcm_config: { sample_rate: this.config.sampleRate },
            speech_rate: 0,
            voice_id: voiceId
          }
        }
      };
      
      this.websocket?.send(JSON.stringify(audioconf));
    };
    
    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const eventType = data.event_type;
      
      if (eventType === "speech.updated" && !this.configSent) {
        this.configSent = true;
        console.log("✅ 配置完成，发送文本");
        
        const appendEvent = {
          id: this.getEventId(),
          event_type: "input_text_buffer.append",
          data: { delta: textToSpeak }
        };
        
        const completeEvent = {
          id: this.getEventId(),
          event_type: "input_text_buffer.complete"
        };
        
        this.websocket?.send(JSON.stringify(appendEvent));
        setTimeout(() => this.websocket?.send(JSON.stringify(completeEvent)), 300);
      }
      
      if (eventType === "speech.audio.update") {
        const b64data = data.data.delta;
        const pcmBytes = this.base64ToArrayBuffer(b64data);
        
        // 根据当前发言方将音频数据添加到对应的队列
        if (this.currentSpeakingSide === 'positive') {
          this.positivePlayQueue.push(pcmBytes);
        } else if (this.currentSpeakingSide === 'negative') {
          this.negativePlayQueue.push(pcmBytes);
        }
        
        if (!this.isPlaying) {
          this.playNextChunk();
        }
      }
      
      if (eventType === "speech.audio.completed") {
        console.log("🔚 播放结束（服务器已发送完）");
        this.audioFullyReceived = true; // 设置标志表示音频已完全接收
        
        // 如果当前队列已经为空，手动触发下一步操作
        if (!this.isPlaying && this.currentSpeakingSide) {
          const currentQueue = this.currentSpeakingSide === 'positive' ? 
            this.positivePlayQueue : this.negativePlayQueue;
          if (currentQueue.length === 0) {
            this.playNextChunk();
          }
        }
      }
    };
    
    this.websocket.onerror = (err) => {
      console.error("❌ 错误:", err);
    };
    
    this.websocket.onclose = () => {
      console.log("🔌 WebSocket 关闭");
    };
  }

  // 添加文本到语音队列
  public addTextToSpeechQueue(text: string, side: 'positive' | 'negative'): void {
    // 如果禁用了文字转语音功能，直接返回
    if (!this.config.enabled) return;
    
    // 如果当前没有播放，直接开始新的语音
    if (!this.isPlaying && !this.currentSpeakingSide) {
      this.pendingSpeechText = text;
      this.currentSpeakingSide = side;
      this.startSpeech();
    } else {
      // 如果当前正在播放，等待当前播放完成
      this.pendingSpeechText = text;
      this.currentSpeakingSide = side;
    }
  }
}

export default SpeechService;