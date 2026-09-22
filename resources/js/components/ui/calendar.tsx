import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface CalendarProps {
  selectedDate: string
  onSelect: (date: string) => void
  minDate?: string
}

export default function Calendar({ selectedDate, onSelect, minDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date()
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onSelect(dateStr)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number)
    return (
      selYear === year &&
      selMonth === month + 1 &&
      selDay === day
    )
  }

  const isDisabled = (day: number) => {
    if (!minDate) return false
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dateStr < minDate
  }

  const renderDays = () => {
    const days = []
    
    // Empty slots for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDisabled(day)
      const selected = isSelected(day)
      const today = isToday(day)

      days.push(
        <button
          key={day}
          onClick={() => !disabled && handleDateClick(day)}
          disabled={disabled}
          className={`
            flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all
            ${disabled ? 'cursor-not-allowed text-muted-foreground/30' : 'hover:bg-highlight/20 dark:hover:bg-highlight/40'}
            ${selected ? 'bg-highlight text-black font-bold shadow-sm hover:bg-highlight/90' : ''}
            ${!selected && today ? 'border-2 border-highlight text-highlight-foreground font-bold' : ''}
            ${!selected && !disabled && !today ? 'text-foreground' : ''}
          `}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-background p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="rounded-lg p-1 hover:bg-muted"
          type="button"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-base font-bold">
          {monthNames[month]} {year}
        </span>
        <button
          onClick={handleNextMonth}
          className="rounded-lg p-1 hover:bg-muted"
          type="button"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="mb-2 grid grid-cols-7 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-xs font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 place-items-center gap-y-1">
        {renderDays()} 
      </div>
    </div>
  )
}
