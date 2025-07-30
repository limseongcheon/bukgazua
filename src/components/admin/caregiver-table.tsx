'use client';

import React, { memo } from 'react';
import { format } from 'date-fns';
import type { Caregiver } from '@/types/caregiver-types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Info, Pencil, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CaregiverStatusSelect from '@/components/admin/caregiver-status-select';
import UnavailableDatesManager from '@/components/admin/unavailable-dates-manager';

const ActionToolbar = memo(({ selectedCount, isDeleting, onDelete }: { selectedCount: number, isDeleting: boolean, onDelete: () => void }) => {
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

const CaregiverTable = ({ 
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
};

export default CaregiverTable;
