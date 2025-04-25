// ✅ Room.jsx - 클라이언트 프론트엔드
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
  const [opponentNickname, setOpponentNickname] = useState('')
  const [roomId, setRoomId] = useState(null)
  const [step, setStep] = useState('intro')
  const [word, setWord] = useState('')
  const [history, setHistory] = useState([])
  const [round, setRound] = useState(1)
  const [timer, setTimer] = useState(15)
  const [submittedWord, setSubmittedWord] = useState('')

  useEffect(() => {
    if (step === 'input') {
      setTimer(15)
      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) clearInterval(interval)
          return t - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [step, round])

  useEffect(() => {
    setupSocketListeners({
      onJoinedRoom: (id) => setRoomId(id),
      onOpponentInfo: ({ nickname }) => setOpponentNickname(nickname),
      onStartGame: ({ round }) => {
        setRound(round)
        setStep('input')
        setSubmittedWord('')
        setWord('')
      },
      onWaiting: () => setStep('waiting'),
      onWaitingOther: () => setStep('waiting'),
      onTimeout: () => setStep('timeout'),
      onOpponentLeft: () => setStep('opponentLeft'),
      onWin: ({ history }) => {
        setHistory(history)
        setStep('win')
      },
      onMatchFail: ({ round, a, b }) => {
        setHistory(prev => [...prev, {
          round: round - 1,
          words: {
            a: `${a.nickname}: [${a.word}]`,
            b: `${b.nickname}: [${b.word}]`
          }
        }])
        setRound(round)
        setSubmittedWord('')
        setWord('')
        setStep('input')
      },
      onReceiveWords: ({ a, b }) => {
        console.log('📨 제출된 단어:', a, b)
      }
    })
  }, [])

  const handleStart = () => {
    connectSocket()
    joinRoom(nickname)
    setStep('waiting')
  }

  const handleSubmit = () => {
    if (!word.trim() || !roomId) return
    setSubmittedWord(word.trim())
    submitWord(roomId, word.trim())
  }

  const handleRetry = () => {
    setNickname('')
    setOpponentNickname('')
    setRoomId(null)
    setHistory([])
    setRound(1)
    setStep('intro')
    setWord('')
    setSubmittedWord('')
    disconnectSocket()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      {step === 'intro' && (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🕸️ 생각의 그물</h1>
          <input
            className="border px-4 py-2 rounded"
            placeholder="닉네임 입력"
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
        <div className="text-center w-full max-w-md">
          {history.length > 0 && (
            <div className="border rounded p-2 mb-4 bg-white">
              <p className="font-semibold mb-2">💬 이전 라운드 기록</p>
              {Object.entries(history[history.length - 1].words).map(([key, value]) => (
                <p key={key}>{value}</p>
              ))}
            </div>
          )}

          <p className="mb-1 font-medium">({round}차 시도) 생각나는 단어를 입력해주세요</p>
          <p className="text-sm text-gray-500 mb-2">⏱️ {timer}초 남음</p>
          <input
            className="border px-4 py-2 rounded"
            placeholder="단어 입력"
            value={word}
            onChange={e => setWord(e.target.value)}
            disabled={!!submittedWord}
          />
          <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
            disabled={!word.trim() || !!submittedWord}
          >
            제출하기
          </button>
          {submittedWord && (
            <p className="text-green-600 mt-2 text-sm">제출이 완료되었습니다. 입력단어: {submittedWord}</p>
          )}
        </div>
      )}

      {step === 'win' && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">🎉 통했어요!</h2>
          <p>총 라운드 수: {history.length}</p>
          <ul className="mt-2 text-sm">
            {history.map((h, i) => (
              <li key={i}>[{i + 1}차] {Object.values(h.words).join(' vs ')}</li>
            ))}
          </ul>
        </div>
      )}

      {step === 'timeout' && (
        <div className="text-center">
          <p className="text-red-600 font-semibold">⏱️ 타임아웃! 게임 오버</p>
          <button className="mt-4 px-4 py-2 bg-gray-600 text-white rounded" onClick={handleRetry}>다시하기</button>
        </div>
      )}

      {step === 'opponentLeft' && (
        <div className="text-center">
          <p className="text-red-600 font-semibold">상대방이 나갔어요.</p>
          <button className="mt-4 px-4 py-2 bg-gray-600 text-white rounded" onClick={handleRetry}>처음으로</button>
        </div>
      )}
    </div>
  )
}
