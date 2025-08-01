import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-[var(--text-primary)]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 p-0 opacity-50 hover:opacity-100 rounded-md transition-colors flex items-center justify-center",
          "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-[var(--text-secondary)] rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md transition-colors flex items-center justify-center",
          "text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:from-blue-600 focus:to-blue-700 shadow-lg backdrop-blur-lg scale-105 border border-white/20",
        day_today: "bg-[var(--surface-secondary)] text-[var(--text-primary)] font-semibold",
        day_outside:
          "day-outside text-[var(--text-secondary)] opacity-50 aria-selected:bg-[var(--surface-secondary)] aria-selected:text-[var(--text-secondary)]",
        day_disabled: "text-[var(--text-secondary)] opacity-30",
        day_range_middle:
          "aria-selected:bg-[var(--surface-secondary)] aria-selected:text-[var(--text-primary)]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
