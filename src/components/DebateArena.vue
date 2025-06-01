<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { createDebateMessage } from '../services/api';
import DebateHeader from './DebateHeader.vue';
import DebateContent from './DebateContent.vue';
import DebateEndModal from './DebateEndModal.vue';
import SpeechService from '../services/SpeechService';

// 定义消息类型
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  side: 'positive' | 'negative';
}

// 状态管理
const topic = ref('');
const isDebating = ref(false);
const messages = reactive<Message[]>([]);
const isLoading = ref(false);
const showDebateEndModal = ref(false);
const maxRounds = parseInt(import.meta.env.VITE_MAX_DEBATE_ROUNDS || '10');
const currentRound = ref(0);
const positiveRounds = ref(0);
const negativeRounds = ref(0);
// 新增：标记是否已达到最大轮数但还在等待语音播放完成
const reachedMaxRoundsWaitingForSpeech = ref(false);

// 语音服务相关配置
const ENABLE_TEXT_TO_SPEECH = import.meta.env.VITE_ENABLE_TEXT_TO_SPEECH === 'true';
const ACCESS_TOKEN = import.meta.env.VITE_ACCESS_TOKEN;
const POSITIVE_VOICE_ID = import.meta.env.VITE_POSITIVE_VOICE_ID;
const NEGATIVE_VOICE_ID = import.meta.env.VITE_NEGATIVE_VOICE_ID;
const WS_URL = `${import.meta.env.VITE_WS_URL}?authorization=Bearer%20${ACCESS_TOKEN}`;
const SAMPLE_RATE = 48000;

// 初始化语音服务
const speechService = new SpeechService({
  wsUrl: WS_URL,
  sampleRate: SAMPLE_RATE,
  positiveVoiceId: POSITIVE_VOICE_ID,
  negativeVoiceId: NEGATIVE_VOICE_ID,
  enabled: ENABLE_TEXT_TO_SPEECH,
  onSpeechEnd: handleSpeechEnd
});

// 预加载状态变量
let isPreloadingNextResponse = false;
let preloadedPositiveResponse = "";
let preloadedNegativeResponse = "";

// 预加载下一个响应
async function preloadNextResponse(side: 'positive' | 'negative') {
  try {
    // 准备历史消息
    const historyMessages = [
      {
        role: 'system' as const,
        content: side === 'positive' 
          ? `你是持正方观点的人，正在与持反方观点的人抬杠讨论关于"${topic.value}"的话题。请用略带情绪化、坚定的口语风格回应，表达你的观点。回复要简短有力，像抬杠一样，每次回复不要超过3句话。请针对反方的观点进行反驳。`
          : `你是持反方观点的人，正在与持正方观点的人抬杠讨论关于"${topic.value}"的话题。请用略带挑衅、坚定的口语风格回应，表达你的反对观点。回复要简短有力，像抬杠一样，每次回复不要超过3句话。请针对正方的观点进行反驳。`
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    const response = await createDebateMessage(historyMessages, side === 'positive');
    
    // 存储预加载的响应
    if (side === 'positive') {
      preloadedPositiveResponse = response;
    } else {
      preloadedNegativeResponse = response;
    }
  } catch (error) {
    console.error(`预加载${side === 'positive' ? '正方' : '反方'}回应失败:`, error);
  } finally {
    isPreloadingNextResponse = false;
  }
}

// 显示预加载的响应
function displayPreloadedResponse(side: 'positive' | 'negative') {
  if (side === 'positive' && preloadedPositiveResponse) {
    // 显示预加载的正方响应
    messages.push({
      role: 'assistant',
      content: preloadedPositiveResponse,
      side: 'positive'
    });
    
    positiveRounds.value += 1;
    currentRound.value += 1;
    
    // 添加到语音队列
    speechService.addTextToSpeechQueue(preloadedPositiveResponse, 'positive');
    
    // 清空预加载的响应
    preloadedPositiveResponse = "";
    // 检查是否达到最大对话轮数
    if (currentRound.value >= maxRounds) {
      isDebating.value = false;
      showDebateEndModal.value = true;
    }
    
    // 滚动到最新消息
    nextTick(() => scrollToBottom());
  } else if (side === 'negative' && preloadedNegativeResponse) {
    // 显示预加载的反方响应
    messages.push({
      role: 'assistant',
      content: preloadedNegativeResponse,
      side: 'negative'
    });
    
    negativeRounds.value += 1;
    currentRound.value += 1;
    
    // 添加到语音队列
    speechService.addTextToSpeechQueue(preloadedNegativeResponse, 'negative');
    
    // 清空预加载的响应
    preloadedNegativeResponse = "";
    // 在displayPreloadedResponse函数中
    // 检查是否达到最大对话轮数
    if (currentRound.value >= maxRounds) {
    if (ENABLE_TEXT_TO_SPEECH) {
    // 如果启用了语音，设置标记等待语音播放完成
    reachedMaxRoundsWaitingForSpeech.value = true;
    } else {
    // 如果没有启用语音，直接结束
    isDebating.value = false;
    showDebateEndModal.value = true;
    }
    }
    
    // 滚动到最新消息
    nextTick(() => scrollToBottom());
  }
}

// 语音播放结束处理函数
function handleSpeechEnd(side: 'positive' | 'negative' | null) {
  if (!side) return;
  
  // 检查是否已达到最大轮数且正在等待语音播放完成
  if (reachedMaxRoundsWaitingForSpeech.value) {
    // 语音播放完成，现在可以结束对话并显示对话框
    isDebating.value = false;
    showDebateEndModal.value = true;
    reachedMaxRoundsWaitingForSpeech.value = false;
    return;
  }
  
  if (isDebating.value && currentRound.value < maxRounds) {
    const lastSpeakingSide = messages[messages.length - 1].side;
    if (lastSpeakingSide === 'positive') {
      // 正方播放完，使用预加载的反方回应
      if (preloadedNegativeResponse) {
        displayPreloadedResponse('negative');
      } else {
        setTimeout(() => negativeResponse(), 500);
      }
    } else if (lastSpeakingSide === 'negative') {
      // 反方播放完，使用预加载的正方回应
      if (preloadedPositiveResponse) {
        displayPreloadedResponse('positive');
      } else {
        setTimeout(() => positiveResponse(), 500);
      }
    }
  }
}

// 开始预加载响应
function startPreloading(currentSide: 'positive' | 'negative') {
  if (ENABLE_TEXT_TO_SPEECH && !isPreloadingNextResponse) {
    // 根据当前播放方，预加载另一方的响应
    if (currentSide === 'positive' && !preloadedNegativeResponse) {
      isPreloadingNextResponse = true;
      // 预加载反方响应
      preloadNextResponse('negative');
    } else if (currentSide === 'negative' && !preloadedPositiveResponse) {
      isPreloadingNextResponse = true;
      // 预加载正方响应
      preloadNextResponse('positive');
    }
  }
}

// 监听消息数组变化，自动滚动到底部
watch(() => [...messages], () => {
  nextTick(() => scrollToBottom());
});

// 正方和反方头像
const positiveAvatar = '/girl.png'
const negativeAvatar = '/boy.png'

// 开始聊天
const startDebate = async () => {
  if (!topic.value.trim()) {
    alert('请输入聊天话题');
    return;
  }
  
  // 重置状态
  messages.length = 0;
  isDebating.value = true;
  isLoading.value = true;
  currentRound.value = 0;
  positiveRounds.value = 0;
  negativeRounds.value = 0;
  speechService.reset();
  preloadedPositiveResponse = "";
  preloadedNegativeResponse = "";
  isPreloadingNextResponse = false;
  
  // 添加系统消息
  const systemMessage: Message = {
    role: 'system',
    content: `你是持正方观点的人，正在与持反方观点的人抬杠讨论关于"${topic.value}"的话题。请用略带情绪化、坚定的口语风格回应，表达你的观点。回复要简短有力，像抬杠一样，每次回复不要超过3句话。`,
    side: 'positive'
  };
  
  // 准备正方的第一次发言
  try {
    const positiveResponse = await createDebateMessage(
      [{ role: 'system', content: systemMessage.content }],
      true
    );
    
    messages.push({
      role: 'assistant',
      content: positiveResponse,
      side: 'positive'
    });
    
    positiveRounds.value += 1;
    currentRound.value += 1;
    
    // 添加到语音队列
    speechService.addTextToSpeechQueue(positiveResponse, 'positive');
    startPreloading('positive');
    
    // 如果禁用了语音功能，直接触发反方回应
    if (!ENABLE_TEXT_TO_SPEECH) {
      setTimeout(() => negativeResponse(), 500);
    }
  } catch (error) {
    console.error('辩论开始失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 反方回应函数
const negativeResponse = async () => {
  if (!isDebating.value) return;
  if (preloadedNegativeResponse) {
    // 如果已经有预加载的响应，直接使用
    displayPreloadedResponse('negative');
    return;
  }
  
  isLoading.value = true;
  
  try {
    // 准备历史消息
    const historyMessages = [
      {
        role: 'system' as const,
        content: `你是持反方观点的人，正在与持正方观点的人抬杠讨论关于"${topic.value}"的话题。请用略带挑衅、坚定的口语风格回应，表达你的反对观点。回复要简短有力，像抬杠一样，每次回复不要超过3句话。请针对正方的观点进行反驳。`
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    const response = await createDebateMessage(historyMessages, false);
    
    messages.push({
      role: 'assistant',
      content: response,
      side: 'negative'
    });
    
    negativeRounds.value += 1;
    currentRound.value += 1;
    
    // 添加到语音队列
    speechService.addTextToSpeechQueue(response, 'negative');
    startPreloading('negative');
    
    // 检查是否达到最大对话轮数
    if (currentRound.value >= maxRounds) {
      isDebating.value = false;
      // 延迟2秒显示结束对话框
      setTimeout(() => {
        showDebateEndModal.value = true;
      }, 2000);
    }
    
    // 滚动到最新消息
    nextTick(() => scrollToBottom());
    
    // 如果禁用了语音功能，直接触发下一轮正方回应
    if (!ENABLE_TEXT_TO_SPEECH && isDebating.value && currentRound.value < maxRounds) {
      setTimeout(() => positiveResponse(), 500);
    }
  } catch (error) {
    console.error('反方回应失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 正方回应函数
const positiveResponse = async () => {
  if (!isDebating.value) return;
  if (preloadedPositiveResponse) {
    // 如果已经有预加载的响应，直接使用
    displayPreloadedResponse('positive');
    return;
  }
  
  isLoading.value = true;
  
  try {
    // 准备历史消息
    const historyMessages = [
      {
        role: 'system' as const,
        content: `你是持正方观点的人，正在与持反方观点的人抬杠讨论关于"${topic.value}"的话题。请用略带情绪化、坚定的口语风格回应，表达你的观点。回复要简短有力，像抬杠一样，每次回复不要超过3句话。请针对反方的观点进行反驳。`
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    const response = await createDebateMessage(historyMessages, true);
    
    messages.push({
      role: 'assistant',
      content: response,
      side: 'positive'
    });
    
    positiveRounds.value += 1;
    currentRound.value += 1;
    
    // 添加到语音队列
    speechService.addTextToSpeechQueue(response, 'positive');
    startPreloading('positive');
    
    // 检查是否达到最大对话轮数
    if (currentRound.value >= maxRounds) {
      isDebating.value = false;
      // 延迟2秒显示结束对话框
      setTimeout(() => {
        showDebateEndModal.value = true;
      }, 2000);
    }
    
    // 滚动到最新消息
    nextTick(() => scrollToBottom());
    
    // 如果禁用了语音功能，直接触发下一轮反方回应
    if (!ENABLE_TEXT_TO_SPEECH && isDebating.value && currentRound.value < maxRounds) {
      setTimeout(() => negativeResponse(), 500);
    }
  } catch (error) {
    console.error('正方回应失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 停止聊天
const stopDebate = () => {
  isDebating.value = false;
  speechService.reset();
};

// 关闭对话结束提示窗口
const closeDebateEndModal = () => {
  showDebateEndModal.value = false;
};

// 滚动到最新消息
const scrollToBottom = () => {
  const messagesContainer = document.querySelector('.messages-container');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
};

// 组件卸载时清理资源
onMounted(() => {
  return () => {
    speechService.reset();
  };
});
</script>

<template>
  <div class="debate-container">
    <!-- 上部分：对话内容 -->
    <DebateContent 
      :messages="messages" 
      :positiveAvatar="positiveAvatar"
      :negativeAvatar="negativeAvatar"
    />
    
    <!-- 下部分：头像、主题和按钮 -->
    <DebateHeader
      v-model:topic="topic"
      :isDebating="isDebating"
      :isLoading="isLoading"
      :currentRound="currentRound"
      :maxRounds="maxRounds"
      :positiveAvatar="positiveAvatar"
      :negativeAvatar="negativeAvatar"
      @start="startDebate"
      @stop="stopDebate"
    />
    
    <!-- 对话结束提示窗口 -->
    <DebateEndModal
      :show="showDebateEndModal"
      :maxRounds="maxRounds"
      @close="closeDebateEndModal"
    />
  </div>
</template>

<style scoped>
.debate-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>