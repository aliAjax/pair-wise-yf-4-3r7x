import { MapPin, Clock, ArrowLeftRight } from 'lucide-react'
import type { WindowScene } from '@/types'
import {
  formatTimestamp,
  getTimeOfDay,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
} from '@/utils/sceneHelpers'

interface PairViewProps {
  pair: [WindowScene, WindowScene]
  /** 各侧的删除回调；提供时侧栏底部显示删除按钮（如时间线详情弹窗） */
  onDelete?: (id: string) => void
}

function SidePanel({
  scene,
  onDelete,
}: {
  scene: WindowScene
  onDelete?: (id: string) => void
}) {
  return (
    <div className="flex flex-1 flex-col gap-2.5 rounded-xl border border-teal-800 bg-teal-900/60 p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-dusk-400/15 px-2 py-0.5 text-[11px] font-medium text-dusk-300">
          {scene.seatDirection}侧
        </span>
        {getWeatherIcon(scene.weather)}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-mist-400">
        <MapPin className="w-3 h-3 shrink-0 text-dusk-400/70" />
        <span className="truncate">
          {scene.routeName} · {scene.segment}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-mist-400">
        <Clock className="w-3 h-3 shrink-0 text-dusk-400/70" />
        <span>
          {formatTimestamp(scene.timestamp)} · {getTimeOfDay(scene.timestamp)}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-mist-300">
        <span className="inline-flex items-center gap-1">
          {getTreeIcon(scene.treeDensity)}
          {scene.treeDensity}
        </span>
        <span className="inline-flex items-center gap-1">
          {getPedestrianIcon(scene.pedestrianStatus)}
          {scene.pedestrianStatus}
        </span>
      </div>

      {scene.signText && (
        <div className="rounded-lg bg-teal-800/60 px-2.5 py-1.5 text-[11px] text-mist-200">
          招牌：{scene.signText}
        </div>
      )}

      {/* 并排显示双方笔记 */}
      <div className="flex-1 rounded-lg border border-dusk-400/20 bg-dusk-400/5 px-3 py-2 font-serif text-sm leading-relaxed text-mist-200">
        {scene.note || <span className="text-mist-500">（未写笔记）</span>}
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(scene.id)}
          className="mt-1 rounded-lg bg-red-900/30 py-1.5 text-xs text-red-300/90 transition-colors hover:bg-red-900/50"
        >
          删除{scene.seatDirection}侧
        </button>
      )}
    </div>
  )
}

export default function PairView({ pair, onDelete }: PairViewProps) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-center gap-2 text-xs text-dusk-300/80">
        <ArrowLeftRight className="w-3.5 h-3.5 text-dusk-400" />
        <span className="font-serif tracking-wide">左右窗景对照</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {pair.map((scene) => (
          <SidePanel key={scene.id} scene={scene} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
