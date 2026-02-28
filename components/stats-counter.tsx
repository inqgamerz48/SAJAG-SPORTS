'use client'

import { useEffect, useRef, useState } from 'react'
import { Award, Users, Wrench, TrendingUp } from 'lucide-react'
import { useInView } from 'framer-motion'

interface Stat {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  color: string
}

const stats: Stat[] = [
  {
    icon: <Wrench className="h-8 w-8" />,
    value: 450,
    suffix: '+',
    label: 'Racquets Repaired',
    color: 'text-brand-orange',
  },
  {
    icon: <Award className="h-8 w-8" />,
    value: 3,
    suffix: '+',
    label: 'Years Experience',
    color: 'text-brand-blue',
  },
  {
    icon: <Users className="h-8 w-8" />,
    value: 100,
    suffix: '%',
    label: 'Customer Satisfaction',
    color: 'text-brand-red',
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    value: 900,
    suffix: '+',
    label: 'Happy Customers',
    color: 'text-brand-orange',
  },
]

function StatItem({ stat, index }: { stat: Stat, index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let startTime: number | null = null
    const duration = 2000
    const start = 0
    const end = stat.value
    let frameId: number

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * (end - start) + start))

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [isInView, stat.value])

  const getGradientClass = () => {
    if (stat.color.includes('orange')) return 'gradient-orange brand-glow-orange'
    if (stat.color.includes('blue')) return 'gradient-blue brand-glow-blue'
    return 'gradient-red brand-glow-red'
  }

  return (
    <div ref={ref} className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-lg animate-float ${getGradientClass()}`}>
        {stat.icon}
      </div>
      <div className="mb-2">
        <span className="text-4xl font-bold text-gray-900">
          {count}
        </span>
        <span className="text-2xl font-bold text-gray-900">
          {stat.suffix}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
    </div>
  )
}

export function StatsCounter() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <StatItem key={index} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
