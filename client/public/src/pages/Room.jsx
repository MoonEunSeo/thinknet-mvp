// client/src/pages/Room.jsx
import React, { useEffect, useState } from 'react'
import {
  socket,
  connectSocket,
  joinRoom,
  submitWord,
  setupSocketListeners
} from '../sockets/socket'

export default function Room() {
  const [nickname, setNickname] = useState('')
  const [step, setStep] = useState('intro')
  const [word, setWord] = useState('')
  const [roomId, setRoomId] = useState('')
  const [count, setCount] = useState(1)
  const [history, setHistory] = useState([])
  const [timer, setTimer] = useState(15)

  useEffect(() => {
    if (step === 'input') {
      const interval = setInterval(() => setTimer(t => t - 1), 1000)
      if (timer <= 0) {
        setStep('timeout')
        clearInterval(interval)
      }
      return () => clearInterval(interval)
    }
  }, [step, timer])

  useEffect(() => {
    setupSocketListeners({
      onStartGame: ({ round }) => {
        setStep('input')
        setCount(round)
        setTimer(15)
      },
      onWaiting: () => setStep('waiting'),
      onWaitingOther: () => setStep('waiting'),
      onMatchFail: ({ round }) => {
        setStep('retry')
        setCount(round)
        setTimer(15)
      },
      onWin: ({ history }) => {
        setStep('win')
        setHistory(history.map(h => h.a))
      },
      onTimeout: () => setStep('timeout'),
      onOpponentLeft: () => setStep('disconnected')
    })
  }, [])

  const handleStart = () => {
    connectSocket()
    joinRoom(nickname)
    setStep('waiting')
  }

  const handleSubmit = () => {
    submitWord(roomId, word)
    setWord('')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      {step === 'intro' && (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🕸️ 생각의 그물</h1>
          <input
            className="border px-4 py-2 rounded"
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleStart}
            disabled={!nickname.trim()}
          >
            시작하기
          </button>
        </div>
      )}

      {step === 'waiting' && (
        <p className="text-lg">🕰️ 함께 할 친구를 찾고 있어요...</p>
      )}

      {step === 'input' && (
        <div className="text-center">
          <p className="mb-1">({count}차 시도) 떠오르는 단어를 입력해주세요</p>
          <p className="text-sm text-gray-500">⏱️ {timer}초 남음</p>
          <input
            className="border px-4 py-2 rounded mt-2"
            placeholder="단어 입력"
            value={word}
            onChange={e => setWord(e.target.value)}
          />
          <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
            disabled={!word.trim()}
          >
            제출하기
          </button>
        </div>
      )}

      {step === 'retry' && (
        <div className="text-center">
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">❌ 통하지 않았어요</h2>
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded"
            onClick={() => setStep('input')}
          >
            다시 시도하기
          </button>
        </div>
      )}

      {step === 'win' && (
        <div className="text-center">
          <h2 className="text-2xl text-green-600 font-bold mb-2">🎉 통했어요!</h2>
          <p className="mb-2">You win ✅</p>
          <p className="text-sm text-gray-600">입력한 단어들: {history.join(', ')}</p>
        </div>
      )}

      {step === 'timeout' && (
        <p className="text-red-600 font-semibold">⏱️ 타임아웃! 게임 오버</p>
      )}

      {step === 'disconnected' && (
        <p className="text-red-500 font-semibold">상대방이 나갔어요. 게임이 종료됩니다.</p>
      )}
    </div>
  )
}