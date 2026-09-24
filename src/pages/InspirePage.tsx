import { useEffect, useState } from 'react'
import { useSceneStore } from '@/store/useSceneStore'
import {
  WRITING_PROMPTS,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
  formatTimestamp,
  getTimeOfDay,
} from '@/utils/sceneHelpers'
import { Lightbulb, RefreshCw, Quote, Bus, ArrowRight, ArrowLeftRight } from 'lucide-react'
import type { WindowScene } from '@/types'

/** 灵感卡片中单侧窗景的信息 */
function SceneNoteCard({ scene }: { scene: WindowScene }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-teal-950/30 p-4">
      <div className="flex items-center justify-between gap-2 text-xs text-mist-400">
        <span className="rounded-full bg-dusk-400/15 px-2 py-0.5 text-[11px] font-medium text-dusk-300">
          {scene.seatDirection}侧
        </span>
        <span className="flex items-center gap-1">
          {getTimeOfDay(scene.timestamp)}
          <span className="text-mist-500">·</span>
          {formatTimestamp(scene.timestamp).split(' ')[1]}
          {getWeatherIcon(scene.weather)}
        </span>
      </div>

      <p className="font-serif text-lg leading-relaxed tracking-wide text-mist-100">
        {scene.note || <span className="text-mist-500">（无笔记）</span>}
      </p>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-dusk-400/10 px-2.5 py-1 text-xs text-mist-300">
          {getTreeIcon(scene.treeDensity)}
          {scene.treeDensity}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-dusk-400/10 px-2.5 py-1 text-xs text-mist-300">
          {getPedestrianIcon(scene.pedestrianStatus)}
          {scene.pedestrianStatus}
        </span>
        {scene.signText && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-dusk-400/10 px-2.5 py-1 text-xs text-mist-300">
            <Lightbulb className="w-3.5 h-3.5 text-dusk-400" />
            {scene.signText}
          </span>
        )}
      </div>
    </div>
  )
}

export default function InspirePage() {
  const { randomPair, randomScene, refreshRandom, loadAll, scenes } = useSceneStore()
  const [revealed, setRevealed] = useState(false)
  const [displayedPrompt, setDisplayedPrompt] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // 配对或单条发生变化时重新打字
  useEffect(() => {
    if (!revealed || (!randomPair && !randomScene)) return
    const idx = Math.floor(Math.random() * WRITING_PROMPTS.length)
    setDisplayedPrompt('')
    setIsTyping(true)

    const fullText = WRITING_PROMPTS[idx]
    let charIdx = 0
    const timer = setInterval(() => {
      charIdx++
      setDisplayedPrompt(fullText.slice(0, charIdx))
      if (charIdx >= fullText.length) {
        clearInterval(timer)
        setIsTyping(false)
      }
    }, 60)

    return () => clearInterval(timer)
  }, [revealed, randomPair, randomScene])

  const handlePick = () => {
    refreshRandom()
    setRevealed(true)
    setIsSpinning(false)
  }

  const handleRefresh = () => {
    setIsSpinning(true)
    setRevealed(false)
    setTimeout(() => {
      refreshRandom()
      setRevealed(true)
      setIsSpinning(false)
    }, 400)
  }

  const head = randomPair ? randomPair[0] : randomScene

  if (scenes.length === 0) {
    return (
      <div className="min-h-screen bg-teal-950 flex flex-col items-center justify-center px-6 text-center">
        <Bus className="w-16 h-16 text-dusk-400/40 mb-6" />
        <p className="text-mist-100 text-lg font-serif mb-2">还没有窗景记录</p>
        <p className="text-mist-400 text-sm">先去记录一段窗景，才能在这里采集灵感</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-teal-950 flex flex-col items-center px-4 py-8">
      {!revealed ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <button
            onClick={handlePick}
            className="group relative w-56 h-56 rounded-full bg-dusk-400/15 border-2 border-dusk-400/40
              hover:bg-dusk-400/25 hover:border-dusk-400/60 transition-all duration-500
              flex flex-col items-center justify-center gap-3
              animate-[float_3s_ease-in-out_infinite]
              shadow-[0_0_60px_rgba(212,175,125,0.08)]"
          >
            <div className="absolute inset-3 rounded-full border border-dusk-400/20" />
            <Bus className="w-10 h-10 text-dusk-400 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-mist-100 font-serif text-lg tracking-wide">采一段窗景</span>
            <span className="text-dusk-400/60 text-xs">点击随机采集</span>
          </button>
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-12px); }
            }
          `}</style>
        </div>
      ) : head ? (
        <div
          className={`w-full flex flex-col items-center gap-6 animate-[fadeUp_0.6s_ease-out] ${
            randomPair ? 'max-w-2xl' : 'max-w-lg'
          }`}
        >
          <style>{`
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(24px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes spin-once {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>

          <div className="w-full rounded-2xl bg-dusk-400/10 border border-dusk-400/30 p-6 space-y-5">
            <div className="flex items-center justify-between gap-2 text-sm text-mist-400">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-dusk-400" />
                <span className="text-mist-100 font-medium">{head.routeName}</span>
                <span className="text-mist-500">·</span>
                <span>{head.segment}</span>
              </div>
              {randomPair && (
                <span className="inline-flex items-center gap-1 rounded-full bg-dusk-400/15 px-2.5 py-1 text-[11px] text-dusk-300">
                  <ArrowLeftRight className="w-3 h-3" />
                  左右对照
                </span>
              )}
            </div>

            {randomPair ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {randomPair.map((scene) => (
                  <SceneNoteCard key={scene.id} scene={scene} />
                ))}
              </div>
            ) : randomScene ? (
              <>
                <p className="text-mist-100 font-serif text-xl leading-relaxed tracking-wide">
                  {randomScene.note}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dusk-400/10 text-mist-300 text-xs">
                    {getTreeIcon(randomScene.treeDensity)}
                    {randomScene.treeDensity}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dusk-400/10 text-mist-300 text-xs">
                    {getPedestrianIcon(randomScene.pedestrianStatus)}
                    {randomScene.pedestrianStatus}
                  </span>
                  {randomScene.signText && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dusk-400/10 text-mist-300 text-xs">
                      <Lightbulb className="w-3.5 h-3.5 text-dusk-400" />
                      {randomScene.signText}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dusk-400/10 text-mist-300 text-xs">
                    <Bus className="w-3.5 h-3.5 text-dusk-400" />
                    {randomScene.seatDirection}侧
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <div className="w-full rounded-xl bg-dusk-400/5 border border-dusk-400/15 p-5 flex gap-3">
            <Quote className="w-5 h-5 text-dusk-400/60 flex-shrink-0 mt-0.5" />
            <p className="font-serif italic text-dusk-300 text-base leading-relaxed">
              「{displayedPrompt}
              {isTyping && <span className="animate-pulse text-dusk-400">|</span>}
              」
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-dusk-400/15 border border-dusk-400/30
              hover:bg-dusk-400/25 hover:border-dusk-400/50 transition-all duration-300 text-mist-100"
          >
            <RefreshCw
              className={`w-4 h-4 text-dusk-400 ${isSpinning ? 'animate-[spin-once_0.4s_ease-in-out]' : ''}`}
            />
            <span className="font-serif text-sm">再采一段</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
