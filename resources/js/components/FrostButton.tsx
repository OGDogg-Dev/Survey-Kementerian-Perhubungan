import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FrostButtonProps = React.ComponentProps<typeof Button>

export default function FrostButton({ className, variant = 'default', ...props }: FrostButtonProps) {
  return (
    <Button
      variant={variant as any}
      className={cn('rounded-xl', className)}
      {...props}
    />
  )
}

