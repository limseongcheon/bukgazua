'use client';

import { useFormStatus } from 'react-dom';
import { useEffect, useRef, useActionState, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon, User, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitSupportApplication } from '@/app/support/actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full" size="lg">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? '제출 중...' : '간병인 지원 제출'}
    </Button>
  );
}

export default function SupportForm() {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(submitSupportApplication, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setPhotoDataUri(result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (state.message) {
      if (state.errors && Object.keys(state.errors).length > 0) {
        toast({
          variant: 'destructive',
          title: '입력 오류',
          description: state.message,
        });
      } else {
        toast({
          title: '성공',
          description: state.message,
        });
        formRef.current?.reset();
        setBirthDate(undefined);
        setPhotoPreview(null);
        setPhotoDataUri('');
      }
    }
  }, [state, toast]);

  const experiences = ['신입', ...Array.from({ length: 9 }, (_, i) => `${i + 1}년`), '10년 이상'];
  const regions = ['원주', '서울 수도권', '원주외 강원지역', '충북'];

  return (
    <form ref={formRef} action={dispatch} className="space-y-6">
       <input type="hidden" name="birthDate" value={birthDate ? format(birthDate, 'yyyy-MM-dd') : ''} />
       <input type="hidden" name="photoDataUri" value={photoDataUri} />

      <div className="space-y-2">
        <Label>프로필 사진 (선택)</Label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <Image src={photoPreview} alt="프로필 사진 미리보기" width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <User className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            사진 업로드
          </Button>
          <input
            ref={photoInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">성명<span className="text-primary">*</span></Label>
          <Input id="name" name="name" required />
          {state.errors?.name && <p className="text-sm mt-1 font-medium text-destructive">{state.errors.name[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact">연락처<span className="text-primary">*</span></Label>
          <Input id="contact" name="contact" placeholder="(-)없이 숫자만 기입" required />
          {state.errors?.contact && <p className="text-sm mt-1 font-medium text-destructive">{state.errors.contact[0]}</p>}
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>성별<span className="text-primary">*</span></Label>
            <RadioGroup name="gender" className="flex items-center space-x-4 pt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="남성" id="male" />
                <Label htmlFor="male" className="font-normal">남성</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="여성" id="female" />
                <Label htmlFor="female" className="font-normal">여성</Label>
              </div>
            </RadioGroup>
            {state.errors?.gender && <p className="text-sm mt-1 font-medium text-destructive">{state.errors.gender[0]}</p>}
          </div>
          <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일<span className="text-primary">*</span></Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "PPP", { locale: ko }) : <span>날짜를 선택하세요</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={(date) => {
                      setBirthDate(date);
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
              {state.errors?.birthDate && <p className="text-sm mt-1 font-medium text-destructive">{state.errors.birthDate[0]}</p>}
          </div>
      </div>

      <div className="space-y-2">
        <Label>근무 가능 지역 (중복 선택 가능)<span className="text-primary">*</span></Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
            {regions.map(region => (
                <div key={region} className="flex items-center space-x-2">
                    <Checkbox id={`region-${region}`} name="region" value={region} />
                    <Label htmlFor={`region-${region}`} className="font-normal">{region}</Label>
                </div>
            ))}
        </div>
        {state.errors?.region && <p className="text-sm mt-1 font-medium text-destructive">{state.errors.region[0]}</p>}
      </div>
      
       <div className="space-y-2">
        <Label htmlFor="certifications">보유 자격증 (선택)</Label>
        <Input id="certifications" name="certifications" placeholder="예: 요양보호사 1급, 간호조무사" />
        {state.errors?.certifications && <p className="text-sm mt-1 font-medium text-destructive">{state.errors.certifications[0]}</p>}
      </div>

       <div className="space-y-2">
          <Label htmlFor="experience">경력<span className="text-primary">*</span></Label>
          <Select name="experience" required>
              <SelectTrigger><SelectValue placeholder="경력을 선택해주세요" /></SelectTrigger>
              <SelectContent>
                  {experiences.map(exp => <SelectItem key={exp} value={exp}>{exp}</SelectItem>)}
              </SelectContent>
          </Select>
          {state.errors?.experience && <p className="text-sm mt-1 font-medium text-destructive">{state.errors.experience[0]}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="selfIntroduction">자기소개</Label>
        <Textarea id="selfIntroduction" name="selfIntroduction" rows={5} />
         {state.errors?.selfIntroduction && <p className="text-sm mt-1 font-medium text-destructive">{state.errors.selfIntroduction[0]}</p>}
      </div>

      <div className="pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
