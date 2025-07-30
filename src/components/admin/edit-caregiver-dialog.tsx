'use client';

import React, { useState, useMemo, FormEvent } from 'react';
import { format, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Caregiver } from '@/types/caregiver-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const EditCaregiverDialog = ({ 
  caregiver, 
  onEditSuccess,
  onCancel
}: { 
  caregiver: Caregiver, 
  onEditSuccess: (updatedCaregiver: Caregiver) => void,
  onCancel: () => void 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    caregiver.birthDate ? startOfDay(new Date(caregiver.birthDate)) : undefined
  );
  const experiences = useMemo(() => ['신입', ...Array.from({ length: 9 }, (_, i) => `${i + 1}년`), '10년 이상'], []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const data = {
        id: caregiver.id,
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
        const response = await fetch(`/api/caregivers`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) { throw new Error(result.error || '수정 실패'); }

        toast({ title: '성공', description: '간병인 정보가 수정되었습니다.' });
        onEditSuccess(result.updatedCaregiver);
    } catch (err: any) {
        setErrors({ form: err.message });
        toast({ variant: 'destructive', title: '오류', description: err.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>간병인 정보 수정</DialogTitle>
        <DialogDescription>{caregiver.name} 님의 정보를 수정합니다. 변경사항을 저장해주세요.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-1">
        <div className="space-y-6 py-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="edit-name">이름<span className="text-destructive">*</span></Label>
                      <Input id="edit-name" name="name" defaultValue={caregiver.name} required />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="edit-phone">전화번호<span className="text-destructive">*</span></Label>
                      <Input id="edit-phone" name="phone" defaultValue={caregiver.phone} required />
                  </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="edit-photoUrl">사진 URL</Label>
                  <Input id="edit-photoUrl" name="photoUrl" defaultValue={caregiver.photoUrl || ''} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="edit-birthDate">생년월일<span className="text-destructive">*</span></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !birthDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {birthDate ? format(birthDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={birthDate} onSelect={(d) => setBirthDate(d || undefined)} captionLayout="dropdown-buttons" fromYear={1940} toYear={new Date().getFullYear()} initialFocus locale={ko} /></PopoverContent>
                      </Popover>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="edit-gender">성별<span className="text-destructive">*</span></Label>
                      <Select name="gender" defaultValue={caregiver.gender}>
                          <SelectTrigger><SelectValue placeholder="성별 선택" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="남성">남성</SelectItem>
                              <SelectItem value="여성">여성</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="edit-certifications">보유 자격증 (쉼표로 구분)</Label>
                  <Input id="edit-certifications" name="certifications" defaultValue={caregiver.certifications || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-experience">경력<span className="text-destructive">*</span></Label>
                <Select name="experience" defaultValue={caregiver.experience}>
                    <SelectTrigger><SelectValue placeholder="경력 선택" /></SelectTrigger>
                    <SelectContent>
                      {experiences.map(exp => <SelectItem key={exp} value={exp}>{exp}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="edit-specialNotes">특기사항</Label>
                  <Textarea id="edit-specialNotes" name="specialNotes" defaultValue={caregiver.specialNotes || ''} rows={5} />
              </div>
              {errors.form && <p className="text-sm font-medium text-destructive">{errors.form}</p>}
        </div>
        <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="secondary" onClick={onCancel}>취소</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                변경사항 저장
            </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default EditCaregiverDialog;
