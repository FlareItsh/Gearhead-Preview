import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import axios from 'axios'
import { useEffect, useState } from 'react'

export interface QueueData {
  queue_line_id: number
  service_order_id: number
  status: string
  created_at: string
  service_order: {
    user: {
      first_name: string
      last_name: string
    }
    details: {
      service_variant: any
      service: {
        service_name: string
      }
    }[]
  }
}

interface QueueLineTableProps {
  onAction?: (queue: QueueData) => void
  actionLabel?: string
}

export default function QueueLineTable({ onAction, actionLabel }: QueueLineTableProps) {
  const [queues, setQueues] = useState<QueueData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQueues = async () => {
    try {
      const { data } = await axios.get('/api/queues/active')
      setQueues(data)
    } catch (error) {
      console.error('Error fetching active queues:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueues()
    const interval = setInterval(fetchQueues, 30000) // refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="custom-scrollbar overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Services</TableHead>
            <TableHead>Queue</TableHead>
            {onAction && <TableHead className="text-right">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={onAction ? 4 : 3}
                className="h-24 text-center"
              >
                Loading...
              </TableCell>
            </TableRow>
          ) : queues.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={onAction ? 4 : 3}
                className="h-24 text-center text-muted-foreground"
              >
                No active queues found.
              </TableCell>
            </TableRow>
          ) : (
            queues.map((queue, index) => (
              <TableRow key={queue.queue_line_id}>
                <TableCell className="font-medium">
                  {queue.service_order?.user?.first_name || 'Customer'}{' '}
                  {queue.service_order?.user?.last_name || ''}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {(queue.service_order?.details || []).map((detail, idx) => (
                      <span
                        key={idx}
                        className="text-sm"
                      >
                        {detail.service?.service_name ||
                          detail.service_variant?.service?.service_name ||
                          'General Service'}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-lg font-bold text-highlight">#{index + 1}</TableCell>
                {onAction && (
                  <TableCell className="text-right">
                    <Button
                      variant="highlight"
                      size="sm"
                      onClick={() => onAction(queue)}
                    >
                      {actionLabel || 'Select'}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
