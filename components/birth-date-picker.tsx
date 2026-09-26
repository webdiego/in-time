"use client";

import { useRef, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { enUS } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (iso: string) => (iso ? new Date(`${iso}T00:00:00`) : undefined);

/** Birth date as an ISO `yyyy-mm-dd` string; month/year dropdowns make distant years one click away. */
export function BirthDatePicker({
  id,
  value,
  onChange,
  today,
  invalid,
  describedBy,
}: {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  today: Date;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = fromIso(value);

  // Base UI would return focus to the trigger only after the close animation,
  // stealing it from whatever field the user moved to in the meantime. Do it
  // ourselves, synchronously, and only if focus is still inside the calendar.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) return;
    const active = document.activeElement;
    if (!active || active === document.body || active.closest("[data-slot=popover-content]")) {
      triggerRef.current?.focus();
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            ref={triggerRef}
            id={id}
            variant="outline"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="h-12 w-full justify-between rounded-lg bg-card px-4 text-base font-normal"
          />
        }
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected
            ? selected.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })
            : "Pick a date"}
        </span>
        <CalendarIcon className="text-muted-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        finalFocus={false}
      >
        <Calendar
          mode="single"
          locale={enUS}
          captionLayout="dropdown"
          selected={selected}
          defaultMonth={selected ?? new Date(today.getFullYear() - 30, 0)}
          startMonth={new Date(today.getFullYear() - 120, 0)}
          endMonth={today}
          disabled={{ after: today }}
          onSelect={(d) => {
            if (!d) return;
            onChange(toIso(d));
            handleOpenChange(false);
          }}
          className="rounded-lg"
        />
      </PopoverContent>
    </Popover>
  );
}
