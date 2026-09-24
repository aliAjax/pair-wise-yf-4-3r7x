import { useEffect, useState } from 'react'
import { Search, Route, X, Trash2, Clock, MapPin, ArrowLeftRight } from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import {
  formatTimestamp,
  getTimeOfDay,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
} from '@/utils/sceneHelpers'
import { getPartner } from '@/utils/pairs'
import PairView from '@/components/PairView'
import type { WindowScene } from '@/types'

/** 详情状态：配对记录并排显示，单条记录显示原有详情 */
type Detail =
  | { kind: 'pair'; pair: [WindowScene, WindowScene] }
  | { kind: 'single'; scene: WindowScene }

export default function TimelinePage() {
  const { scenes, routeNames, selectedRoute, currentRouteScenes, selectRoute, loadAll, deleteScene } =
    useSceneStore()
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<Detail | null>(null)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const filteredRoutes = routeNames.filter((r) =>
    r.toLowerCase().includes(search.toLowerCase())
  )

  // 配对记录按各自的采样时间排列在时间线上
  const sorted = [...currentRouteScenes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const openDetail = (scene: WindowScene) => {
    const partner = getPartner(scene, scenes)
    if (partner) {
      const pair: [WindowScene, WindowScene] =
        scene.seatDirection === '左' ? [scene, partner] : [partner, scene]
      setDetail({ kind: 'pair', pair })
    } else {
      setDetail({ kind: 'single', scene })
    }
  }

  /** 删除一条后，其伙伴恢复单独状态：若正在对照弹窗中则切换为伙伴的单条详情 */
  const handleDelete = (id: string) => {
    if (detail?.kind === 'pair') {
      const remaining = detail.pair.find((s) => s.id !== id) ?? null
      deleteScene(id)
      if (remaining) {
        const live = useSceneStore.getState().scenes.find((s) => s.id === remaining.id)
        setDetail(live ? { kind: 'single', scene: live } : null)
      } else {
        setDetail(null)
      }
    } else {
      deleteScene(id)
      setDetail(null)
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

        {sorted.length === 0 ? (
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
              {sorted.map((scene) => {
                const paired = Boolean(getPartner(scene, scenes))
                return (
                  <div key={scene.id} className="relative flex gap-4">
                    <div
                      className={`absolute -left-5 top-1 h-2.5 w-2.5 rounded-full ring-4 ring-teal-950 ${
                        paired ? 'bg-dusk-300' : 'bg-dusk-400'
                      }`}
                    />
                    <div className="w-20 shrink-0 pt-0.5 text-right">
                      <p className="text-xs text-dusk-400">
                        {formatTimestamp(scene.timestamp)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-mist-500">
                        {getTimeOfDay(scene.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={() => openDetail(scene)}
                      className={`group flex-1 rounded-xl border bg-teal-900/50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                        paired
                          ? 'border-dusk-400/40 hover:border-dusk-300/70 hover:shadow-dusk-400/15'
                          : 'border-teal-800 hover:border-dusk-400/40 hover:shadow-dusk-400/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getWeatherIcon(scene.weather)}
                        <span className="text-sm font-semibold text-mist-100">
                          {scene.segment}
                        </span>
                        {paired && (
                          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-dusk-400/15 px-2 py-0.5 text-[10px] text-dusk-300">
                            <ArrowLeftRight className="w-3 h-3" />
                            左右对照
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-1.5 text-mist-400">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">{scene.routeName}</span>
                        <span className="mx-1 text-teal-700">·</span>
                        <span className="text-xs">{scene.seatDirection}侧</span>
                      </div>
                      {scene.note && (
                        <p className="text-xs text-mist-400 line-clamp-2">
                          {scene.note}
                        </p>
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
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDetail(null)}
        >
          <div
            className={`relative mx-4 w-full animate-scale-in rounded-2xl border border-teal-700 bg-teal-900 p-6 shadow-2xl ${
              detail.kind === 'pair' ? 'max-w-2xl' : 'max-w-md'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDetail(null)}
              className="absolute right-4 top-4 z-10 text-mist-400 hover:text-mist-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {detail.kind === 'pair' ? (
              <PairView pair={detail.pair} onDelete={handleDelete} />
            ) : (
              <SingleDetail scene={detail.scene} onDelete={handleDelete} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SingleDetail({
  scene,
  onDelete,
}: {
  scene: WindowScene
  onDelete: (id: string) => void
}) {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        {getWeatherIcon(scene.weather)}
        <h2 className="text-xl font-bold text-dusk-400">{scene.segment}</h2>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-mist-300">
          <MapPin className="w-4 h-4 text-dusk-400" />
          <span>{scene.routeName}</span>
          <span className="text-teal-600">·</span>
          <span>{scene.seatDirection}侧</span>
        </div>
        <div className="flex items-center gap-2 text-mist-300">
          <Clock className="w-4 h-4 text-dusk-400" />
          <span>{formatTimestamp(scene.timestamp)}</span>
          <span className="text-teal-600">·</span>
          <span>{getTimeOfDay(scene.timestamp)}</span>
        </div>
        <div className="flex items-center gap-3 text-mist-300">
          {getTreeIcon(scene.treeDensity)}
          <span>{scene.treeDensity}</span>
          {getPedestrianIcon(scene.pedestrianStatus)}
          <span>{scene.pedestrianStatus}</span>
        </div>
        {scene.signText && (
          <div className="rounded-lg bg-teal-800/50 px-3 py-2 text-mist-200">
            招牌: {scene.signText}
          </div>
        )}
        {scene.note && (
          <div className="rounded-lg border border-teal-800 px-3 py-2 text-mist-300">
            {scene.note}
          </div>
        )}
      </div>

      <button
        onClick={() => onDelete(scene.id)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-red-900/40 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-900/60"
      >
        <Trash2 className="w-4 h-4" />
        删除此窗景
      </button>
    </>
  )
}
