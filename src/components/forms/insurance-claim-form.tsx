'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { submitInsuranceRequest } from '@/app/actions';

export default function InsuranceClaimForm() {
  const { toast } = useToast();
  
  // State for Insurance Form
  const [patientName, setPatientName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [caregiverName, setCaregiverName] = useState('');
  const [servicePeriod, setServicePeriod] = useState('');
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [customEmailDomain, setCustomEmailDomain] = useState('');
  const [requestDetails, setRequestDetails] = useState('');
  const [isInsuranceLoading, setIsInsuranceLoading] = useState(false);

  const handleInsuranceSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!patientName.trim() || !phoneNumber.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '환자 성명과 전화번호는 필수 입력사항입니다.',
      });
      return;
    }
    
    setIsInsuranceLoading(true);

    const email = emailId ? `${emailId}@${emailDomain === 'custom' ? customEmailDomain : emailDomain}` : undefined;
    
    const result = await submitInsuranceRequest({
      patientName,
      guardianName,
      hospitalName,
      phoneNumber,
      caregiverName,
      servicePeriod,
      email,
      requestDetails
    });

    if (result.success) {
      toast({
        title: '요청 완료',
        description: result.message,
      });
      // Reset form
      setPatientName('');
      setGuardianName('');
      setHospitalName('');
      setPhoneNumber('');
      setCaregiverName('');
      setServicePeriod('');
      setEmailId('');
      setEmailDomain('');
      setCustomEmailDomain('');
      setRequestDetails('');
    } else {
      toast({
        variant: 'destructive',
        title: '전송 실패',
        description: result.message,
      });
    }
    setIsInsuranceLoading(false);
  };


  return (
    <form className="space-y-4" onSubmit={handleInsuranceSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="환자 성명"
          aria-label="환자 성명"
          required
          />
          <Input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          type="tel"
          placeholder="전화번호( - 없이 숫자만 입력)"
          aria-label="전화번호( - 없이 숫자만 입력)"
          required
          />
          <Input
          value={guardianName}
          onChange={(e) => setGuardianName(e.target.value)}
          placeholder="보호자 성명 (선택)"
          aria-label="보호자 성명 (선택)"
          />
          <Input
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          placeholder="병원명 (선택)"
          aria-label="병원명 (선택)"
          />
      </div>
      
      <Input
          value={caregiverName}
          onChange={(e) => setCaregiverName(e.target.value)}
          placeholder="간병인 성명 (선택)"
          aria-label="간병인 성명 (선택)"
      />

      <Input
          value={servicePeriod}
          onChange={(e) => setServicePeriod(e.target.value)}
          placeholder="서비스 기간 (예: 2024-01-01 ~ 2024-01-31)"
          aria-label="서비스 기간"
      />
      
      <div className="flex items-center gap-2">
          <Input
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              placeholder="이메일 아이디 (선택)"
              aria-label="이메일 아이디"
              name="emailId"
              className="flex-1"
          />
          <span className="text-muted-foreground">@</span>
          <div className="flex-1">
              {emailDomain === 'custom' ? (
                  <Input
                      value={customEmailDomain}
                      onChange={(e) => setCustomEmailDomain(e.target.value)}
                      placeholder="도메인 직접 입력"
                      aria-label="이메일 도메인 직접 입력"
                      name="emailDomainCustom"
                      autoFocus
                  />
              ) : (
                  <Select name="emailDomain" value={emailDomain} onValueChange={(value) => setEmailDomain(value)}>
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

      <Textarea
          value={requestDetails}
          onChange={(e) => setRequestDetails(e.target.value)}
          placeholder="요청하실 서류 종류와 필요한 내용을 상세히 적어주세요."
          aria-label="요청 서류"
          rows={5}
      />
      <div className="pt-4">
        <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isInsuranceLoading}>
            {isInsuranceLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            요청하기
        </Button>
      </div>
    </form>
  );
}
