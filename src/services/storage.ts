import type { WindowScene } from '@/types'
import { findPairCandidate, sanitizeScenes } from '@/utils/pairs'

const STORAGE_KEY = 'bus_window_scenes'

function persist(scenes: WindowScene[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes))
}

export function getAllScenes(): WindowScene[] {
  let scenes: WindowScene[] = []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) scenes = JSON.parse(raw) as WindowScene[]
  } catch {
    return []
  }
  // 旧记录缺少 partnerId 照常使用；失效的配对信息就地清理，不留失效标记
  const { scenes: cleaned, changed } = sanitizeScenes(scenes)
  if (changed) persist(cleaned)
  return cleaned
}

/**
 * 保存新记录并尝试自动配对：
 * 同线路、同区间、采样相隔五分钟内、朝向相反的两条记录互配，
 * 每条记录只配一个伙伴；候选取采样时间最近的。
 * 返回 true 表示本次保存成功配对。
 */
export function saveScene(scene: WindowScene): boolean {
  const scenes = getAllScenes()
  const candidate = findPairCandidate(scene, scenes)
  if (candidate) {
    scene.partnerId = candidate.id
    candidate.partnerId = scene.id
  }
  scenes.push(scene)
  persist(scenes)
  return candidate !== null
}

/**
 * 删除一条记录：其伙伴恢复单独状态（清除 partnerId），
 * 时间线不保留任何失效标记。
 */
export function deleteScene(id: string): void {
  const scenes = getAllScenes()
  const target = scenes.find((s) => s.id === id)
  const next = scenes.filter((s) => s.id !== id)
  if (target?.partnerId) {
    const partner = next.find((s) => s.id === target.partnerId)
    if (partner) delete partner.partnerId
  }
  persist(next)
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
