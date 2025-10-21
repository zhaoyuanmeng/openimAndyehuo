<template>
  <div class="notification-container" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <div class="notification-header">未读消息</div>
    <div class="message-list">
      <div class="message-item" v-for="(msg, idx) in staticMessages" :key="idx" @click="handleMessageClick(msg)">
        <div class="message-sender">
          {{ msg.sender }}
          <span class="unread-badge" v-if="msg.unreadCount > 0">
            {{ msg.unreadCount > 9 ? '9+' : msg.unreadCount }}
          </span>
        </div>
        <div class="message-content">{{ msg.content }}</div>
        <div class="message-time">{{ msg.time }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ipcRenderer, isElectron, currentWindow } from "../../platform";
// 静态模拟数据：无需后端或状态管理
const staticMessages = ref([
  {
    id: '1',
    sender: '技术部-张三',
    content: '这个需求今天能完成吗？',
    time: '10:23',
    unreadCount: 0,
    conversationId: 'conv_1'
  },
  {
    id: '2',
    sender: '产品部-李四',
    content: '新版本原型已更新，请查收',
    time: '09:45',
    unreadCount: 2,
    conversationId: 'conv_2'
  },
  {
    id: '3',
    sender: '行政部-王五',
    content: '明天下午3点开会，请准时参加',
    time: '昨天',
    unreadCount: 1,
    conversationId: 'conv_3'
  }
]);
// 鼠标进入悬浮窗：通知主进程
const handleMouseEnter = () => {
  ipcRenderer.send('notification:mouse-enter');
};

// 鼠标离开悬浮窗：通知主进程
const handleMouseLeave = () => {
  ipcRenderer.send('notification:mouse-leave');
};


// 点击消息：通知主进程打开主窗口
const handleMessageClick = (msg) => {
  window.electron.ipcRenderer.send('notification:click-message', {
    conversationId: msg.conversationId,
    messageId: msg.id
  });
};
</script>

<style scoped>
/* 样式同上，保持不变 */
.notification-container {
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
  background: white;
  border-radius: 8px;
}

/* ... 其他样式省略（同之前） ... */
</style>