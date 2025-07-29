import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CaregiverRecommendationForm from '@/components/caregiver-recommendation-form';

export default function AiMatcher() {
  return (
    <section id="find-caregiver" className="py-20 md:py-28 bg-secondary">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">
            AI로 <span className="text-primary">완벽한 매칭</span> 찾기
          </h2>
          <p className="max-w-3xl mx-auto text-muted-foreground">
            몇 가지 간단한 질문에 답해주시면, 저희의 지능형 매칭 도구가 당신의 특별한 상황에 가장 적합한 간병인과 연결해 드립니다.
          </p>
        </div>
        <Card className="max-w-5xl mx-auto shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">돌봄 필요 요건</CardTitle>
            <CardDescription>찾고 계신 서비스에 대해 알려주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <CaregiverRecommendationForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
