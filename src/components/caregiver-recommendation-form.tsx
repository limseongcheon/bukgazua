
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { CaregiverRecommendationOutput } from '@/types/caregiver-types';
import { getCaregiverRecommendations } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import CaregiverCard from './caregiver-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';


const formSchema = z.object({
  name: z.string().min(2, { message: '성명은 2자 이상이어야 합니다.' }),
  phone: z.string().min(10, { message: '정확한 전화번호를 입력해주세요.' }),
  patientGender: z.enum(['남성', '여성'], { required_error: '성별은 필수 항목입니다.' }),
  patientBirthDate: z.date().optional(),
  careType: z.string().optional(),
  scheduleDateRange: z.object({
      from: z.date().optional(),
      to: z.date().optional(),
  }).optional(),
  scheduleStartTime: z.string().optional(),
  scheduleEndTime: z.string().optional(),
  specificNeeds: z.string().optional(),
}).refine(data => {
    if (data.scheduleStartTime && data.scheduleEndTime) {
        return data.scheduleStartTime < data.scheduleEndTime;
    }
    return true;
}, {
    message: "종료 시간은 시작 시간보다 늦어야 합니다.",
    path: ["scheduleEndTime"],
});

const startTimeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
});

const endTimeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = (i).toString().padStart(2, '0');
    if (i === 24) return '24:00';
    return `${hour}:00`;
}).slice(1);
endTimeOptions.push('24:00');


export default function CaregiverRecommendationForm() {
  const [recommendations, setRecommendations] = useState<CaregiverRecommendationOutput['recommendations'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inquirerInfo, setInquirerInfo] = useState<{ name: string; phone: string } | null>(null);
  const { toast } = useToast();
  const [isBirthDateOpen, setIsBirthDateOpen] = useState(false);
  const [isScheduleCalendarOpen, setIsScheduleCalendarOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      patientGender: undefined,
      careType: undefined,
      scheduleDateRange: { from: undefined, to: undefined },
      scheduleStartTime: undefined,
      scheduleEndTime: undefined,
      specificNeeds: '',
    },
  });
  
  const handleNewRecommendation = () => {
    // Re-submit the form with current values.
    onSubmit(form.getValues());
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecommendations(null);
    setInquirerInfo(null);
    
    let requestedTime: string | undefined;
    if (values.scheduleStartTime && values.scheduleEndTime) {
      requestedTime = `${values.scheduleStartTime} ~ ${values.scheduleEndTime}`;
    } else if (values.scheduleStartTime) {
      requestedTime = `${values.scheduleStartTime}부터`;
    } else if (values.scheduleEndTime) {
      requestedTime = `${values.scheduleEndTime}까지`;
    }

    try {
      const fullRequest = {
        userName: values.name,
        userPhone: values.phone,
        patientGender: values.patientGender,
        patientBirthDate: values.patientBirthDate ? format(values.patientBirthDate, 'yyyy-MM-dd') : undefined,
        careType: values.careType || '유형 무관',
        requestedDateRange: values.scheduleDateRange?.from ? {
            from: format(values.scheduleDateRange.from, 'yyyy-MM-dd'),
            to: values.scheduleDateRange.to ? format(values.scheduleDateRange.to, 'yyyy-MM-dd') : format(values.scheduleDateRange.from, 'yyyy-MM-dd')
        } : undefined,
        requestedTime,
        specificNeeds: values.specificNeeds || '특별한 요구사항 없음',
      };
      const result = await getCaregiverRecommendations(fullRequest);
      if (result.recommendations.length > 0) {
        setInquirerInfo({ name: values.name, phone: values.phone });
      }
      setRecommendations(result.recommendations);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류가 발생했습니다',
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-12">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-end">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>성명<span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <Input placeholder="홍길동" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="patientGender"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>성별<span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="성별을 선택해주세요" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="남성">남성</SelectItem>
                                <SelectItem value="여성">여성</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>전화번호<span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <Input placeholder="01012345678" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="patientBirthDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>생년월일 (선택)</FormLabel>
                        <Popover open={isBirthDateOpen} onOpenChange={setIsBirthDateOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP", { locale: ko })
                                ) : (
                                    <span>날짜를 선택하세요</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                    field.onChange(date);
                                    setIsBirthDateOpen(false);
                                }}
                                captionLayout="dropdown-buttons"
                                fromYear={1930}
                                toYear={new Date().getFullYear()}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                locale={ko}
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="careType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>돌봄 유형 (선택)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value || 'none'}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="none">선택 안함</SelectItem>
                            <SelectItem value="식사보조">식사보조</SelectItem>
                            <SelectItem value="활동보조">활동보조</SelectItem>
                            <SelectItem value="위생보조">위생보조</SelectItem>
                            <SelectItem value="배변보조">배변보조</SelectItem>
                            <SelectItem value="기타">기타</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="scheduleDateRange"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>원하는 기간 (선택)</FormLabel>
                        <Popover open={isScheduleCalendarOpen} onOpenChange={setIsScheduleCalendarOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value?.from && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value?.from ? (
                                    field.value.to ? (
                                    <>
                                        {format(field.value.from, "PPP", { locale: ko })} -{" "}
                                        {format(field.value.to, "PPP", { locale: ko })}
                                    </>
                                    ) : (
                                    format(field.value.from, "PPP", { locale: ko })
                                    )
                                ) : (
                                    <span>기간을 선택하세요</span>
                                )}
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={field.value?.from}
                                selected={field.value as DateRange}
                                onSelect={(range) => {
                                    field.onChange(range);
                                    if (range?.from && range?.to) {
                                        setIsScheduleCalendarOpen(false);
                                    }
                                }}
                                numberOfMonths={1}
                                disabled={(date) =>
                                    date < new Date(new Date().setHours(0,0,0,0))
                                }
                                locale={ko}
                                captionLayout="dropdown-buttons"
                                fromYear={new Date().getFullYear()}
                                toYear={new Date().getFullYear() + 2}
                                footer={
                                  <p className="px-3 pb-2 text-sm text-center text-muted-foreground">
                                    Shift키를 누르고 날짜를 클릭하면 기간 선택이 가능합니다.
                                  </p>
                                }
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="scheduleStartTime"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>시작 시간 (선택)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value || 'none'}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none">선택 안함</SelectItem>
                                {startTimeOptions.map(time => <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="scheduleEndTime"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>종료 시간 (선택)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value || 'none'}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none">선택 안함</SelectItem>
                                {endTimeOptions.map(time => <SelectItem key={`end-${time}`} value={time}>{time}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          <FormField
            control={form.control}
            name="specificNeeds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>구체적인 필요 사항 (선택)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="예: 복약 알림, 거동 보조, 치매 경험 등"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col sm:flex-row items-center gap-4">
             {!recommendations && (
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? '매칭 찾는 중...' : '추천 받기'}
                </Button>
            )}
            {recommendations && (
                <Button type="button" variant="default" onClick={handleNewRecommendation} className="w-full sm:w-auto sm:ml-auto">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    새로 추천받기
                </Button>
            )}
          </div>
        </form>
      </Form>

      {isLoading && (
        <div className="text-center py-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">AI가 당신에게 가장 적합한 간병인을 찾고 있습니다...</p>
        </div>
      )}

      {recommendations && !isLoading && (
        <div>
           <div className="flex justify-between items-center mb-6 mt-12">
                <h3 className="text-2xl font-bold font-headline">추천 간병인 목록</h3>
            </div>
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendations.map((caregiver) => (
                <CaregiverCard key={caregiver.phone} caregiver={caregiver} inquirerInfo={inquirerInfo} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">조건에 맞는 추천 항목을 찾을 수 없습니다. 검색 조건을 수정하여 다시 시도해주세요.</p>
          )}
        </div>
      )}
    </div>
  );
}
