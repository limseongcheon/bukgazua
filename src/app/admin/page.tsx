'use client';

import { useEffect, useState, useMemo, useRef, FormEvent, useCallback } from 'react';
import React from 'react';
import { format, startOfDay } from 'date-fns';
import type { Caregiver } from '@/types/caregiver-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import LogoutButton from '@/components/admin/logout-button';
import CaregiverForm from '@/components/admin/caregiver-form';
import CaregiverTable from '@/components/admin/caregiver-table';
import EditCaregiverDialog from '@/components/admin/edit-caregiver-dialog';

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
