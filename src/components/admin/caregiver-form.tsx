
'use client';

import React, { useState, useMemo, useRef, FormEvent } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Caregiver } from '@/types/caregiver-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';

const CaregiverForm = React.memo(({ onSuccess }: { onSuccess: (newCaregiver: Caregiver) => void }) => {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const experiences = useMemo(() => ['신입', ...Array.from({ length: 9 }, (_, i) => `${i + 1}년`), '10년 이상'], []);

  const validateForm = (formData: FormData) => {
    const newErrors: Record<string, string | undefined> = {};
    if (!formData.get('name')) newErrors.name = "이름은 필수입니다.";
    if (!formData.get('phone')) newErrors.phone = "전화번호는 필수입니다.";
    if (!birthDate) newErrors.birthDate = "생년월일은 필수입니다.";
    if (!formData.get('gender')) newErrors.gender = "성별은 필수입니다.";
    if (!formData.get('experience')) newErrors.experience = "경력은 필수입니다.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    const formData = new FormData(event.currentTarget);

    if (!validateForm(formData)) {
        toast({
            variant: "destructive",
            title: "입력 오류",
            description: "필수 항목을 모두 입력해주세요.",
        });
        return;
    }

    setIsSubmitting(true);

    const data = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        photoUrl: formData.get('photoUrl') as string,
        birthDate: birthDate ? format(birthDate, 'yyyy-MM-dd') : undefined,
        gender: formData.get('gender') as '남성' | '여성' | null,
        certifications: formData.get('certifications') as string,
        experience: formData.get('experience') as string,
        specialNotes: formData.get('specialNotes') as string,
    };

    try {
        const response = await fetch('/api/caregivers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || '서버에서 오류가 발생했습니다.');
        }

        if (result.success && result.newCaregiver) {
            toast({
                title: '성공',
                description: `'${result.newCaregiver.name}' 님이 성공적으로 등록되었습니다.`,
            });
            formRef.current?.reset();
            setBirthDate(undefined);
            setErrors({});
            onSuccess(result.newCaregiver);
        } else {
            throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
        }
    } catch (err: any) {
        const errorMessage = err.message || '서버 응답이 올바르지 않습니다. 다시 시도해주세요.';
        setErrors({ form: errorMessage });
        toast({
            variant: 'destructive',
            title: '오류',
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} ref={formRef} noValidate>
        <Card>
            <CardHeader>
                <CardTitle>새 간병인 등록</CardTitle>
                <CardDescription>아래 양식을 작성하여 새 간병인을 시스템에 추가합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">이름<span className="text-destructive">*</span></Label>
                        <Input id="name" name="name" placeholder="홍길동" disabled={isSubmitting} />
                        {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">전화번호<span className="text-destructive">*</span></Label>
                        <Input id="phone" name="phone" placeholder="(-) 없이 숫자만 입력" disabled={isSubmitting} />
                        {errors.phone && <p className="text-sm font-medium text-destructive">{errors.phone}</p>}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="photoUrl">사진 URL (선택)</Label>
                    <Input id="photoUrl" name="photoUrl" placeholder="https://i.imgur.com/OSsWUN6.jpg" disabled={isSubmitting} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="birthDate">생년월일<span className="text-destructive">*</span></Label>
                         <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !birthDate && "text-muted-foreground",
                                  errors.birthDate && "border-destructive"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {birthDate ? format(birthDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={birthDate}
                                onSelect={(date) => {
                                  setBirthDate(date || undefined);
                                  setIsCalendarOpen(false);
                                }}
                                captionLayout="dropdown-buttons"
                                fromYear={1940}
                                toYear={new Date().getFullYear()}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1940-01-01")
                                }
                                initialFocus
                                locale={ko}
                              />
                            </PopoverContent>
                          </Popover>
                          {errors.birthDate && <p className="text-sm font-medium text-destructive">{errors.birthDate}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gender">성별<span className="text-destructive">*</span></Label>
                        <Select name="gender" disabled={isSubmitting}>
                            <SelectTrigger className={cn(errors.gender && "border-destructive")}>
                                <SelectValue placeholder="성별 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="남성">남성</SelectItem>
                                <SelectItem value="여성">여성</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.gender && <p className="text-sm font-medium text-destructive">{errors.gender}</p>}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="certifications">보유 자격증 (쉼표로 구분)</Label>
                    <Input id="certifications" name="certifications" placeholder="예: 요양보호사 1급, 간호조무사" disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="experience">경력<span className="text-destructive">*</span></Label>
                    <Select name="experience" disabled={isSubmitting}>
                        <SelectTrigger className={cn(errors.experience && "border-destructive")}>
                            <SelectValue placeholder="경력 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            {experiences.map(exp => <SelectItem key={exp} value={exp}>{exp}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {errors.experience && <p className="text-sm font-medium text-destructive">{errors.experience}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="specialNotes">특기사항 (선택)</Label>
                    <Textarea id="specialNotes" name="specialNotes" placeholder="예: 치매 환자 돌봄 경험 풍부, 요리 가능" disabled={isSubmitting} />
                </div>

                {errors.form && <p className="text-sm font-medium text-destructive">{errors.form}</p>}
                
                <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                    {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        등록 중...
                    </>
                    ) : (
                    '간병인 추가'
                    )}
                </Button>
            </CardContent>
        </Card>
        </form>
    </div>
  );
});
CaregiverForm.displayName = 'CaregiverForm';
export default CaregiverForm;
