import Link from 'next/link';
import { MapPin, Phone, User, Mail, FileText, Building } from 'lucide-react';
import { AppLogo } from './app-logo';

export default function Footer() {
  return (
    <footer className="bg-secondary">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <AppLogo className="mb-4" />
            <p className="max-w-md text-muted-foreground text-sm">소중한 사람을 위한 따뜻하고 숙련된 돌봄 파트너를 찾아드리는 당신의 든든한 동반자.</p>
          </div>
          <div>
            <h3 className="font-bold mb-4">바로가기</h3>
            <ul className="space-y-2">
              <li><Link href="/#services" className="hover:text-primary text-muted-foreground">서비스</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-primary text-muted-foreground">이용 방법</Link></li>
              <li><Link href="/#find-caregiver" className="hover:text-primary text-muted-foreground">간병인 찾기</Link></li>
              <li><Link href="/inquiry" className="hover:text-primary text-muted-foreground">문의</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">회사정보</h3>
            <address className="not-italic text-muted-foreground space-y-2 text-sm">
                <p className="flex items-start gap-2">
                    <Building className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>회사명: 천사손길</span>
                </p>
                 <p className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>사업자등록번호: 412-99-01701</span>
                </p>
                 <p className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>대표: 김두현</span>
                </p>
                <p className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>033 763 9004</span>
                </p>
                <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>강원특별자치도 원주시 중앙로 14</span>
                </p>
            </address>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} 천사손길. 모든 권리 보유.</p>
        </div>
      </div>
    </footer>
  );
}
