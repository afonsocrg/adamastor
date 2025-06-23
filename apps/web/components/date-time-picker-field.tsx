"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/tailwind/ui/button"
import { Calendar } from "@/components/tailwind/ui/calendar"
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/tailwind/ui/popover"
import { ScrollArea } from "@/components/tailwind/ui/scroll-area"
import { cn } from "@/lib/utils"

interface DateTimePickerFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export default function DateTimePickerField({ 
  value, 
  onChange, 
  label = "Date and time",
  placeholder = "Select date and time",
  disabled = false
}: DateTimePickerFieldProps) {
  const [open, setOpen] = React.useState(false)
  
  // Parse the value prop to extract date and time
  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (value) {
      const dateObj = new Date(value)
      return isNaN(dateObj.getTime()) ? undefined : dateObj
    }
    return undefined
  })
  
  // Default to 18:00 if no time is selected
  const [selectedTime, setSelectedTime] = React.useState<string | null>(() => {
    if (value && date) {
      const dateObj = new Date(value)
      const hours = dateObj.getHours().toString().padStart(2, "0")
      const minutes = dateObj.getMinutes().toString().padStart(2, "0")
      return `${hours}:${minutes}`
    }
    return "18:00" // Default to 18:00
  })

  // Generate time slots from 09:00 to 21:00 in 15-minute intervals
  const timeSlots = React.useMemo(() => {
    const slots = []
    const startHour = 9
    const endHour = 21
    
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        // Stop at 21:00 (no slots after)
        if (h === endHour && m > 0) break
        
        slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
      }
    }
    
    return slots
  }, [])

  // Update parent form when date or time changes
  React.useEffect(() => {
    if (date && selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      
      const year = newDate.getFullYear()
      const month = (newDate.getMonth() + 1).toString().padStart(2, "0")
      const day = newDate.getDate().toString().padStart(2, "0")
      const formattedDateTime = `${year}-${month}-${day}T${selectedTime}`
      
      onChange(formattedDateTime)
    } else {
      onChange("")
    }
  }, [date, selectedTime, onChange])

  // Auto-scroll to selected time (default 18:00) when popover opens
  React.useEffect(() => {
    if (open && selectedTime) {
      // Small delay to ensure the popover is rendered
      setTimeout(() => {
        const timeButton = document.querySelector(`[data-time="${selectedTime}"]`)
        if (timeButton) {
          timeButton.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
    }
  }, [open, selectedTime])

  const getDisplayText = () => {
    if (date && selectedTime) {
      return `${format(date, "PPP")} at ${selectedTime}`
    }
    return placeholder
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    // If time is already selected and we just picked a date, close the popover
    if (newDate && selectedTime) {
      setOpen(false)
    }
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    // If date is already selected and we just picked a time, close the popover
    if (date) {
      setOpen(false)
    }
  }

  return (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && !selectedTime && "text-muted-foreground"
              )}
              disabled={disabled}
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {getDisplayText()}
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[auto]" align="start" sideOffset={5}>
          <div className="flex h-[340px]">
            <div className="flex-1 p-3 flex items-center justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  // Disable past dates
                  return date < new Date(new Date().setHours(0, 0, 0, 0))
                }}
                showOutsideDays={false}
                weekStartsOn={1} // Monday
                className="rounded-md border-0"
                fixedWeeks
              />
            </div>
            <div className="border-l w-32 flex-shrink-0">
              <ScrollArea className="h-full">
                <div className="p-2 pb-0">
                  <div className="flex flex-col gap-1">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "ghost"}
                        onClick={() => handleTimeSelect(time)}
                        className="w-full justify-start text-sm font-normal h-8 min-h-[2rem]"
                        size="sm"
                        data-time={time}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )
}