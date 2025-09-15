import * as React from 'react'
import { cn } from '@/lib/utils'

export default function StepperProgress({ current, total, className }: { current: number; total: number; className?: string }) {
  const pct = Math.round((Math.min(Math.max(current, 1), Math.max(1, total)) / Math.max(1, total)) * 100)
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Langkah <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">{current}<span className="opacity-60">/ {total}</span></span>
        </div>
        <div
          className="sejuk-progress h-1.5 w-40 sm:w-48 md:w-56 overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Kemajuan survei"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="sejuk-progress-bar h-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-2 hidden md:flex items-center gap-1">
        {Array.from({ length: Math.max(1, total) }, (_, i) => (
          <span key={i} className={cn('step-dot', i < current && 'active')} />
        ))}
      </div>
    </div>
  )
}

