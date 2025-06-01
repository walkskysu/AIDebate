<script setup lang="ts">
interface Message {
  side: 'positive' | 'negative';
  content: string;
  // 如果还有其他属性，也可以在这里添加
}

defineProps({
  messages: {
    type: Array as () => Message[],
    required: true
  },
  positiveAvatar: {
    type: String,
    required: true
  },
  negativeAvatar: {
    type: String,
    required: true
  }
});
</script>

<template>
  <div class="debate-content">
    <div v-if="messages.length === 0" class="empty-state">
      输入话题并点击"开始聊天"按钮开始
    </div>
    
    <div v-else class="messages-container">
      <div 
        v-for="(message, index) in messages" 
        :key="index"
        :class="['message', message.side === 'positive' ? 'positive-message' : 'negative-message']"
      >
        <div class="message-avatar">
          <img :src="message.side === 'positive' ? positiveAvatar : negativeAvatar" :alt="message.side === 'positive' ? '正方' : '反方'" />
        </div>
        <div class="message-content">
          <div class="message-text">
            {{ message.content }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debate-content {
  height: 75%;
  width: 100%;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9f9f9;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
  font-size: 18px;
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  padding-right: 5px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background-color: #fafafa;
  min-height: 300px;
  max-height: 70vh;
  scrollbar-width: thin;
  scrollbar-color: #646cff #f1f1f1;
}

/* WebKit浏览器的滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #646cff;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #535bf2;
}

.message {
  display: flex;
  margin-bottom: 15px;
  max-width: 80%;
}

.positive-message {
  align-self: flex-start;
}

.negative-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  background-color: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  margin: 0 10px;
}

.positive-message .message-content {
  background-color: #fff0f5;
  border-left: 4px solid #ff6b6b;
}

.negative-message .message-content {
  background-color: #e6f7ff;
  border-right: 4px solid #4dabf7;
}

.message-text {
  line-height: 1.2;
  text-align: left;
  letter-spacing: -0.2px;
}

@media (max-width: 768px) {
  .message {
    max-width: 90%;
  }
}
</style>