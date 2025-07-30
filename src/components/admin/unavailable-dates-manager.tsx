'use client';

import React, { useState, useMemo, useRef, FormEvent, useCallback } from 'react';
import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Caregiver } from '@/types/caregiver-types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';

const UnavailableDatesManager = ({ caregiver, onEditSuccess }: { caregiver: Caregiver, onEditSuccess: (c: Caregiver) => void }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const lastSelectedDay = useRef<Date | null>(null);

    // Use string representations ('yyyy-MM-dd') for state to avoid timezone issues
    const [unavailableDateStrings, setUnavailableDateStrings] = useState<Set<string>>(
        new Set((caregiver.unavailableDates || []).map(d => format(startOfDay(new Date(d)), 'yyyy-MM-dd')))
    );

    // Convert string set to Date array for the calendar component
    const unavailableDates = useMemo(() => Array.from(unavailableDateStrings).map(dStr => new Date(dStr)), [unavailableDateStrings]);
  
    const handleDayClick = useCallback((day: Date | undefined, modifiers: { selected?: boolean }, e: React.MouseEvent) => {
        if (!day) return; // Ignore undefined day clicks

        const dayStr = format(day, 'yyyy-MM-dd');
        let newUnavailableStrings: Set<string>;

        if (e.shiftKey && lastSelectedDay.current) {
            const currentStrings = new Set(unavailableDateStrings);
            const start = lastSelectedDay.current < day ? lastSelectedDay.current : day;
            const end = lastSelectedDay.current > day ? lastSelectedDay.current : day;
            const daysInRange = differenceInDays(end, start);
            
            for(let i = 0; i <= daysInRange; i++) {
                const dateInRangeStr = format(addDays(start, i), 'yyyy-MM-dd');
                currentStrings.add(dateInRangeStr);
            }
            newUnavailableStrings = currentStrings;
        } else {
            // Regular click toggles a single day
            const currentStrings = new Set(unavailableDateStrings);
            if (currentStrings.has(dayStr)) {
                currentStrings.delete(dayStr);
            } else {
                currentStrings.add(dayStr);
            }
            newUnavailableStrings = currentStrings;
        }

        lastSelectedDay.current = day;
        
        // Update local state immediately for responsiveness
        setUnavailableDateStrings(newUnavailableStrings);
        
        // Send update to server
        updateDatesOnServer(Array.from(newUnavailableStrings));
    }, [unavailableDateStrings]);

    const handleClearDates = useCallback(() => {
        setUnavailableDateStrings(new Set());
        updateDatesOnServer([]);
        lastSelectedDay.current = null;
    }, []);
    
    const updateDatesOnServer = useCallback(async (datesAsStrings: string[]) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/caregivers`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: caregiver.id,
                    unavailableDates: datesAsStrings
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || '날짜 업데이트 실패');
            
            toast({ title: '성공', description: '근무 불가 날짜가 업데이트되었습니다.' });
            onEditSuccess(result.updatedCaregiver);

            // Sync state with server response to be safe
            setUnavailableDateStrings(new Set(result.updatedCaregiver.unavailableDates || []));

        } catch (err: any) {
            toast({ variant: 'destructive', title: '오류', description: err.message });
            // Revert state on failure
            setUnavailableDateStrings(new Set((caregiver.unavailableDates || []).map(d => format(startOfDay(new Date(d)), 'yyyy-MM-dd'))));
        } finally {
            setIsLoading(false);
        }
    }, [caregiver.id, caregiver.unavailableDates, onEditSuccess, toast]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        unavailableDates.length > 0 ? `${unavailableDates.length}일 선택됨` : '날짜 선택'
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="multiple"
                    min={0}
                    selected={unavailableDates}
                    onDayClick={handleDayClick}
                    disabled={isLoading}
                    locale={ko}
                    footer={
                      <div className="p-2 border-t flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearDates}
                          disabled={isLoading || unavailableDates.length === 0}
                        >
                          전체 해제
                        </Button>
                      </div>
                    }
                />
            </PopoverContent>
        </Popover>
    );
};

export default UnavailableDatesManager;
