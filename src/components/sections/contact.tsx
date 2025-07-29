'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, MessageSquare } from 'lucide-react';

export default function Contact() {

  const contactOptions = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: '보험서류 청구',
      description: '필요한 보험 관련 서류를 요청합니다.',
      href: '/insurance-claim',
      bgColor: 'bg-accent',
      textColor: 'text-accent-foreground',
      hoverBorderColor: 'hover:border-accent'
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: '일반 문의',
      description: '서비스, 이용방법 등 궁금한 점을 문의하세요.',
      href: '/inquiry',
      bgColor: 'bg-primary',
      textColor: 'text-primary-foreground',
      hoverBorderColor: 'hover:border-primary'
    }
  ];

  return (
    <section id="contact" className="py-20 md:py-28 bg-secondary">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">문의하기</h2>
          <p className="max-w-3xl mx-auto text-muted-foreground">
            질문이 있거나 도움이 필요하신가요? 저희 팀이 도와드리겠습니다. 아래에서 문의 유형을 선택해 주세요.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {contactOptions.map((option) => (
            <Link href={option.href} key={option.title} className="group">
              <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col border-2 border-transparent ${option.hoverBorderColor}`}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                      <div className={`${option.bgColor} ${option.textColor} p-4 rounded-full transition-colors duration-300`}>
                          {option.icon}
                      </div>
                      <div>
                          <CardTitle className={`text-2xl transition-colors duration-300`}>{option.title}</CardTitle>
                      </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow">
                  <p className={`text-muted-foreground flex-grow transition-colors duration-300`}>{option.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
