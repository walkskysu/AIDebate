<script setup lang="ts">
defineProps({
  topic: {
    type: String,
    required: true
  },
  isDebating: {
    type: Boolean,
    required: true
  },
  isLoading: {
    type: Boolean,
    required: true
  },
  currentRound: {
    type: Number,
    required: true
  },
  maxRounds: {
    type: Number,
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

const emit = defineEmits(['update:topic', 'start', 'stop']);

const updateTopic = (e: Event) => {
  emit('update:topic', (e.target as HTMLInputElement).value);
};
</script>

<template>
  <div class="debate-header">
    <div class="avatar positive-avatar">
      <img :src="positiveAvatar" alt="正方头像" />
      <div class="avatar-label">正方</div>
    </div>
    
    <div class="topic-container">
      <input 
        :value="topic" 
        @input="updateTopic"
        type="text" 
        placeholder="请输入聊天话题" 
        :disabled="isDebating" 
        class="topic-input"
      />
      <div class="chat-controls">
        <div class="debate-info">
          <div class="control-row">
            <div class="rounds-counter">
              <span>对话次数: {{ currentRound }}/{{ maxRounds }}</span>
            </div>
            <button 
              v-if="!isDebating" 
              @click="$emit('start')" 
              class="chat-button start-button"
              :disabled="isLoading"
            >
              开始聊天
            </button>
            <button 
              v-else 
              @click="$emit('stop')" 
              class="chat-button stop-button"
            >
              结束聊天
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="avatar negative-avatar">
      <img :src="negativeAvatar" alt="反方头像" />
      <div class="avatar-label">反方</div>
    </div>
  </div>
</template>

<style scoped>
.debate-header {
  display: flex;
  height: 20%;
  width: 100%;
  background-color: #f0f0f0;
  border-top: 1px solid #ddd;
  padding: 10px;
  box-sizing: border-box;
}

.avatar {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.avatar-label {
  margin-top: 8px;
  font-weight: bold;
  color: #333;
}

.positive-avatar img {
  border-color: #ff6b6b;
}

.negative-avatar img {
  border-color: #4dabf7;
}

.topic-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
}

.topic-input {
  width: 100%;
  padding: 10px 15px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-bottom: 15px;
  text-align: left;
  letter-spacing: -0.2px;
}

.chat-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.debate-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.control-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100%;
}

.rounds-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
  color: #555;
  min-width: 120px;
}

.start-button, .stop-button {
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.start-button {
  background-color: #4caf50;
  color: white;
  border: none;
}

.start-button:hover {
  background-color: #388e3c;
  transform: translateY(-2px);
}

.stop-button {
  background-color: #f44336;
  color: white;
  border: none;
}

.stop-button:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .avatar img {
    width: 60px;
    height: 60px;
  }
}
</style>