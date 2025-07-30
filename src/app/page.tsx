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