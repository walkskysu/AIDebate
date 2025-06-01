<script setup lang="ts">
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  maxRounds: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['close']);
</script>

<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <h2>battle 结束!!</h2>
      <p>经过 {{ maxRounds }}  回合精彩发言，你喜欢谁的观点？</p>
      <button @click="$emit('close')" class="close-button">关闭</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

h2 {
  margin-top: 0;
  color: #333;
}

.close-button {
  margin-top: 20px;
  padding: 8px 16px;
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.close-button:hover {
  background-color: #535bf2;
}
</style>