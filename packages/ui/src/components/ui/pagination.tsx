import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  onPageChange: (page: number) => void
}

export function Pagination(props: PaginationProps) {
  if (!props.hasNextPage && !props.hasPreviousPage) {
    return null
  }

  return (
    <div className="flex items-center justify-between space-x-2 py-4">
      <div className="text-sm text-muted-foreground">Page {props.currentPage}</div>
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => props.onPageChange(props.currentPage - 1)}
          disabled={!props.hasPreviousPage}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => props.onPageChange(props.currentPage + 1)}
          disabled={!props.hasNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
