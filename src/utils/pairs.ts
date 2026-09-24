import type { WindowScene } from '@/types'

/** 配对的最大采样间隔（毫秒）：五分钟 */
export const PAIR_WINDOW_MS = 5 * 60 * 1000

/** 左/右朝向互为对照 */
const OPPOSITE: Record<WindowScene['seatDirection'], WindowScene['seatDirection']> = {
  左: '右',
  右: '左',
}

/** 两条记录是否满足配对条件：同线路、同区间、朝向相反、采样相隔五分钟内 */
export function canPair(a: WindowScene, b: WindowScene): boolean {
  if (a.id === b.id) return false
  if (a.routeName !== b.routeName || a.segment !== b.segment) return false
  if (a.seatDirection !== OPPOSITE[b.seatDirection]) return false
  const diff = Math.abs(new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  return diff <= PAIR_WINDOW_MS
}

/**
 * 在已保存的记录中为新记录寻找配对伙伴：
 * 仅选择尚无伙伴的记录；候选取采样时间最近的，时间差相同取采样时间较晚的。
 */
export function findPairCandidate(
  fresh: WindowScene,
  scenes: WindowScene[],
): WindowScene | null {
  let best: WindowScene | null = null
  let bestDiff = Infinity
  let bestTime = -Infinity
  const freshTime = new Date(fresh.timestamp).getTime()

  for (const s of scenes) {
    if (s.partnerId) continue
    if (!canPair(fresh, s)) continue
    const diff = Math.abs(new Date(s.timestamp).getTime() - freshTime)
    const time = new Date(s.timestamp).getTime()
    if (diff < bestDiff || (diff === bestDiff && time > bestTime)) {
      best = s
      bestDiff = diff
      bestTime = time
    }
  }
  return best
}

/** 返回记录的伙伴；伙伴不存在（已被删除）时返回 null */
export function getPartner(
  scene: WindowScene,
  scenes: WindowScene[],
): WindowScene | null {
  if (!scene.partnerId) return null
  return scenes.find((s) => s.id === scene.partnerId) ?? null
}

/**
 * 收集所有完整配对，每条配对只出现一次。
 * 返回的两侧按座位方向排列（左在前、右在后）。
 */
export function collectPairs(scenes: WindowScene[]): [WindowScene, WindowScene][] {
  const byId = new Map(scenes.map((s) => [s.id, s]))
  const seen = new Set<string>()
  const pairs: [WindowScene, WindowScene][] = []

  for (const s of scenes) {
    if (!s.partnerId || seen.has(s.id)) continue
    const partner = byId.get(s.partnerId)
    if (!partner || partner.partnerId !== s.id) continue
    seen.add(s.id)
    seen.add(partner.id)
    const [left, right] =
      s.seatDirection === '左' ? [s, partner] : [partner, s]
    pairs.push([left, right])
  }
  return pairs
}

/** 灵感页的抽取结果：有完整对照时只从配对中抽，否则抽单独记录 */
export type RandomPick =
  | { kind: 'pair'; pair: [WindowScene, WindowScene] }
  | { kind: 'single'; scene: WindowScene }

export function pickRandom(scenes: WindowScene[]): RandomPick | null {
  if (scenes.length === 0) return null
  const pairs = collectPairs(scenes)
  if (pairs.length > 0) {
    return { kind: 'pair', pair: pairs[Math.floor(Math.random() * pairs.length)] }
  }
  // 无完整对照时，只从单独记录（含伙伴已失效者）中抽取
  const byId = new Map(scenes.map((s) => [s.id, s]))
  const singles = scenes.filter((s) => {
    if (!s.partnerId) return true
    const partner = byId.get(s.partnerId)
    return !partner || partner.partnerId !== s.id
  })
  const pool = singles.length > 0 ? singles : scenes
  return { kind: 'single', scene: pool[Math.floor(Math.random() * pool.length)] }
}

/** 修复失效的配对信息：伙伴缺失或不再互指时清除 partnerId，不保留失效标记 */
export function sanitizeScenes(scenes: WindowScene[]): {
  scenes: WindowScene[]
  changed: boolean
} {
  const byId = new Map(scenes.map((s) => [s.id, s]))
  let changed = false
  const next = scenes.map((s) => {
    if (!s.partnerId) return s
    const partner = byId.get(s.partnerId)
    if (partner && partner.partnerId === s.id) return s
    changed = true
    const rest: WindowScene = { ...s }
    delete rest.partnerId
    return rest
  })
  return { scenes: next, changed }
}
