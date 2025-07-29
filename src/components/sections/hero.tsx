import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="container grid lg:grid-cols-2 gap-12 items-center py-20 md:py-32">
      <div className="space-y-6 text-center lg:text-left">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-headline">
          따뜻한 돌봄, <br />
          <span className="text-primary">완벽한 매칭.</span>
        </h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0">
          천사손길은 검증되고 신뢰할 수 있는 간병인을 찾는 과정을 단순화합니다. 맞춤 추천을 받고 필요할 때 바로 필요한 지원을 찾아보세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/#find-caregiver">나에게 꼭 맞는 간병인 찾기</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/#services">서비스 둘러보기</Link>
          </Button>
        </div>
      </div>
      <div className="relative">
        <Image
          src="/assets/hero-main.jpg"
          alt="아픈 사람을 도와주는 아시아계 중년 여성"
          data-ai-hint="caregiver patient"
          width={600}
          height={400}
          className="rounded-xl shadow-2xl mx-auto"
        />
      </div>
    </section>
  );
}
