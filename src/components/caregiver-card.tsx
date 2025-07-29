'use client';

import { useState } from 'react';
import type { CaregiverRecommendationOutput } from '@/types/caregiver-types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { maskName } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, Loader2 } from 'lucide-react';
import { submitCaregiverInquiry } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type RecommendedCaregiver = CaregiverRecommendationOutput['recommendations'][0];

interface CaregiverCardProps {
  caregiver: RecommendedCaregiver;
  inquirerInfo: { name: string; phone: string } | null;
}

export default function CaregiverCard({ caregiver, inquirerInfo }: CaregiverCardProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleInquirySubmit = async () => {
        if (!inquirerInfo) {
            toast({
                title: '오류',
                description: '문의자 정보가 없습니다. 양식을 다시 작성해주세요.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        const result = await submitCaregiverInquiry({
            userName: inquirerInfo.name,
            userPhone: inquirerInfo.phone,
            caregiverName: caregiver.name,
            caregiverAge: caregiver.age,
            caregiverGender: caregiver.gender,
            caregiverPhone: caregiver.phone,
        });
        setIsSubmitting(false);

        if (result.success) {
            toast({
                title: '전송 완료',
                description: "간병인 요청을 하였습니다. 곧 연락드리겠습니다.",
            });
            setIsDialogOpen(false); // Close the dialog on success
        } else {
             toast({
                title: '전송 실패',
                description: result.message,
                variant: 'destructive',
            });
        }
    };

    const initials = caregiver.name.length > 0 ? caregiver.name.substring(0, 1) : '';

    const summary = caregiver.experience && caregiver.experience.length > 50 
        ? `${caregiver.experience.substring(0, 50)}...` 
        : caregiver.experience;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-2 cursor-pointer h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={caregiver.photoUrl || `https://placehold.co/100x100.png`} data-ai-hint="portrait professional" alt={maskName(caregiver.name)} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle>{maskName(caregiver.name)}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                        <div>
                            <h4 className="font-semibold text-sm mb-2">주요 경험</h4>
                            <p className="text-sm text-muted-foreground">{summary}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-1">적합도: {caregiver.suitabilityScore}%</h4>
                            <Progress value={caregiver.suitabilityScore} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-4">
                         <Avatar className="h-20 w-20">
                            <AvatarImage src={caregiver.photoUrl || `https://placehold.co/100x100.png`} data-ai-hint="portrait professional" alt={maskName(caregiver.name)} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl">{maskName(caregiver.name)}</DialogTitle>
                            <DialogDescription>{caregiver.age}세, {caregiver.gender}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div>
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><User size={20} className="text-primary"/> 경력 및 소개</h4>
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{caregiver.experience}</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><ShieldCheck size={20} className="text-primary"/> 보유 자격증</h4>
                         <div className="flex flex-wrap gap-2">
                            {caregiver.certifications && caregiver.certifications.length > 0 ? caregiver.certifications.map((cert) => (
                                <Badge key={cert} variant="outline">{cert}</Badge>
                            )) : <p className="text-muted-foreground text-sm">보유 자격증 없음</p>}
                        </div>
                    </div>
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">닫기</Button>
                    </DialogClose>
                    <Button onClick={handleInquirySubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        이 간병인으로 문의하기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
