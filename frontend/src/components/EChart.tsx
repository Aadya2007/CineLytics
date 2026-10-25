import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { cn } from '../lib/utils'

export const CHART_COLORS = ['#a78bfa', '#d946ef', '#818cf8', '#f5c518', '#34d399', '#f472b6']

export const CHART_BASE = {
  backgroundColor: 'transparent',
  textStyle: { fontFamily: 'Inter, system-ui, sans-serif', color: '#b6b6c9' },
}

interface Props {
  option: echarts.EChartsOption
  className?: string
  notMerge?: boolean
}

/** Thin React wrapper around an ECharts instance with auto-resize. */
export default function EChart({ option, className, notMerge = true }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | undefined>(undefined)

  useEffect(() => {
    if (!el.current) return
    chart.current = echarts.init(el.current)
    const ro = new ResizeObserver(() => chart.current?.resize())
    ro.observe(el.current)
    return () => {
      ro.disconnect()
      chart.current?.dispose()
    }
  }, [])

  useEffect(() => {
    chart.current?.setOption({ ...CHART_BASE, ...option }, notMerge)
  }, [option, notMerge])

  return <div ref={el} className={cn('h-full w-full', className)} />
}
