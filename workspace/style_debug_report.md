// Force re-commit
'use client';

import { useEffect, useState, useMemo, useRef, FormEvent, useCallback } from 'react';
import React from 'react';
import Image from 'next/image';
import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Caregiver } from '@/types/caregiver-types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import LogoutButton from '@/components/admin/logout-button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon, Trash2, Pencil, X, Info, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CaregiverStatusSelect from '@/components/admin/caregiver-status-select';


// CaregiverForm component handles adding new caregivers.
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

const ActionToolbar = React.memo(({ selectedCount, isDeleting, onDelete }: { selectedCount: number, isDeleting: boolean, onDelete: () => void }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-muted p-2 rounded-md mb-4 flex items-center justify-between transition-all duration-300">
       <span className="text-sm font-medium text-muted-foreground">{selectedCount}명 선택됨</span>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            disabled={isDeleting}
            size="sm"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            선택 항목 삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedCount}명의 간병인 정보가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className={buttonVariants({ variant: "destructive" })}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
ActionToolbar.displayName = 'ActionToolbar';

const CaregiverTable = React.memo(({ 
    caregivers, 
    selectedRowIds,
    isDeleting,
    onSelectAll,
    onSelectRow,
    onDeleteSelected,
    onEditSuccess,
    onEditRequest
}: { 
    caregivers: Caregiver[]; 
    selectedRowIds: number[];
    isDeleting: boolean;
    onSelectAll: (checked: boolean | string) => void;
    onSelectRow: (id: number, checked: boolean | string) => void;
    onDeleteSelected: () => void;
    onEditSuccess: (updatedCaregiver: Caregiver) => void;
    onEditRequest: (caregiver: Caregiver) => void;
}) => {
    if (!caregivers || caregivers.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">일치하는 간병인이 없습니다.</div>;
    }

    return (
        <TooltipProvider>
            <div className="space-y-4">
              <ActionToolbar selectedCount={selectedRowIds.length} isDeleting={isDeleting} onDelete={onDeleteSelected} />
              <div className="relative max-h-[70vh] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-secondary">
                    <TableRow>
                      <TableHead className="w-[50px] sticky left-0 bg-secondary z-10">
                          <Checkbox 
                              onCheckedChange={onSelectAll}
                              checked={selectedRowIds.length === caregivers.length && caregivers.length > 0}
                              aria-label="모두 선택"
                          />
                      </TableHead>
                      <TableHead className="min-w-[70px]">사진</TableHead>
                      <TableHead className="min-w-[120px] sticky left-[50px] bg-secondary z-10">이름</TableHead>
                      <TableHead className="min-w-[150px]">연락처</TableHead>
                      <TableHead className="min-w-[120px]">생년월일</TableHead>
                      <TableHead className="min-w-[80px]">성별</TableHead>
                      <TableHead className="min-w-[150px] text-center">상태</TableHead>
                      <TableHead className="min-w-[200px]">자격증</TableHead>
                      <TableHead className="min-w-[120px]">경력</TableHead>
                      <TableHead className="min-w-[250px]">특기사항</TableHead>
                      <TableHead className="min-w-[180px] text-center">
                          <div className='flex items-center justify-center gap-1'>
                              근무 불가 날짜
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className='text-sm p-1 max-w-xs'>
                                      <p>날짜를 클릭하여 근무 불가일을 토글합니다.</p>
                                      <p className='mt-1'>
                                        <span className='font-bold'>Shift + 클릭</span>으로 기간 선택이 가능합니다.
                                      </p>
                                    </div>
                                  </TooltipContent>
                              </Tooltip>
                          </div>
                      </TableHead>
                      <TableHead className="min-w-[100px] text-center sticky right-0 bg-secondary z-10">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caregivers.map((caregiver) => (
                      <TableRow key={caregiver.id} data-state={selectedRowIds.includes(caregiver.id) ? "selected" : ""}>
                          <TableCell className="sticky left-0 z-10 data-[state=selected]:bg-muted bg-background">
                              <Checkbox 
                                  onCheckedChange={(checked) => onSelectRow(caregiver.id, checked)}
                                  checked={selectedRowIds.includes(caregiver.id)}
                                  aria-label={`${caregiver.name} 선택`}
                              />
                          </TableCell>
                          <TableCell>
                              <Avatar>
                                  <AvatarImage src={caregiver.photoUrl} alt={caregiver.name} />
                                  <AvatarFallback>{caregiver.name.substring(0,1)}</AvatarFallback>
                              </Avatar>
                          </TableCell>
                          <TableCell className="sticky left-[50px] z-10 font-medium data-[state=selected]:bg-muted bg-background">{caregiver.name}</TableCell>
                          <TableCell>{caregiver.phone || '-'}</TableCell>
                          <TableCell>{caregiver.birthDate ? format(new Date(caregiver.birthDate), 'yyyy-MM-dd') : '-'}</TableCell>
                          <TableCell>{caregiver.gender || '-'}</TableCell>
                            <TableCell>
                            <CaregiverStatusSelect caregiver={caregiver} onStatusChange={onEditSuccess} />
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                              <Tooltip>
                                  <TooltipTrigger>
                                      <p>{caregiver.certifications || '-'}</p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>{caregiver.certifications || '자격증 정보 없음'}</p>
                                  </TooltipContent>
                              </Tooltip>
                          </TableCell>
                          <TableCell>{caregiver.experience || '-'}</TableCell>
                          <TableCell className="max-w-[250px] truncate">
                              <Tooltip>
                                  <TooltipTrigger>
                                      <p>{caregiver.specialNotes || '-'}</p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p className="max-w-xs whitespace-pre-wrap">{caregiver.specialNotes || '특기사항 없음'}</p>
                                  </TooltipContent>
                              </Tooltip>
                          </TableCell>
                          <TableCell>
                              <UnavailableDatesManager caregiver={caregiver} onEditSuccess={onEditSuccess} />
                          </TableCell>
                          <TableCell className="text-center sticky right-0 z-10 data-[state=selected]:bg-muted bg-background">
                            <Button variant="ghost" size="icon" onClick={() => onEditRequest(caregiver)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">수정</span>
                            </Button>
                          </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
        </TooltipProvider>
    );
});
CaregiverTable.displayName = 'CaregiverTable';

// EditCaregiverDialog Component
const EditCaregiverDialog = React.memo(({ 
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
});
EditCaregiverDialog.displayName = 'EditCaregiverDialog';


const UnavailableDatesManager = React.memo(({ caregiver, onEditSuccess }: { caregiver: Caregiver, onEditSuccess: (c: Caregiver) => void }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const lastSelectedDay = useRef<Date | null>(null);

    const [unavailableDateStrings, setUnavailableDateStrings] = useState<Set<string>>(
        new Set((caregiver.unavailableDates || []).map(d => format(startOfDay(new Date(d)), 'yyyy-MM-dd')))
    );

    const unavailableDates = useMemo(() => Array.from(unavailableDateStrings).map(dStr => new Date(dStr)), [unavailableDateStrings]);
  
    const handleDayClick = useCallback((day: Date | undefined, modifiers: { selected?: boolean }, e: React.MouseEvent) => {
        if (!day) return;

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
            const currentStrings = new Set(unavailableDateStrings);
            if (currentStrings.has(dayStr)) {
                currentStrings.delete(dayStr);
            } else {
                currentStrings.add(dayStr);
            }
            newUnavailableStrings = currentStrings;
        }

        lastSelectedDay.current = day;
        
        setUnavailableDateStrings(newUnavailableStrings);
        
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

            setUnavailableDateStrings(new Set(result.updatedCaregiver.unavailableDates || []));

        } catch (err: any) {
            toast({ variant: 'destructive', title: '오류', description: err.message });
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
});
UnavailableDatesManager.displayName = 'UnavailableDatesManager';


// Main AdminPage Component
export default function AdminPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("register");
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(null);

  useEffect(() => {
    const fetchCaregivers = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/caregivers');
          const data = await response.json();
          if(!response.ok) {
              throw new Error(data.error || '간병인 목록을 불러오지 못했습니다.')
          }
          const sortedData = (data || []).sort((a: Caregiver, b: Caregiver) => (b.id || 0) - (a.id || 0));
          setCaregivers(sortedData);
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: '오류',
            description: error.message || '간병인 목록을 불러오지 못했습니다.',
          });
          setCaregivers([]);
        } finally {
          setIsLoading(false);
        }
    };
    fetchCaregivers();
  }, [toast]);

  const filteredCaregivers = useMemo(() => {
    if (!searchTerm) return caregivers;
    return caregivers.filter(caregiver =>
      caregiver.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [caregivers, searchTerm]);

  const handleAddSuccess = useCallback((newCaregiver: Caregiver) => {
    setCaregivers((prev) => [newCaregiver, ...prev].sort((a,b) => (b.id || 0) - (a.id || 0)));
    setActiveTab("manage");
  }, []);

  const handleEditSuccess = useCallback((updatedCaregiver: Caregiver) => {
    setCaregivers(prev => prev.map(c => c.id === updatedCaregiver.id ? updatedCaregiver : c));
    setEditingCaregiver(null);
  }, []);

  const handleDeleteSuccess = useCallback((deletedIds: number[]) => {
      setCaregivers(prev => prev.filter(c => !deletedIds.includes(c.id)));
  }, []);

  const handleSelectAllRows = useCallback((checked: boolean | string) => {
    setSelectedRowIds(checked ? filteredCaregivers.map(c => c.id) : []);
  }, [filteredCaregivers]);

  const handleSelectRow = useCallback((id: number, checked: boolean | string) => {
      setSelectedRowIds(prev => checked ? [...prev, id] : prev.filter(rowId => rowId !== id));
  }, []);

  const handleDeleteSelectedRows = useCallback(async () => {
      setIsDeleting(true);
      try {
          const response = await fetch('/api/caregivers', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: selectedRowIds }),
          });
          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.error || '삭제 중 오류가 발생했습니다.');
          }
          toast({
              title: "성공",
              description: `${result.count}명의 간병인이 삭제되었습니다.`
          });
          handleDeleteSuccess(selectedRowIds);
          setSelectedRowIds([]);
      } catch (err: any) {
           toast({
              variant: 'destructive',
              title: '오류',
              description: err.message,
          });
      } finally {
          setIsDeleting(false);
      }
  }, [selectedRowIds, handleDeleteSuccess, toast]);
  
  const handleEditRequest = useCallback((caregiver: Caregiver) => {
    setEditingCaregiver(caregiver);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCaregiver(null);
  }, []);

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">관리자 페이지</h1>
          <p className="text-muted-foreground mt-2">간병인 정보를 등록하고 관리합니다.</p>
        </div>
        <LogoutButton />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register">새 간병인 등록</TabsTrigger>
          <TabsTrigger value="manage">간병인 관리</TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="mt-6">
            <CaregiverForm onSuccess={handleAddSuccess} />
        </TabsContent>
        <TabsContent value="manage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>등록된 간병인 목록</CardTitle>
              <div className="flex justify-between items-center gap-4 pt-2">
                <CardDescription>{caregivers.length}명의 간병인이 등록되어 있습니다.</CardDescription>
                <div className="relative w-full max-w-xs">
                  <Input 
                    placeholder="이름으로 검색..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CaregiverTable 
                    caregivers={filteredCaregivers} 
                    selectedRowIds={selectedRowIds}
                    isDeleting={isDeleting}
                    onSelectAll={handleSelectAllRows}
                    onSelectRow={handleSelectRow}
                    onDeleteSelected={handleDeleteSelectedRows}
                    onEditSuccess={handleEditSuccess} 
                    onEditRequest={handleEditRequest}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={!!editingCaregiver} onOpenChange={(open) => !open && handleCancelEdit()}>
        {editingCaregiver && (
           <EditCaregiverDialog 
              caregiver={editingCaregiver} 
              onEditSuccess={handleEditSuccess}
              onCancel={handleCancelEdit}
           />
        )}
      </Dialog>
    </div>
  );
}