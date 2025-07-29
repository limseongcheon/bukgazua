import InsuranceClaimForm from '@/components/forms/insurance-claim-form';
import FamilyInsuranceClaimForm from '@/components/forms/family-insurance-claim-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText } from 'lucide-react';

export default function InsuranceClaimPage() {
  return (
    <div className="py-12 md:py-20 bg-secondary">
      <div className="container max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
                <div className="bg-primary text-primary-foreground p-3 rounded-full">
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <CardTitle>보험서류 청구</CardTitle>
                    <CardDescription>필요한 보험 관련 서류를 요청합니다.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="regular">
              <TabsList className="grid w-full grid-cols-2 h-12 p-1 gap-4">
                <TabsTrigger
                  value="regular"
                  className="text-base font-semibold transition-all duration-300 rounded-md border
                             border-accent/50 bg-background text-foreground
                             data-[state=active]:bg-accent/80 data-[state=active]:text-accent-foreground data-[state=active]:border-accent
                             hover:bg-accent/10 data-[state=active]:hover:bg-accent"
                >
                  당사 간병인
                </TabsTrigger>
                <TabsTrigger
                  value="family"
                  className="text-base font-semibold transition-all duration-300 rounded-md border
                             border-primary/50 bg-background text-foreground
                             data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:border-primary
                             hover:bg-primary/10 data-[state=active]:hover:bg-primary"
                >
                  가족 간병인
                </TabsTrigger>
              </TabsList>
              <TabsContent value="regular" className="pt-6">
                <InsuranceClaimForm />
              </TabsContent>
              <TabsContent value="family" className="pt-6">
                <FamilyInsuranceClaimForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
