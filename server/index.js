// server/index.js - 생각의 그물 실시간 서버 (Socket.IO 기반)

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const { v4: uuidv4 } = require('uuid')
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

const PORT = process.env.PORT || 3001
const rooms = {} // roomId: { users: [], words: {}, timer: null, history: [] }

io.on('connection', socket => {
  console.log('✅ 연결됨:', socket.id)

  socket.on('joinRoom', ({ nickname }) => {
    // 방 찾기 or 새 방 만들기
    let roomId = null
    for (const id in rooms) {
      if (rooms[id].users.length === 1) {
        roomId = id
        break
      }
    }
    if (!roomId) {
      roomId = uuidv4()
      rooms[roomId] = { users: [], words: {}, history: [], round: 1 }
    }

    socket.join(roomId)
    rooms[roomId].users.push({ id: socket.id, nickname })
    console.log(`👥 ${nickname} joined room ${roomId}`)

    // 두 명이면 게임 시작
    if (rooms[roomId].users.length === 2) {
      io.to(roomId).emit('startGame', { round: 1 })
      startRound(roomId)
    } else {
      socket.emit('waiting')
    }
  })

  socket.on('submitWord', ({ roomId, word }) => {
    const room = rooms[roomId]
    if (!room) return
    room.words[socket.id] = word

    if (Object.keys(room.words).length === 2) {
      const [a, b] = Object.values(room.words)
      room.history.push({ round: room.round, a, b })
      const match = a.trim().toLowerCase() === b.trim().toLowerCase()
      if (match) {
        io.to(roomId).emit('youWin', {
          words: [a],
          history: room.history
        })
        clearRoom(roomId)
      } else {
        io.to(roomId).emit('matchFail', {
          a, b,
          round: room.round + 1
        })
        room.words = {}
        room.round++
        startRound(roomId)
      }
    } else {
      socket.to(roomId).emit('waitingOther')
    }
  })

  socket.on('disconnect', () => {
    console.log('❌ 연결 해제:', socket.id)
    for (const roomId in rooms) {
      const room = rooms[roomId]
      const userIndex = room.users.findIndex(u => u.id === socket.id)
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1)
        io.to(roomId).emit('opponentLeft')
        clearRoom(roomId)
        break
      }
    }
  })

  function startRound(roomId) {
    const room = rooms[roomId]
    if (!room) return
    if (room.timer) clearTimeout(room.timer)
    room.timer = setTimeout(() => {
      io.to(roomId).emit('timeout')
      clearRoom(roomId)
    }, 15000)
  }

  function clearRoom(roomId) {
    const room = rooms[roomId]
    if (!room) return
    if (room.timer) clearTimeout(room.timer)
    delete rooms[roomId]
  }
})

server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`)
})
