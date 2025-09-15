import * as React from 'react'
import { cn } from '@/lib/utils'

export default function FrostCard({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('frost-card p-6', className)} {...props} />
}

