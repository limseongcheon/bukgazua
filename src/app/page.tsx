
import Hero from '@/components/sections/hero';
import Services from '@/components/sections/services';
import HowItWorks from '@/components/sections/how-it-works';
import AiMatcher from '@/components/sections/ai-matcher';
import Testimonials from '@/components/sections/testimonials';
import Contact from '@/components/sections/contact';
import RecentClaims from '@/components/sections/recent-claims';

export default function Home() {
  return (
    <>
      <h1 className="text-center text-4xl font-bold text-red-500 p-8 bg-yellow-200">
        최종 테스트: 이 메시지가 보이면 파일 수정이 성공한 것입니다.
      </h1>
      <Hero />
      <Services />
      <HowItWorks />
      <AiMatcher />
      <Testimonials />
      <RecentClaims />
      <Contact />
    </>
  );
}
