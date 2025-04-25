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
  onJoinedRoom // ✅ 이 부분 추가!
}) => {
  callbacks = {
    onStartGame,
    onWaiting,
    onWaitingOther,
    onMatchFail,
    onWin,
    onTimeout,
    onOpponentLeft,
    onJoinedRoom
  }

  socket.on('startGame', onStartGame)
  socket.on('waiting', onWaiting)
  socket.on('waitingOther', onWaitingOther)
  socket.on('matchFail', onMatchFail)
  socket.on('youWin', onWin)
  socket.on('timeout', onTimeout)
  socket.on('opponentLeft', onOpponentLeft)

  socket.on('joinedRoom', ({ roomId }) => {
    console.log('🎯 roomId 수신됨:', roomId)
    callbacks.onJoinedRoom?.(roomId) // ✅ 콜백 실행
  })
}

export const connectSocket = () => socket.connect()
export const disconnectSocket = () => socket.disconnect()
export const joinRoom = (nickname) => socket.emit('joinRoom', { nickname })
export const submitWord = (roomId, word) => socket.emit('submitWord', { roomId, word })
