import React from 'react'

interface LikertProps {
  name: string
  value?: number // 1..5
  onChange?: (val: number) => void
  labels?: [string, string, string, string, string]
}

const base =
  "w-12 h-12 md:w-14 md:h-14 grid place-items-center rounded-xl border text-slate-700 focus-ring cursor-pointer select-none transition ease-frost"

export default function LikertFrost({
  name,
  value,
  onChange,
  labels = ['1', '2', '3', '4', '5'],
}: LikertProps) {
  return (
    <div role="radiogroup" aria-label={name} className="flex gap-3">
      {([1, 2, 3, 4, 5] as const).map((n, idx) => {
        const active = value === n
        return (
          <label
            key={n}
            aria-label={labels[idx]}
            className={`${base} ${active ? 'bg-glacier text-white border-transparent' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={active}
              onChange={() => onChange?.(n)}
              className="sr-only"
            />
            {n}
          </label>
        )
      })}
    </div>
  )
}

