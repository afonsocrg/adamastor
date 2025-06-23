"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/tailwind/ui/button"
import { Calendar } from "@/components/tailwind/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/tailwind/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form"

const formSchema = z.object({
  startTime: z.string().min(1, "Please select a date and time"),
})

type FormData = z.infer<typeof formSchema>

export default function CalendarFormField() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2025, 5, 12))
  const [selectedTime, setSelectedTime] = React.useState<string | null>("10:00")

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: "",
    },
  })

  const timeSlots = Array.from({ length: 37 }, (_, i) => {
    const totalMinutes = i * 15
    const hour = Math.floor(totalMinutes / 60) + 9
    const minute = totalMinutes % 60
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  })

  const bookedDates = Array.from({ length: 3 }, (_, i) => new Date(2025, 5, 17 + i))

  // Update form value when date or time changes
  React.useEffect(() => {
    if (date && selectedTime) {
      const formattedDateTime = `${date.toISOString().split("T")[0]} ${selectedTime}`
      form.setValue("startTime", formattedDateTime)
      form.clearErrors("startTime")
    } else {
      form.setValue("startTime", "")
    }
  }, [date, selectedTime, form])

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data)
    // Handle form submission here
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Meeting Time</FormLabel>
                <FormDescription>Choose your preferred date and time for the meeting.</FormDescription>
                <FormControl>
                  <Card className="gap-0 p-0">
                    <CardContent className="relative p-0 md:pr-48">
                      <div className="p-6">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          defaultMonth={date}
                          disabled={bookedDates}
                          showOutsideDays={false}
                          modifiers={{
                            booked: bookedDates,
                          }}
                          modifiersClassNames={{
                            booked: "[&>button]:line-through opacity-100",
                          }}
                          className="bg-transparent p-0 [--cell-size:2.5rem] md:[--cell-size:3rem]"
                          formatters={{
                            formatWeekdayName: (date) => {
                              return date.toLocaleString("en-US", { weekday: "short" })
                            },
                          }}
                        />
                      </div>
                      <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 md:absolute md:max-h-none md:w-48 md:border-l md:border-t-0">
                        <div className="grid gap-2">
                          {timeSlots.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTime === time ? "default" : "outline"}
                              onClick={() => setSelectedTime(time)}
                              className="w-full shadow-none"
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 border-t !py-5 px-6 md:flex-row">
                      <div className="text-sm">
                        {date && selectedTime ? (
                          <>
                            Your meeting is booked for{" "}
                            <span className="font-medium">
                              {date?.toLocaleDateString("en-US", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}{" "}
                            </span>
                            at <span className="font-medium">{selectedTime}</span>.
                          </>
                        ) : (
                          <>Select a date and time for your meeting.</>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              Book Meeting
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDate(undefined)
                setSelectedTime(null)
                form.reset()
              }}
            >
              Clear Selection
            </Button>
          </div>

          {/* Display current form value for debugging */}
          <div className="text-sm text-muted-foreground">
            <strong>Current value:</strong> {form.watch("startTime") || "None selected"}
          </div>
        </form>
      </Form>
    </div>
  )
}
