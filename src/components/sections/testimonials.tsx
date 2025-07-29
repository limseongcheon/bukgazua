import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { maskName } from '@/lib/utils';

const testimonials = [
  {
    name: '김서아 님',
    avatar: '김',
    image: 'https://placehold.co/100x100.png',
    dataAiHint: 'happy woman',
    review: "어머니를 가족처럼 따뜻하게 돌봐주셨어요. 간병인님의 헌신적인 보살핌 덕분에 어머니께서 빠르게 안정을 되찾으셨습니다. 진심으로 감사드립니다.",
  },
  {
    name: '박준서 님',
    avatar: '박',
    image: 'https://placehold.co/100x100.png',
    dataAiHint: 'smiling man',
    review: "수술 후 회복 기간 동안 정말 큰 도움이 되었습니다. 항상 웃는 얼굴로 대해주시고, 세심한 부분까지 신경 써주셔서 마음 편히 회복에만 집중할 수 있었어요.",
  },
  {
    name: '최지우 님',
    avatar: '최',
    image: 'https://placehold.co/100x100.png',
    dataAiHint: 'professional woman',
    review: "전문적인 지식과 따뜻한 마음을 가진 간병인님을 만나게 되어 정말 다행입니다. 덕분에 가족 모두가 한시름 놓을 수 있었어요. 정말 감사합니다.",
  },
];

const renderStars = () => {
  return Array(5).fill(null).map((_, i) => (
    <Star key={i} className="h-5 w-5 text-primary" fill="currentColor" />
  ));
};

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-secondary">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">고객 후기</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            저희가 지원해 드린 가족들의 실제 이야기입니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="flex flex-col justify-between shadow-lg">
              <CardContent className="pt-6">
                <div className="flex mb-4">{renderStars()}</div>
                <p className="text-muted-foreground">"{testimonial.review}"</p>
              </CardContent>
              <div className="flex items-center gap-4 px-6 pb-6 mt-auto">
                <Avatar>
                  <AvatarImage src={testimonial.image} alt={testimonial.name.split(' ')[0]} data-ai-hint={testimonial.dataAiHint} />
                  <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{maskName(testimonial.name.split(' ')[0])} 님</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
