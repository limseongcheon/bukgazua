const steps = [
  {
    step: '01',
    title: '필요 사항 입력',
    description: '간단한 양식을 사용하여 필요한 돌봄 요건, 일정 및 특정 요구 사항을 설명해주세요.',
  },
  {
    step: '02',
    title: 'AI 기반 매칭',
    description: '저희의 스마트 알고리즘이 입력 내용에 따라 가장 적합한 간병인을 즉시 추천합니다.',
  },
  {
    step: '03',
    title: '간병인과 연결',
    description: '상세 프로필을 검토하고, 가능 여부를 확인한 후, 가장 적합한 간병인과 연결하세요.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">이용 방법</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            간소화된 3단계 프로세스를 통해 적합한 간병인을 쉽게 찾을 수 있습니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Dotted line for desktop */}
          <div className="hidden md:block absolute top-8 left-0 w-full h-1 border-t-2 border-dashed border-primary/50 z-[-1]"></div>
          {steps.map((step) => (
            <div key={step.step} className="text-center relative bg-background px-4">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
                {step.step}
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
