import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { BuildingLayout, DistrictLayout } from './types.ts'

interface MemoryCitySceneProps {
  readonly buildings: readonly BuildingLayout[]
  readonly districts: readonly DistrictLayout[]
  readonly onFailure: () => void
  readonly onHover: (building: BuildingLayout | null, x: number, y: number) => void
  readonly onSelect: (building: BuildingLayout) => void
  readonly resetToken: number
  readonly selectedPath: string
}

interface SceneState {
  buildings: readonly BuildingLayout[]
  controls: OrbitControls
  districts: THREE.Group
  mesh: THREE.InstancedMesh
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  transitionFrame: number
}

const cameraHome = new THREE.Vector3(70, 72, 82)
const dummy = new THREE.Object3D()

const setBuildingMatrices = (
  mesh: THREE.InstancedMesh,
  buildings: readonly BuildingLayout[],
  previousByPath?: ReadonlyMap<string, BuildingLayout>,
  progress = 1,
): void => {
  const color = new THREE.Color()
  const previousColor = new THREE.Color()
  const targetColor = new THREE.Color()
  for (let index = 0; index < buildings.length; index++) {
    const building = buildings[index]
    const previous = previousByPath?.get(building.path)
    const from = previous || { ...building, depth: 0.001, height: 0.001, width: 0.001 }
    const x = THREE.MathUtils.lerp(from.x, building.x, progress)
    const z = THREE.MathUtils.lerp(from.z, building.z, progress)
    const height = THREE.MathUtils.lerp(from.height, building.height, progress)
    dummy.position.set(x, height / 2 + 0.12, z)
    dummy.scale.set(
      THREE.MathUtils.lerp(from.width, building.width, progress),
      Math.max(0.001, height),
      THREE.MathUtils.lerp(from.depth, building.depth, progress),
    )
    dummy.updateMatrix()
    mesh.setMatrixAt(index, dummy.matrix)
    targetColor.set(building.color)
    if (previous) {
      color.copy(previousColor.set(previous.color)).lerp(targetColor, progress)
    } else {
      color.copy(targetColor)
    }
    mesh.setColorAt(index, color)
  }
  mesh.count = buildings.length
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true
  }
}

const updateDistricts = (group: THREE.Group, districts: readonly DistrictLayout[]): void => {
  group.clear()
  for (const district of districts) {
    const geometry = new THREE.BoxGeometry(district.width, district.height, district.depth)
    const material = new THREE.MeshStandardMaterial({
      color: district.depth === 1 ? 0x111d33 : 0x0c1729,
      metalness: 0.24,
      opacity: 0.86,
      roughness: 0.78,
      transparent: true,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(district.x, district.height / 2, district.z)
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: district.depth === 1 ? 0x33527b : 0x243b5d, opacity: 0.75, transparent: true }),
    )
    edges.position.copy(mesh.position)
    group.add(mesh, edges)
  }
}

const createScene = (container: HTMLDivElement): SceneState => {
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.append(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x060b16)
  scene.fog = new THREE.FogExp2(0x060b16, 0.0095)
  const camera = new THREE.PerspectiveCamera(47, container.clientWidth / Math.max(1, container.clientHeight), 0.1, 500)
  camera.position.copy(cameraHome)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.075
  controls.maxDistance = 190
  controls.maxPolarAngle = Math.PI * 0.48
  controls.minDistance = 18
  controls.target.set(0, 4, 0)

  scene.add(new THREE.HemisphereLight(0x9fc9ff, 0x09101f, 1.25))
  const keyLight = new THREE.DirectionalLight(0xcadfff, 2.4)
  keyLight.position.set(44, 80, 22)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  scene.add(keyLight)
  const magentaLight = new THREE.PointLight(0xe03aa6, 32, 110, 2)
  magentaLight.position.set(-38, 28, -18)
  scene.add(magentaLight)
  const cyanLight = new THREE.PointLight(0x24d5de, 28, 105, 2)
  cyanLight.position.set(34, 20, 34)
  scene.add(cyanLight)

  const grid = new THREE.GridHelper(180, 60, 0x243c64, 0x102039)
  grid.position.y = -0.08
  scene.add(grid)

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial({ metalness: 0.18, roughness: 0.44 })
  const mesh = new THREE.InstancedMesh(geometry, material, 20_000)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  scene.add(mesh)

  const districts = new THREE.Group()
  scene.add(districts)

  const state: SceneState = { buildings: [], controls, districts, mesh, renderer, scene, transitionFrame: 0 }
  const resize = (): void => {
    const width = container.clientWidth
    const height = Math.max(1, container.clientHeight)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)

  let frame = 0
  const render = (): void => {
    controls.update()
    renderer.render(scene, camera)
    frame = requestAnimationFrame(render)
  }
  render()

  Object.assign(state, {
    dispose() {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(state.transitionFrame)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      container.replaceChildren()
    },
    camera,
  })
  return state
}

export const MemoryCityScene = ({ buildings, districts, onFailure, onHover, onSelect, resetToken, selectedPath }: MemoryCitySceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<(SceneState & { camera: THREE.PerspectiveCamera; dispose: () => void }) | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }
    try {
      stateRef.current = createScene(container) as SceneState & { camera: THREE.PerspectiveCamera; dispose: () => void }
    } catch (error) {
      console.error('Failed to initialize Memory City WebGL renderer', error)
      onFailure()
      return
    }
    const state = stateRef.current
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const getHit = (event: PointerEvent): BuildingLayout | null => {
      const bounds = state.renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      raycaster.setFromCamera(pointer, state.camera)
      const hit = raycaster.intersectObject(state.mesh, false)[0]
      return hit?.instanceId === undefined ? null : state.buildings[hit.instanceId] || null
    }
    const handleMove = (event: PointerEvent): void => {
      const building = getHit(event)
      state.renderer.domElement.style.cursor = building ? 'pointer' : 'grab'
      onHover(building, event.clientX, event.clientY)
    }
    const handleLeave = (): void => onHover(null, 0, 0)
    const handleClick = (event: PointerEvent): void => {
      const building = getHit(event)
      if (building) {
        onSelect(building)
      }
    }
    state.renderer.domElement.addEventListener('pointermove', handleMove)
    state.renderer.domElement.addEventListener('pointerleave', handleLeave)
    state.renderer.domElement.addEventListener('click', handleClick)
    return () => {
      state.renderer.domElement.removeEventListener('pointermove', handleMove)
      state.renderer.domElement.removeEventListener('pointerleave', handleLeave)
      state.renderer.domElement.removeEventListener('click', handleClick)
      state.dispose()
      stateRef.current = null
    }
  }, [onFailure, onHover, onSelect])

  useEffect(() => {
    const state = stateRef.current
    if (!state) {
      return
    }
    cancelAnimationFrame(state.transitionFrame)
    const previousByPath = new Map(state.buildings.map((building) => [building.path, building]))
    state.buildings = buildings
    updateDistricts(state.districts, districts)
    const startedAt = performance.now()
    const transition = (now: number): void => {
      const linearProgress = Math.min(1, (now - startedAt) / 700)
      const progress = 1 - (1 - linearProgress) ** 3
      setBuildingMatrices(state.mesh, buildings, previousByPath, progress)
      if (linearProgress < 1) {
        state.transitionFrame = requestAnimationFrame(transition)
      }
    }
    state.transitionFrame = requestAnimationFrame(transition)
    return () => cancelAnimationFrame(state.transitionFrame)
  }, [buildings, districts])

  useEffect(() => {
    const state = stateRef.current
    if (!state) {
      return
    }
    state.camera.position.copy(cameraHome)
    state.controls.target.set(0, 4, 0)
    state.controls.update()
  }, [resetToken])

  useEffect(() => {
    const state = stateRef.current
    const selected = buildings.find((building) => building.path === selectedPath)
    if (!state || !selected) {
      return
    }
    const distance = Math.max(13, Math.min(38, selected.height * 1.8 + 10))
    state.controls.target.set(selected.x, selected.height * 0.35, selected.z)
    state.camera.position.set(selected.x + distance, selected.height + distance * 0.65, selected.z + distance)
  }, [buildings, selectedPath])

  return <div className="Scene" ref={containerRef} aria-label="Interactive three-dimensional memory city" />
}
