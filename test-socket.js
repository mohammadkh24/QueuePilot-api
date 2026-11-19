const { io } = require('socket.io-client');

// این سه مقدار رو تنظیم کن
const SERVER_URL = 'http://localhost:3000/queue';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMWMxODMwNy00MDEwLTQwZmUtYjc1Zi1jY2FiMzNlMmE2OTEiLCJlbWFpbCI6Im1vaGFtbWFka2hncDEzODdAZ21haWwuY29tIiwiaWF0IjoxNzk1MTEzMzY1LCJleHAiOjE3OTUxMTQyNjV9.wGkBT48fSfQ9AwbV7GZ3qPbBFyyJ24ZCXieT7BBp6X0'
const BUSINESS_ID = '94a62094-2a91-47f9-ba12-4991d4cbc4da';

const socket = io(SERVER_URL, {
  auth: {
    token: ACCESS_TOKEN,
  },
  transports: ['websocket'],
  reconnection: false,
});

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);

  socket.emit('queue:join', {
    businessId: BUSINESS_ID,
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection Error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// رویدادهای صف
socket.on('queue:created', (data) => {
  console.log('\n🟢 queue:created');
  console.log(data);
});

socket.on('queue:updated', (data) => {
  console.log('\n🟡 queue:updated');
  console.log(data);
});

socket.on('queue:cancelled', (data) => {
  console.log('\n🔴 queue:cancelled');
  console.log(data);
});

// رویداد پیش‌بینی
socket.on('queue:prediction-updated', (data) => {
  console.log('\n🔮 queue:prediction-updated');
  console.log(data);
});

// خطاهای احتمالی سمت سرور
socket.on('exception', (error) => {
  console.error('\n⚠️ Socket Exception:', error);
});
