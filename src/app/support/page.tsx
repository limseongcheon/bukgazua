import SupportForm from '@/components/support/support-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupportPage() {
  return (
    <div className="py-12 md:py-20 bg-muted/50">
      <div className="container max-w-3xl mx-auto">
        <Card className="shadow-lg support-theme">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-primary">간병인 지원</CardTitle>
          </CardHeader>
          <CardContent>
            <SupportForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
