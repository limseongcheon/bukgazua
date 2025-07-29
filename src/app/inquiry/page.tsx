import GeneralInquiryForm from '@/components/forms/general-inquiry-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function InquiryPage() {
  return (
    <div className="py-12 md:py-20 bg-secondary">
      <div className="container max-w-2xl mx-auto">
        <Card className="shadow-lg">
           <CardHeader>
              <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground p-3 rounded-full">
                      <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                      <CardTitle>일반 문의</CardTitle>
                      <CardDescription>서비스, 이용방법 등 궁금한 점을 문의하세요.</CardDescription>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
            <GeneralInquiryForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
