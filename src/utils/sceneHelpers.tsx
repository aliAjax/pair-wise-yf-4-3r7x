import type { Weather, TreeDensity, PedestrianStatus, WindowScene } from '@/types'
import {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow, CloudFog,
  TreePine, TreePine as TreeSparse, Trees,
  PersonStanding, Users,
} from 'lucide-react'

export function getWeatherIcon(weather: Weather) {
  const map: Record<Weather, React.ReactNode> = {
    '晴': <Sun className="w-4 h-4 text-dusk-400" />,
    '多云': <Cloud className="w-4 h-4 text-mist-400" />,
    '阴': <Cloud className="w-4 h-4 text-mist-500" />,
    '小雨': <CloudDrizzle className="w-4 h-4 text-blue-400" />,
    '大雨': <CloudRain className="w-4 h-4 text-blue-500" />,
    '雪': <CloudSnow className="w-4 h-4 text-mist-200" />,
    '雾': <CloudFog className="w-4 h-4 text-mist-400" />,
  }
  return map[weather]
}

export function getTreeIcon(density: TreeDensity) {
  const map: Record<TreeDensity, React.ReactNode> = {
    '稀疏': <TreeSparse className="w-4 h-4 text-green-600" />,
    '适中': <TreePine className="w-4 h-4 text-green-500" />,
    '茂密': <Trees className="w-4 h-4 text-green-400" />,
  }
  return map[density]
}

export function getPedestrianIcon(status: PedestrianStatus) {
  const map: Record<PedestrianStatus, React.ReactNode> = {
    '稀少': <PersonStanding className="w-4 h-4 text-mist-400" />,
    '零星': <PersonStanding className="w-4 h-4 text-dusk-300" />,
    '密集': <Users className="w-4 h-4 text-dusk-400" />,
  }
  return map[status]
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}`
}

export function getTimeOfDay(iso: string): string {
  const h = new Date(iso).getHours()
  if (h < 6) return '深夜'
  if (h < 9) return '清晨'
  if (h < 12) return '上午'
  if (h < 14) return '中午'
  if (h < 17) return '下午'
  if (h < 19) return '傍晚'
  return '夜晚'
}

export const WRITING_PROMPTS = [
  '尝试以窗外招牌为线索，写一个关于陌生人的短篇',
  '用树木的密度变化暗示主人公的心境转折',
  '让行人的状态成为故事中某个预兆的隐喻',
  '把天气当作叙事节奏的调节器，写一段场景转换',
  '以座位方向为视角限制，写一段只看到一侧世界的独白',
  '从观察笔记中的一句话出发，展开一篇城市散文',
  '将窗景中所有招牌串联成一条线索，写一个悬疑片段',
  '用行人的姿态写一首自由诗',
  '以"窗外"为题，把这段记录扩写成五百字的微型小说',
  '从树木间隙中想象一个被遮挡的完整故事',
  '用天气和行人密度写一段氛围描写',
  '把窗景当作一幅画，为它写一段策展词',
]

export type TimelineEntry =
  | { kind: 'single'; scene: WindowScene; key: string; timestamp: string }
  | { kind: 'pair'; scenes: [WindowScene, WindowScene]; key: string; timestamp: string }

/**
 * 把记录列表整理成时间线条目：配对的两条合并为一条（按采样时间先后排列，
 * 以较早的采样时间作为条目排序依据），未配对的保持单独条目。
 */
export function buildTimelineEntries(scenes: WindowScene[]): TimelineEntry[] {
  const byId = new Map(scenes.map((s) => [s.id, s]))
  const consumed = new Set<string>()
  const entries: TimelineEntry[] = []

  for (const scene of scenes) {
    if (consumed.has(scene.id)) continue
    const partnerId = scene.partnerId
    const partner = partnerId ? byId.get(partnerId) : null
    const mutual = !!partner && partner.partnerId === scene.id

    if (partner && mutual) {
      consumed.add(scene.id)
      consumed.add(partner.id)
      const ordered: [WindowScene, WindowScene] =
        new Date(scene.timestamp).getTime() <= new Date(partner.timestamp).getTime()
          ? [scene, partner]
          : [partner, scene]
      entries.push({
        kind: 'pair',
        scenes: ordered,
        key: `pair-${scene.id}`,
        timestamp: ordered[0].timestamp,
      })
    } else {
      consumed.add(scene.id)
      entries.push({
        kind: 'single',
        scene,
        key: `single-${scene.id}`,
        timestamp: scene.timestamp,
      })
    }
  }

  return entries
}
