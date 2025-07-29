'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { submitGeneralInquiry } from '@/app/actions';

export default function GeneralInquiryForm() {
  const { toast } = useToast();
  
  const [generalName, setGeneralName] = useState('');
  const [generalPhone, setGeneralPhone] = useState('');
  const [generalEmailId, setGeneralEmailId] = useState('');
  const [generalEmailDomain, setGeneralEmailDomain] = useState('');
  const [generalCustomEmailDomain, setGeneralCustomEmailDomain] = useState('');
  const [generalMessage, setGeneralMessage] = useState('');
  const [isGeneralLoading, setIsGeneralLoading] = useState(false);

  const handleGeneralSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!generalName.trim() || !generalPhone.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '성함과 전화번호는 필수 항목입니다.',
      });
      return;
    }
    
    setIsGeneralLoading(true);

    const email = generalEmailId ? `${generalEmailId}@${generalEmailDomain === 'custom' ? generalCustomEmailDomain : generalEmailDomain}`: undefined;

    const result = await submitGeneralInquiry({
        name: generalName,
        phone: generalPhone,
        email,
        message: generalMessage,
    });

    if (result.success) {
        toast({
          title: '전송 완료',
          description: result.message,
        });
        // Reset form
        setGeneralName('');
        setGeneralPhone('');
        setGeneralEmailId('');
        setGeneralEmailDomain('');
        setGeneralCustomEmailDomain('');
        setGeneralMessage('');
    } else {
        toast({
            variant: 'destructive',
            title: '전송 실패',
            description: result.message,
        });
    }
    setIsGeneralLoading(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleGeneralSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input value={generalName} onChange={(e) => setGeneralName(e.target.value)} placeholder="성함" aria-label="성함" required />
          <Input value={generalPhone} onChange={(e) => setGeneralPhone(e.target.value)} type="tel" placeholder="전화번호( - 없이 숫자만 입력)" aria-label="전화번호( - 없이 숫자만 입력)" required/>
      </div>
      
      <div className="flex items-center gap-2">
          <Input
              value={generalEmailId}
              onChange={(e) => setGeneralEmailId(e.target.value)}
              placeholder="이메일 아이디 (선택)"
              aria-label="이메일 아이디"
              name="generalEmailId"
              className="flex-1"
          />
          <span className="text-muted-foreground">@</span>
          <div className="flex-1">
              {generalEmailDomain === 'custom' ? (
                  <Input
                      value={generalCustomEmailDomain}
                      onChange={(e) => setGeneralCustomEmailDomain(e.target.value)}
                      placeholder="도메인 직접 입력"
                      aria-label="이메일 도메인 직접 입력"
                      name="generalEmailDomainCustom"
                      autoFocus
                  />
              ) : (
                  <Select name="generalEmailDomain" value={generalEmailDomain} onValueChange={(value) => setGeneralEmailDomain(value)}>
                      <SelectTrigger aria-label="이메일 도메인 선택">
                          <SelectValue placeholder="도메인 선택" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="naver.com">naver.com</SelectItem>
                          <SelectItem value="gmail.com">gmail.com</SelectItem>
                          <SelectItem value="daum.net">daum.net</SelectItem>
                          <SelectItem value="hanmail.net">hanmail.net</SelectItem>
                          <SelectItem value="nate.com">nate.com</SelectItem>
                          <SelectItem value="custom">직접입력</SelectItem>
                      </SelectContent>
                  </Select>
              )}
          </div>
      </div>

      <Textarea value={generalMessage} onChange={(e) => setGeneralMessage(e.target.value)} placeholder="문의하실 내용을 자유롭게 작성해주세요. (선택)" aria-label="메시지" rows={5} />
      <div className="pt-4">
        <Button type="submit" size="lg" className="w-full" disabled={isGeneralLoading}>
            {isGeneralLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            메시지 보내기
        </Button>
      </div>
    </form>
  );
}
