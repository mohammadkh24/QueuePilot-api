const { io } = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3000/queue';

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNjI0YzllOC1iYzY0LTQ1OTAtODA1Yi0wMDY4YTg0ZjRkZjgiLCJlbWFpbCI6Im1vaGFtbWFkQGV4YW1wbGUuY29tIiwiaWF0IjoxNzk0NTYxMDc3LCJleHAiOjE3OTQ1NjE5Nzd9.gipLUOFLNXVEzJ1dFmq3cj23YlTADInPzX2HBzszzMk';
const businessId = 'a92d9825-eb2a-4d6f-9687-c62e48b178bb';

const socket = io(SOCKET_URL, {
  auth: {
    token,
  },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);

  socket.emit('queue:join', { businessId }, (response) => {
    console.log('Join response:', response);
  });
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('queue:created', (data) => {
  console.log('New queue entry:', data);
});

socket.on('queue:updated', (data) => {
  console.log('Queue updated:', data);
});

socket.on('queue:cancelled', (data) => {
  console.log('Queue cancelled:', data);
});
