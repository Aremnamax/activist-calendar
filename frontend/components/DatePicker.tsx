'use client'

import { useState, useRef, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addDays, isSameMonth, isSameDay, parseISO, isValid, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  label: string
  required?: boolean
  minDate?: string
  placeholder?: string
  alignRight?: boolean
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function DatePicker({ value, onChange, label, required, minDate, placeholder = 'Выберите дату', alignRight }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? parseISO(value) : new Date()
    return isValid(d) ? d : new Date()
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const d = parseISO(value)
      if (isValid(d)) setViewDate(d)
    }
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [open])

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let d = calStart
  while (d <= calEnd) {
    days.push(d)
    d = addDays(d, 1)
  }

  const selectedDate = value ? parseISO(value) : null
  const min = minDate ? parseISO(minDate) : null

  const handleSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-prof-black/60 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/10 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/60 backdrop-blur-sm text-left flex items-center gap-2"
      >
        <svg className="w-4 h-4 text-prof-pacific shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {value ? format(parseISO(value), 'dd.MM.yyyy') : placeholder}
      </button>

      {open && (
        <div className={`absolute top-full mt-2 z-[60] w-[280px] glass-card rounded-2xl shadow-modal border border-prof-pine/10 overflow-hidden animate-modal-in ${alignRight ? 'right-0' : 'left-0'}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewDate(subMonths(viewDate, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-prof-pine/10 text-prof-black/50 hover:bg-prof-mint hover:text-prof-pine transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-bold text-prof-black capitalize">
                {format(viewDate, 'LLLL yyyy', { locale: ru })}
              </span>
              <button
                type="button"
                onClick={() => setViewDate(addMonths(viewDate, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-prof-pine/10 text-prof-black/50 hover:bg-prof-mint hover:text-prof-pine transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {(!min || startOfDay(new Date()) >= startOfDay(min)) && (
              <button
                type="button"
                onClick={() => handleSelect(new Date())}
                className="w-full mb-3 py-1.5 rounded-lg text-xs font-semibold text-prof-pacific border border-prof-pacific/40 hover:bg-prof-mint/60 transition-all"
              >
                Сегодня
              </button>
            )}

            <div className="grid grid-cols-7 gap-0.5 mb-2">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="h-8 flex items-center justify-center text-[10px] font-bold text-prof-pine uppercase">
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day) => {
                const isCurrentMonth = isSameMonth(day, viewDate)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isDisabled = min && startOfDay(day) < startOfDay(min)
                const isToday = isSameDay(day, new Date())

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={!!isDisabled}
                    onClick={() => !isDisabled && handleSelect(day)}
                    className={`h-9 rounded-lg text-sm font-semibold transition-all ${
                      isDisabled
                        ? 'text-prof-black/20 cursor-not-allowed'
                        : isSelected
                          ? 'bg-prof-pacific text-white shadow-sm'
                          : isToday
                            ? 'bg-prof-mint/60 text-prof-pine border border-prof-pacific/30'
                            : isCurrentMonth
                              ? 'text-prof-black hover:bg-prof-mint/60 hover:text-prof-pacific'
                              : 'text-prof-black/30 hover:bg-prof-mint/30'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
