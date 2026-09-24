import { create } from 'zustand'
import type { WindowScene, SceneFormData } from '@/types'
import {
  getAllScenes,
  saveScene as storageSaveScene,
  deleteScene as storageDeleteScene,
  getScenesByRoute,
  getAllRouteNames,
  getRandomScene,
  getRandomPair,
} from '@/services/storage'

interface SceneState {
  scenes: WindowScene[]
  routeNames: string[]
  currentRouteScenes: WindowScene[]
  selectedRoute: string
  /** 灵感页当前抽取结果：完整配对优先，否则单条 */
  randomPair: [WindowScene, WindowScene] | null
  randomScene: WindowScene | null

  loadAll: () => void
  /** 返回是否自动配对成功 */
  saveScene: (data: SceneFormData) => boolean
  deleteScene: (id: string) => void
  selectRoute: (routeName: string) => void
  refreshRandom: () => void
}

export const useSceneStore = create<SceneState>((set) => ({
  scenes: [],
  routeNames: [],
  currentRouteScenes: [],
  selectedRoute: '',
  randomPair: null,
  randomScene: null,

  loadAll: () => {
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => ({
      scenes,
      routeNames,
      currentRouteScenes: state.selectedRoute
        ? getScenesByRoute(state.selectedRoute)
        : state.currentRouteScenes,
    }))
  },

  saveScene: (data: SceneFormData) => {
    const scene: WindowScene = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    const saved = storageSaveScene(scene)
    const paired = !!saved.partnerId

    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => {
      const currentRouteScenes = state.selectedRoute
        ? getScenesByRoute(state.selectedRoute)
        : []
      return { scenes, routeNames, currentRouteScenes }
    })
    return paired
  },

  deleteScene: (id: string) => {
    storageDeleteScene(id)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => {
      const currentRouteScenes = state.selectedRoute
        ? getScenesByRoute(state.selectedRoute)
        : []
      // 灵感页若抽中的记录被删除，清掉对应结果
      const { randomPair, randomScene } = state
      const stillThere = (s: WindowScene | null) =>
        s ? scenes.some((x) => x.id === s.id) : false
      return {
        scenes,
        routeNames,
        currentRouteScenes,
        randomPair:
          randomPair &&
          randomPair.every((p) => scenes.some((x) => x.id === p.id))
            ? randomPair
            : null,
        randomScene: stillThere(randomScene) ? randomScene : null,
      }
    })
  },

  selectRoute: (routeName: string) => {
    const currentRouteScenes = routeName ? getScenesByRoute(routeName) : []
    set({ selectedRoute: routeName, currentRouteScenes })
  },

  refreshRandom: () => {
    // 有完整配对时只从配对中抽取，否则抽单独记录
    const pair = getRandomPair()
    if (pair) {
      set({ randomPair: pair, randomScene: null })
      return
    }
    const scene = getRandomScene()
    set({ randomPair: null, randomScene: scene })
  },
}))
