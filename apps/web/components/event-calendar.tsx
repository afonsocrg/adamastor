"use client";

import { cn } from "@/lib/utils";
import { enGB } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker, type DayProps } from "react-day-picker";
import { buttonVariants } from "./tailwind/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  eventDates?: Date[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null;
};

// Helper function to check if two dates are on the same day
function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function EventCalendar({
  className,
  classNames,
  showOutsideDays = true,
  eventDates = [],
  onDateClick,
  selectedDate,
  ...props
}: CalendarProps) {
  // Convert event dates to a Set of date strings for faster lookup
  const eventDateStrings = React.useMemo(() => {
    return new Set(eventDates.map((date) => date.toISOString().split("T")[0]));
  }, [eventDates]);

  // Custom day component that shows dots for events and handles clicks
  const CustomDay = ({ date, ...dayProps }: DayProps) => {
    const dateString = date.toLocaleDateString("en-CA"); // 'YYYY-MM-DD' format in local time

    const hasEvent = eventDateStrings.has(dateString);
    const isToday = new Date().toLocaleDateString("en-CA") === dateString;
    const isSelected = selectedDate && isSameDay(date, selectedDate);

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Date clicked:", date, "Has event:", hasEvent, "onDateClick exists:", !!onDateClick);
      if (hasEvent && onDateClick) {
        onDateClick(date);
      }
    };

    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center h-9 w-9 rounded-md transition-all",
          // Today styling
          isToday && "bg-accent !text-[#28aeb8] text-accent-foreground font-medium",
          // Selected date styling
          isSelected && "bg-[#dff6f7] text-[#28aeb8] font-bold",
          // Event day styling (when not selected or today)
          hasEvent && !isToday && !isSelected && "font-medium text-[#104357] dark:text-[#E3F2F7] hover:bg-accent/50",
          // Non-event day styling
          !hasEvent && !isToday && !isSelected && "text-muted-foreground opacity-60",
          // Cursor styling
          hasEvent && "cursor-pointer",
          !hasEvent && "cursor-default",
        )}
        onClick={handleClick}
      >
        <div className="flex h-full w-full items-center justify-center">{date.getDate()}</div>
        {hasEvent && (
          <div
            className={cn("absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-[#04C9D8]", isSelected && " bg-[#28aeb8]")}
          />
        )}
      </div>
    );
  };

  return (
    <DayPicker
      locale={enGB}
      showOutsideDays={showOutsideDays}
      defaultMonth={new Date()}
      className={cn("p-3", className)}
      onDayClick={(day) => {
        console.log("DayPicker onDayClick:", day);
        if (onDateClick) {
          onDateClick(day);
        }
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 animate-in",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-6",
        caption_label: "font-medium absolute left-2 text-[#104357] dark:text-[#E3F2F7]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent border-0 p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute right-8",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-semibold text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative rounded-md transition-all",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground/50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Day: CustomDay,
      }}
      {...props}
    />
  );
}

EventCalendar.displayName = "EventCalendar";

export { EventCalendar };
