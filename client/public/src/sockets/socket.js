// client/src/sockets/socket.js
import { io } from "socket.io-client"

// 서버 주소 - 로컬 테스트 시 아래와 같이 사용
const URL = "https://thinknet.onrender.com"

export const socket = io(URL, {
  autoConnect: false
})

// 기본 이벤트 등록 헬퍼 (Room.jsx 등에서 사용 가능)
export const setupSocketListeners = ({
  onStartGame,
  onWaiting,
  onWaitingOther,
  onMatchFail,
  onWin,
  onTimeout,
  onOpponentLeft
}) => {
  socket.on("startGame", onStartGame)
  socket.on("waiting", onWaiting)
  socket.on("waitingOther", onWaitingOther)
  socket.on("matchFail", onMatchFail)
  socket.on("youWin", onWin)
  socket.on("timeout", onTimeout)
  socket.on("opponentLeft", onOpponentLeft)
}

// 연결, 해제, 전송 함수도 외부에서 쉽게 호출 가능하게 구성
export const connectSocket = () => socket.connect()
export const disconnectSocket = () => socket.disconnect()
export const joinRoom = (nickname) => socket.emit("joinRoom", { nickname })
export const submitWord = (roomId, word) => socket.emit("submitWord", { roomId, word })