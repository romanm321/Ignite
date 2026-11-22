'use client'

import { useEffect, useRef } from 'react'

type Spark = { x: number; y: number; vx: number; vy: number; life: number; age: number; color: string; size: number }
type Rocket = { x: number; y: number; targetY: number; vy: number; color: string; trail: { x: number; y: number }[] }

const palette = ['#7CFF3F', '#FFD54A', '#FFFFFF', '#5BE7C4', '#FF8AD8', '#8AB4FF']

/** A canvas of rockets and bursts that fills its parent. Decorative, so it is hidden from assistive tech. */
export function Fireworks({ durationMs = 6500 }: { durationMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const sparks: Spark[] = []
    const rockets: Rocket[] = []
    const start = performance.now()
    let last = start
    let nextLaunch = 0
    let frame = 0

    const launch = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      rockets.push({
        x: w * (0.15 + Math.random() * 0.7),
        y: h,
        targetY: h * (0.12 + Math.random() * 0.35),
        vy: -(h * 0.9),
        color: palette[Math.floor(Math.random() * palette.length)],
        trail: [],
      })
    }

    const explode = (r: Rocket) => {
      const count = 70
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.1
        const speed = 60 + Math.random() * 130
        sparks.push({
          x: r.x,
          y: r.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.1 + Math.random() * 0.8,
          age: 0,
          color: Math.random() < 0.25 ? '#FFFFFF' : r.color,
          size: 1.6 + Math.random() * 1.6,
        })
      }
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const elapsed = now - start

      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

      if (elapsed < durationMs - 1800 && elapsed >= nextLaunch) {
        launch()
        nextLaunch = elapsed + 380 + Math.random() * 420
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        r.y += r.vy * dt
        r.trail.push({ x: r.x, y: r.y })
        if (r.trail.length > 10) r.trail.shift()
        ctx.lineWidth = 2
        ctx.strokeStyle = r.color
        ctx.globalAlpha = 0.8
        ctx.beginPath()
        r.trail.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
        ctx.stroke()
        if (r.y <= r.targetY) {
          explode(r)
          rockets.splice(i, 1)
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.age += dt
        if (s.age >= s.life) {
          sparks.splice(i, 1)
          continue
        }
        s.vy += 90 * dt
        s.vx *= 0.985
        s.x += s.vx * dt
        s.y += s.vy * dt
        ctx.globalAlpha = 1 - s.age / s.life
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      if (elapsed < durationMs || sparks.length > 0 || rockets.length > 0) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [durationMs])

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
}
