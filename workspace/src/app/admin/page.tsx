import { getCaregivers } from '@/lib/caregivers';
import CaregiverForm from '@/components/admin/caregiver-form';
import CaregiverTable from '@/components/admin/caregiver-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LogoutButton from '@/components/admin/logout-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { unstable_noStore as noStore } from 'next/cache';


export default async function AdminPage() {
  noStore();
  const caregivers = await getCaregivers();

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-10">
        <div className="text-left">
          <h1 className="text-4xl font-bold">관리자 페이지</h1>
          <p className="text-muted-foreground mt-2">등록된 간병인 정보를 확인하고 시스템 설정을 관리하세요.</p>
        </div>
        <LogoutButton />
      </div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-2 border">
          <TabsTrigger value="register">새 간병인 등록</TabsTrigger>
          <TabsTrigger value="manage">간병인 관리</TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="mt-6">
            <div className="max-w-2xl mx-auto">
                <CaregiverForm />
            </div>
        </TabsContent>
        <TabsContent value="manage" className="mt-6">
          <Card>
              <CardHeader>
                  <CardTitle>등록된 간병인 목록</CardTitle>
                  <CardDescription>{caregivers.length}명의 간병인이 등록되어 있습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                  <CaregiverTable caregivers={caregivers} />
              </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
