'use client';

import { Card } from '@/components/ui/card';
import Image from 'next/image';

const servicesData = [
  {
    image: '/assets/service-hospital.jpg',
    dataAiHint: 'hospital care',
    title: '병원 간병인 지원',
    description: '병원 입원 환자를 위한 전문 간병 서비스를 제공하여 빠른 회복을 돕습니다.',
  },
  {
    image: '/assets/service-companion.jpg',
    dataAiHint: 'companion service',
    title: '동행 서비스',
    description: '병원 동행, 일상 생활 보조 등 어르신을 위한 포괄적인 지원',
  },
  {
    image: '/assets/service-livein.jpg',
    dataAiHint: 'home care',
    title: '입주 간병 지원',
    description: '가정에서 24시간 상주하며, 환자의 일상생활 보조부터 전문적인 간병까지 제공하는 프리미엄 서비스입니다.',
  },
  {
    image: '/assets/service-other.jpg',
    dataAiHint: 'custom support',
    title: '기타 지원',
    description: '위 서비스 외에도, 고객의 특수한 상황과 필요에 맞춘 다양한 맞춤형 간병 서비스를 제공합니다.',
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 md:py-28 bg-secondary">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">우리의 서비스</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            저희는 각 개인과 가족의 고유한 필요에 맞는 다양한 돌봄 서비스를 제공합니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {servicesData.map((service) => (
            <Card key={service.title} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-2">
                <Image
                src={service.image}
                alt={service.title}
                data-ai-hint={service.dataAiHint}
                width={400}
                height={300}
                className="w-full h-48 object-cover"
                />
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
