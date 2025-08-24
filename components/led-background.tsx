"use client"

import { useEffect, useRef, useCallback } from "react"

interface Pixel {
  x: number
  y: number
  intensity: number
  targetIntensity: number
  hue: number
  lastUpdate: number
}

export function LEDBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const pixelsRef = useRef<Pixel[]>([])
  const mouseRef = useRef({ x: 0, y: 0, isActive: false })
  const dimensionsRef = useRef({ width: 0, height: 0, cols: 0, rows: 0 })

  const PIXEL_SIZE = 5
  const PIXEL_GAP = 1
  const GRID_SIZE = PIXEL_SIZE + PIXEL_GAP

  const initializePixels = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const width = window.innerWidth
    const height = window.innerHeight

    canvas.width = width
    canvas.height = height

    const cols = Math.floor(width / GRID_SIZE)
    const rows = Math.floor(height / GRID_SIZE)

    dimensionsRef.current = { width, height, cols, rows }

    const pixels: Pixel[] = []

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        pixels.push({
          x: col * GRID_SIZE + GRID_SIZE / 2,
          y: row * GRID_SIZE + GRID_SIZE / 2,
          intensity: Math.random() * 0.1,
          targetIntensity: 0,
          hue: Math.random() * 360,
          lastUpdate: Date.now(),
        })
      }
    }

    pixelsRef.current = pixels
  }, [])

  const createWaveEffect = useCallback((centerX: number, centerY: number, time: number) => {
    const pixels = pixelsRef.current
    const waveRadius = ((time % 2000) / 2000) * 300 // Onda se expande até 300px
    const waveWidth = 50

    pixels.forEach((pixel) => {
      const distance = Math.sqrt(Math.pow(pixel.x - centerX, 2) + Math.pow(pixel.y - centerY, 2))

      // Efeito de onda circular
      if (Math.abs(distance - waveRadius) < waveWidth) {
        const waveIntensity = 1 - Math.abs(distance - waveRadius) / waveWidth
        pixel.targetIntensity = Math.max(pixel.targetIntensity, waveIntensity * 0.8)
        pixel.hue = (time / 10 + distance / 5) % 360
      }
    })
  }, [])

  const createFluidEffect = useCallback((time: number) => {
    const pixels = pixelsRef.current
    const { cols, rows } = dimensionsRef.current

    pixels.forEach((pixel, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)

      // Efeito de fluido usando funções seno/cosseno
      const wave1 = Math.sin(col * 0.1 + time * 0.003) * 0.5 + 0.5
      const wave2 = Math.cos(row * 0.1 + time * 0.002) * 0.5 + 0.5
      const wave3 = Math.sin((col + row) * 0.05 + time * 0.004) * 0.5 + 0.5

      const fluidIntensity = wave1 * wave2 * wave3 * 0.6
      pixel.targetIntensity = Math.max(pixel.targetIntensity, fluidIntensity)

      // Mudança gradual de cor
      pixel.hue = (time / 20 + col * 2 + row * 3) % 360
    })
  }, [])

  const createFireEffect = useCallback((time: number) => {
    const pixels = pixelsRef.current
    const { cols, rows } = dimensionsRef.current

    pixels.forEach((pixel, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)

      // Efeito de chamas subindo de baixo
      const heightFactor = (rows - row) / rows
      const noise = Math.sin(col * 0.3 + time * 0.005) * Math.cos(row * 0.2 + time * 0.003)
      const fireIntensity = heightFactor * (0.3 + noise * 0.4) * (Math.random() * 0.3 + 0.7)

      if (fireIntensity > 0.1) {
        pixel.targetIntensity = Math.max(pixel.targetIntensity, fireIntensity * 0.7)
        // Cores de fogo: vermelho para amarelo
        pixel.hue = Math.max(0, Math.min(60, fireIntensity * 120 + Math.random() * 20))
      }
    })
  }, [])

  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    mouseRef.current = { x: clientX, y: clientY, isActive: true }

    // Reset após 2 segundos
    setTimeout(() => {
      mouseRef.current.isActive = false
    }, 2000)
  }, [])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const time = Date.now()
    const pixels = pixelsRef.current

    // Limpar canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Aplicar efeitos baseados no tempo
    const effectCycle = (time / 5000) % 3 // Ciclo de 15 segundos, 3 efeitos

    if (effectCycle < 1) {
      createFluidEffect(time)
    } else if (effectCycle < 2) {
      createFireEffect(time)
    } else {
      // Efeito de ondas aleatórias
      if (Math.random() < 0.02) {
        createWaveEffect(Math.random() * canvas.width, Math.random() * canvas.height, time)
      }
    }

    // Efeito interativo do mouse/toque
    if (mouseRef.current.isActive) {
      createWaveEffect(mouseRef.current.x, mouseRef.current.y, time)
    }

    // Atualizar e renderizar pixels
    pixels.forEach((pixel) => {
      // Suavizar transição de intensidade
      const timeDelta = time - pixel.lastUpdate
      const lerpSpeed = Math.min(timeDelta / 100, 1)

      pixel.intensity += (pixel.targetIntensity - pixel.intensity) * lerpSpeed * 0.1
      pixel.targetIntensity *= 0.95 // Decay natural
      pixel.lastUpdate = time

      // Renderizar pixel se tiver intensidade suficiente
      if (pixel.intensity > 0.01) {
        const alpha = Math.min(pixel.intensity, 1)
        const saturation = 70 + pixel.intensity * 30
        const lightness = 30 + pixel.intensity * 50

        ctx.fillStyle = `hsla(${pixel.hue}, ${saturation}%, ${lightness}%, ${alpha})`
        ctx.fillRect(pixel.x - PIXEL_SIZE / 2, pixel.y - PIXEL_SIZE / 2, PIXEL_SIZE, PIXEL_SIZE)

        // Efeito de brilho para pixels mais intensos
        if (pixel.intensity > 0.5) {
          ctx.shadowColor = `hsl(${pixel.hue}, 100%, 60%)`
          ctx.shadowBlur = pixel.intensity * 10
          ctx.fillRect(pixel.x - PIXEL_SIZE / 2, pixel.y - PIXEL_SIZE / 2, PIXEL_SIZE, PIXEL_SIZE)
          ctx.shadowBlur = 0
        }
      }
    })

    animationRef.current = requestAnimationFrame(animate)
  }, [createWaveEffect, createFluidEffect, createFireEffect])

  useEffect(() => {
    initializePixels()
    animate()

    const handleResize = () => {
      initializePixels()
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleInteraction(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (touch) {
        handleInteraction(touch.clientX, touch.clientY)
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        handleInteraction(touch.clientX, touch.clientY)
      }
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchstart", handleTouchStart)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchstart", handleTouchStart)
    }
  }, [initializePixels, animate, handleInteraction])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" style={{ background: "#000000" }} />
}
