import * as React from 'react'
import { cn } from '@/lib/utils'

type FrostCardProps = React.ComponentProps<'div'> & {
  padded?: boolean
}

export default function FrostCard({ className, padded = true, ...props }: FrostCardProps) {
  return <div className={cn('frost-card', padded && 'p-6', className)} {...props} />
}
