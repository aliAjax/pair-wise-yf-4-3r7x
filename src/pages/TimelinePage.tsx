import { useEffect, useState } from 'react'
import { Search, Route, X, Trash2, Clock, MapPin, ArrowLeftRight, SplitSquareHorizontal } from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import {
  formatTimestamp,
  getTimeOfDay,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
  buildTimelineEntries,
  type TimelineEntry,
} from '@/utils/sceneHelpers'
import type { WindowScene } from '@/types'

/** 单条记录在列表卡片上的简要信息 */
function SceneCardBody({ scene }: { scene: WindowScene }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        {getWeatherIcon(scene.weather)}
        <span className="text-sm font-semibold text-mist-100">{scene.segment}</span>
        <span className="ml-auto rounded-full bg-dusk-400/15 px-2 py-0.5 text-[10px] text-dusk-300">
          {scene.seatDirection}侧
        </span>
      </div>
      <div className="flex items-center gap-1 mb-1.5 text-mist-400">
        <MapPin className="w-3 h-3" />
        <span className="text-xs">{scene.routeName}</span>
      </div>
      {scene.note && (
        <p className="text-xs text-mist-400 line-clamp-2">{scene.note}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        {getTreeIcon(scene.treeDensity)}
        {getPedestrianIcon(scene.pedestrianStatus)}
        {scene.signText && (
          <span className="rounded bg-teal-800/60 px-1.5 py-0.5 text-[10px] text-mist-300">
            {scene.signText}
          </span>
        )}
      </div>
    </>
  )
}

/** 详情弹窗中单侧的完整信息 */
function SceneDetailPanel({ scene, onDelete }: { scene: WindowScene; onDelete: (id: string) => void }) {
  return (
    <div className="flex flex-col rounded-xl border border-teal-800 bg-teal-950/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        {getWeatherIcon(scene.weather)}
        <span className="rounded-full bg-dusk-400/15 px-2 py-0.5 text-[11px] font-medium text-dusk-300">
          {scene.seatDirection}侧窗景
        </span>
      </div>

      <div className="space-y-2 text-xs text-mist-300">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-dusk-400" />
          <span>{formatTimestamp(scene.timestamp)}</span>
          <span className="text-teal-600">·</span>
          <span>{getTimeOfDay(scene.timestamp)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            {getTreeIcon(scene.treeDensity)}{scene.treeDensity}
          </span>
          <span className="inline-flex items-center gap-1">
            {getPedestrianIcon(scene.pedestrianStatus)}{scene.pedestrianStatus}
          </span>
        </div>
        {scene.signText && (
          <div className="rounded-lg bg-teal-800/50 px-2.5 py-1.5 text-mist-200">
            招牌：{scene.signText}
          </div>
        )}
        <div className="rounded-lg border border-teal-800 px-2.5 py-2 font-serif text-mist-200">
          {scene.note || <span className="text-mist-500">（无笔记）</span>}
        </div>
      </div>

      <button
        onClick={() => onDelete(scene.id)}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-red-900/40 py-2 text-xs text-red-300 transition-colors hover:bg-red-900/60"
      >
        <Trash2 className="w-3.5 h-3.5" />
        删除此条
      </button>
    </div>
  )
}

export default function TimelinePage() {
  const { routeNames, selectedRoute, currentRouteScenes, selectRoute, loadAll, deleteScene } =
    useSceneStore()
  const [search, setSearch] = useState('')
  // 详情定位锚点：单条即该条 id，配对为任意一方 id
  const [anchorId, setAnchorId] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const filteredRoutes = routeNames.filter((r) =>
    r.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...currentRouteScenes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  const entries = buildTimelineEntries(sorted)

  const detailEntry: TimelineEntry | null = anchorId
    ? entries.find((e) =>
        e.kind === 'single'
          ? e.scene.id === anchorId
          : e.scenes.some((s) => s.id === anchorId)
      ) ?? null
    : null

  const handleDelete = (id: string) => {
    const entry = detailEntry
    // 配对中删一条：伙伴恢复单独状态，弹窗切到伙伴
    if (entry?.kind === 'pair') {
      const survivor = entry.scenes.find((s) => s.id !== id)
      deleteScene(id)
      setAnchorId(survivor ? survivor.id : null)
    } else {
      deleteScene(id)
      setAnchorId(null)
    }
  }

  return (
    <div className="min-h-screen bg-teal-950 font-serif text-mist-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold tracking-wide text-dusk-400">
          窗景时间线
        </h1>

        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-mist-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索路线..."
              className="w-full rounded-lg border border-teal-800 bg-teal-900/60 py-2.5 pl-10 pr-4 text-sm text-mist-100 placeholder:text-mist-500 focus:border-dusk-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => selectRoute('')}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                !selectedRoute
                  ? 'bg-dusk-400 text-teal-950'
                  : 'bg-teal-900 text-mist-300 hover:bg-teal-800'
              }`}
            >
              全部
            </button>
            {filteredRoutes.map((name) => (
              <button
                key={name}
                onClick={() => selectRoute(name)}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  selectedRoute === name
                    ? 'bg-dusk-400 text-teal-950'
                    : 'bg-teal-900 text-mist-300 hover:bg-teal-800'
                }`}
              >
                <Route className="mr-1 inline w-3 h-3" />
                {name}
              </button>
            ))}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-mist-400">
            <div className="mb-4 text-6xl opacity-30">🪟</div>
            <p className="text-lg">
              {selectedRoute ? '该路线暂无窗景记录' : '选择一条路线，开始浏览窗景'}
            </p>
          </div>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-teal-800" />
            <div className="space-y-6">
              {entries.map((entry) => (
                <div key={entry.key} className="relative flex gap-4">
                  <div
                    className={`absolute -left-5 top-1 h-2.5 w-2.5 rounded-full ring-4 ring-teal-950 ${
                      entry.kind === 'pair'
                        ? 'bg-dusk-300 ring-dusk-400/20'
                        : 'bg-dusk-400'
                    }`}
                  />
                  <div className="w-20 shrink-0 pt-0.5 text-right">
                    <p className="text-xs text-dusk-400">
                      {formatTimestamp(entry.timestamp)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-mist-500">
                      {getTimeOfDay(entry.timestamp)}
                    </p>
                  </div>

                  {entry.kind === 'single' ? (
                    <button
                      onClick={() => setAnchorId(entry.scene.id)}
                      className="group flex-1 rounded-xl border border-teal-800 bg-teal-900/50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-dusk-400/40 hover:shadow-lg hover:shadow-dusk-400/10"
                    >
                      <SceneCardBody scene={entry.scene} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setAnchorId(entry.scenes[0].id)}
                      className="group flex-1 rounded-xl border border-dusk-400/30 bg-dusk-400/5 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-dusk-400/50 hover:shadow-lg hover:shadow-dusk-400/10"
                    >
                      <div className="mb-3 flex items-center gap-1.5 text-dusk-300">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium tracking-wide">左右对照</span>
                        <span className="mx-1 text-teal-700">·</span>
                        <span className="flex items-center gap-1 text-[11px] text-mist-400">
                          <MapPin className="w-3 h-3" />
                          {entry.scenes[0].routeName} · {entry.scenes[0].segment}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {entry.scenes.map((scene) => (
                          <div key={scene.id} className="min-w-0">
                            <SceneCardBody scene={scene} />
                          </div>
                        ))}
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {detailEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setAnchorId(null)}
        >
          <div
            className={`relative mx-4 w-full animate-scale-in rounded-2xl border border-teal-700 bg-teal-900 p-6 shadow-2xl ${
              detailEntry.kind === 'pair' ? 'max-w-2xl' : 'max-w-md'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAnchorId(null)}
              className="absolute right-4 top-4 z-10 text-mist-400 hover:text-mist-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {detailEntry.kind === 'single' ? (
              <>
                <div className="mb-4 flex items-center gap-3 pr-8">
                  {getWeatherIcon(detailEntry.scene.weather)}
                  <h2 className="text-xl font-bold text-dusk-400">
                    {detailEntry.scene.segment}
                  </h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-mist-300">
                    <MapPin className="w-4 h-4 text-dusk-400" />
                    <span>{detailEntry.scene.routeName}</span>
                    <span className="text-teal-600">·</span>
                    <span>{detailEntry.scene.seatDirection}侧</span>
                  </div>
                  <div className="flex items-center gap-2 text-mist-300">
                    <Clock className="w-4 h-4 text-dusk-400" />
                    <span>{formatTimestamp(detailEntry.scene.timestamp)}</span>
                    <span className="text-teal-600">·</span>
                    <span>{getTimeOfDay(detailEntry.scene.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-mist-300">
                    {getTreeIcon(detailEntry.scene.treeDensity)}
                    <span>{detailEntry.scene.treeDensity}</span>
                    {getPedestrianIcon(detailEntry.scene.pedestrianStatus)}
                    <span>{detailEntry.scene.pedestrianStatus}</span>
                  </div>
                  {detailEntry.scene.signText && (
                    <div className="rounded-lg bg-teal-800/50 px-3 py-2 text-mist-200">
                      招牌: {detailEntry.scene.signText}
                    </div>
                  )}
                  {detailEntry.scene.note && (
                    <div className="rounded-lg border border-teal-800 px-3 py-2 text-mist-300">
                      {detailEntry.scene.note}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(detailEntry.scene.id)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-red-900/40 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-900/60"
                >
                  <Trash2 className="w-4 h-4" />
                  删除此窗景
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-3 pr-8">
                  <SplitSquareHorizontal className="w-5 h-5 text-dusk-400" />
                  <h2 className="text-xl font-bold text-dusk-400">
                    {detailEntry.scenes[0].segment}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-dusk-400/15 px-2.5 py-1 text-[11px] text-dusk-300">
                    <ArrowLeftRight className="w-3 h-3" />
                    左右窗景对照
                  </span>
                </div>
                <div className="mb-3 flex items-center gap-2 text-xs text-mist-400">
                  <MapPin className="w-3.5 h-3.5 text-dusk-400" />
                  <span>{detailEntry.scenes[0].routeName}</span>
                  <span className="text-teal-600">·</span>
                  <span>
                    采样相隔
                    {(() => {
                      const gap =
                        new Date(detailEntry.scenes[1].timestamp).getTime() -
                        new Date(detailEntry.scenes[0].timestamp).getTime()
                      const mins = Math.round(gap / 60000)
                      return mins <= 0 ? '不到一分钟' : ` ${mins} 分钟`
                    })()}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {detailEntry.scenes.map((scene) => (
                    <SceneDetailPanel key={scene.id} scene={scene} onDelete={handleDelete} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
