// ✅ socket.js
import { io } from 'socket.io-client'

export const socket = io('https://thinknet.onrender.com', { autoConnect: false })

let callbacks = {}

export const setupSocketListeners = ({
  onStartGame,
  onWaiting,
  onWaitingOther,
  onMatchFail,
  onWin,
  onTimeout,
  onOpponentLeft,
  onJoinedRoom,
  onReceiveOpponent,
  onReceiveWords
}) => {
  callbacks = {
    onStartGame,
    onWaiting,
    onWaitingOther,
    onMatchFail,
    onWin,
    onTimeout,
    onOpponentLeft,
    onJoinedRoom,
    onReceiveOpponent,
    onReceiveWords
  }

  socket.on('startGame', onStartGame)
  socket.on('waiting', onWaiting)
  socket.on('waitingOther', onWaitingOther)
  socket.on('matchFail', onMatchFail)
  socket.on('youWin', onWin)
  socket.on('timeout', onTimeout)
  socket.on('opponentLeft', onOpponentLeft)

  // ✅ roomId 수신
  socket.on('joinedRoom', ({ roomId }) => {
    console.log('🎯 roomId 수신됨:', roomId)
    callbacks.onJoinedRoom?.(roomId)
  })

  // ✅ 상대방 닉네임 수신
  socket.on('opponentInfo', ({ nickname }) => {
    console.log('🙋 상대방 닉네임 수신됨:', nickname)
    callbacks.onReceiveOpponent?.(nickname)
  })

  // ✅ 제출 단어 수신
  socket.on('bothSubmitted', ({ a, b }) => {
    console.log('📨 단어 제출 완료:', a, b)
    callbacks.onReceiveWords?.({ a, b })
  })
}

// 연결/해제/이벤트 발생 함수
export const connectSocket = () => socket.connect()
export const disconnectSocket = () => socket.disconnect()
export const joinRoom = (nickname) => socket.emit('joinRoom', { nickname })
export const submitWord = (roomId, word) => socket.emit('submitWord', { roomId, word })
