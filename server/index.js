// ✅ server/index.js - 생각의 그물 실시간 서버 (Socket.IO 기반 with Round & Timeout Logic)
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const { v4: uuidv4 } = require('uuid')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

const PORT = process.env.PORT || 3001
const rooms = {} // roomId: { users, words, submitted, round, history, timer }

io.on('connection', socket => {
  console.log('✅ 연결됨:', socket.id)

  socket.on('joinRoom', ({ nickname }) => {
    let roomId = Object.keys(rooms).find(id => rooms[id].users.length === 1)
    if (!roomId) {
      roomId = uuidv4()
      rooms[roomId] = {
        users: [],
        words: {},
        submitted: {},
        round: 1,
        history: [],
        timer: null
      }
    }

    socket.join(roomId)
    rooms[roomId].users.push({ id: socket.id, nickname })
    console.log(`👥 ${nickname} joined room ${roomId}`)

    socket.emit('joinedRoom', { roomId })

    // 상대방에게도 닉네임 전달
    const other = rooms[roomId].users.find(u => u.id !== socket.id)
    if (other) {
      io.to(other.id).emit('opponentInfo', { nickname })
      socket.emit('opponentInfo', { nickname: other.nickname })
    }

    // 두 명이 되면 게임 시작
    if (rooms[roomId].users.length === 2) {
      startRound(roomId)
    } else {
      socket.emit('waiting')
    }
  })

  socket.on('submitWord', ({ roomId, word }) => {
    const room = rooms[roomId]
    if (!room) return

    room.words[socket.id] = word.trim()
    room.submitted[socket.id] = true
    io.to(socket.id).emit('wordReceived', { word })
    console.log(`📨 단어 제출됨 (${socket.id}): ${word}`)
  })

  socket.on('disconnect', () => {
    console.log('❌ 연결 해제:', socket.id)
    for (const roomId in rooms) {
      const room = rooms[roomId]
      const idx = room.users.findIndex(u => u.id === socket.id)
      if (idx !== -1) {
        room.users.splice(idx, 1)
        io.to(roomId).emit('opponentLeft')
        clearRoom(roomId)
        break
      }
    }
  })

  function startRound(roomId) {
    const room = rooms[roomId]
    if (!room) return

    const [a, b] = room.users
    if (!a || !b) return

    room.words = {}
    room.submitted = {}

    console.log(`\n🎮 라운드 ${room.round} 시작 (room: ${roomId})`)
    io.to(roomId).emit('startGame', {
      round: room.round,
      users: {
        [a.id]: b.nickname,
        [b.id]: a.nickname
      }
    })

    if (room.timer) clearTimeout(room.timer)
    room.timer = setTimeout(() => {
      const aWord = room.words[a.id] || null
      const bWord = room.words[b.id] || null

      if (!aWord || !bWord) {
        io.to(roomId).emit('timeout')
        return clearRoom(roomId)
      }

      const match = aWord.toLowerCase() === bWord.toLowerCase()
      room.history.push({ round: room.round, words: {
        [a.id]: aWord,
        [b.id]: bWord
      }})

      if (match) {
        io.to(roomId).emit('youWin', {
          history: room.history,
          users: {
            [a.id]: a.nickname,
            [b.id]: b.nickname
          }
        })
        return clearRoom(roomId)
      }

      io.to(roomId).emit('matchFail', {
        round: room.round + 1,
        a: { nickname: a.nickname, word: aWord },
        b: { nickname: b.nickname, word: bWord }
      })
      room.round++
      startRound(roomId)
    }, 15000)
  }

  function clearRoom(roomId) {
    const room = rooms[roomId]
    if (room?.timer) clearTimeout(room.timer)
    delete rooms[roomId]
  }
})

server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`)
})
