import { cn } from '@/lib/utils'

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="flex-1">{children}</div>
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between bg-sidebar py-4 px-4 border-b">
      <div>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div>{children}</div>}
    </div>
  )
}

export function PageContent({
  children,
  noPadding,
  className,
}: {
  children: React.ReactNode
  noPadding?: boolean
  className?: string
}) {
  return <div className={cn('flex-1', !noPadding && 'p-4', className)}>{children}</div>
}
