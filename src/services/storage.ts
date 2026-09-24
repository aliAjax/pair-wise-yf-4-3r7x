import type { WindowScene } from '@/types'

const STORAGE_KEY = 'bus_window_scenes'
/** 同线路、同区间、相反朝向的配对时间窗口（毫秒） */
export const PAIR_WINDOW_MS = 5 * 60 * 1000

/**
 * 读取全部记录，并对配对信息做一次自愈：
 * 旧记录没有 partnerId 字段照常使用；指向不存在记录或非双向指向的
 * partnerId 一律清空，时间线上不留下失效标记。
 */
export function getAllScenes(): WindowScene[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WindowScene[]
    if (!Array.isArray(parsed)) return []

    const byId = new Map(parsed.map((s) => [s.id, s]))
    return parsed.map((s) => {
      const partnerId = s.partnerId ?? null
      const partner = partnerId ? byId.get(partnerId) : null
      const mutual = !!partner && partner.partnerId === s.id
      // 旧记录（无 partnerId 字段）保持原样照常使用；失效引用一律清空
      if (s.partnerId === undefined) return s
      return { ...s, partnerId: mutual ? partnerId : null }
    })
  } catch {
    return []
  }
}

function writeScenes(scenes: WindowScene[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes))
}

/**
 * 保存记录时尝试自动配对：同线路、同区间、朝向相反、采样相隔五分钟内，
 * 且伙伴当前未配对；候选取时间最近的，每条记录最多配一个伙伴。
 */
export function saveScene(scene: WindowScene): WindowScene {
  const scenes = getAllScenes()
  const newTime = new Date(scene.timestamp).getTime()

  let bestId: string | null = null
  let bestGap = Infinity

  for (const s of scenes) {
    if (s.partnerId) continue
    if (s.routeName !== scene.routeName || s.segment !== scene.segment) continue
    if (s.seatDirection === scene.seatDirection) continue
    const gap = Math.abs(new Date(s.timestamp).getTime() - newTime)
    if (gap <= PAIR_WINDOW_MS && gap < bestGap) {
      bestGap = gap
      bestId = s.id
    }
  }

  const saved: WindowScene = { ...scene, partnerId: bestId }
  if (bestId) {
    for (const s of scenes) {
      if (s.id === bestId) s.partnerId = scene.id
    }
  }
  scenes.push(saved)
  writeScenes(scenes)
  return saved
}

/**
 * 删除记录：伙伴的 partnerId 一并清空，恢复为单独状态，不写失效标记。
 */
export function deleteScene(id: string): void {
  const scenes = getAllScenes().map((s) =>
    s.partnerId === id ? { ...s, partnerId: null } : s
  )
  writeScenes(scenes.filter((s) => s.id !== id))
}

export function getScenesByRoute(routeName: string): WindowScene[] {
  return getAllScenes()
    .filter((s) => s.routeName === routeName)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function getAllRouteNames(): string[] {
  const scenes = getAllScenes()
  const routeSet = new Set(scenes.map((s) => s.routeName))
  return Array.from(routeSet).sort()
}

/** 随机抽取一条未配对的单独记录 */
export function getRandomScene(): WindowScene | null {
  const singles = getAllScenes().filter((s) => !s.partnerId)
  if (singles.length === 0) return null
  return singles[Math.floor(Math.random() * singles.length)]
}

/** 随机抽取一组完整配对，双方按采样时间先后排列 */
export function getRandomPair(): [WindowScene, WindowScene] | null {
  const scenes = getAllScenes()
  const byId = new Map(scenes.map((s) => [s.id, s]))
  const pairIds = new Set<string>()
  const pairs: [WindowScene, WindowScene][] = []

  for (const s of scenes) {
    if (!s.partnerId) continue
    if (pairIds.has(s.id)) continue
    const partner = byId.get(s.partnerId)
    if (!partner || partner.partnerId !== s.id) continue
    pairIds.add(s.id)
    pairIds.add(partner.id)
    const ordered =
      new Date(s.timestamp).getTime() <= new Date(partner.timestamp).getTime()
        ? [s, partner]
        : [partner, s]
    pairs.push([ordered[0], ordered[1]])
  }

  if (pairs.length === 0) return null
  return pairs[Math.floor(Math.random() * pairs.length)]
}
