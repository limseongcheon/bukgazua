import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/layout/app-logo';

export default function Header() {
  const navItems = [
    { href: '/#services', label: '서비스', variant: 'outline' as const, className: 'border-accent text-foreground hover:bg-accent hover:text-accent-foreground' },
    { href: '/#find-caregiver', label: '간병인 찾기', variant: 'outline' as const, className: 'border-accent text-foreground hover:bg-accent hover:text-accent-foreground' },
    { href: '/insurance-claim', label: '보험서류 청구', variant: 'outline' as const, className: 'border-accent text-foreground hover:bg-accent hover:text-accent-foreground' },
    { href: '/inquiry', label: '일반 문의', variant: 'outline' as const, className: 'border-accent text-foreground hover:bg-accent hover:text-accent-foreground' },
    { href: '/support', label: '간병인 지원', variant: 'outline' as const, className: 'border-destructive hover:bg-destructive hover:text-destructive-foreground' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <AppLogo className="mr-auto" />
        
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button asChild variant={item.variant} className={item.className} key={item.href + item.label}>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">네비게이션 메뉴 열기</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetClose asChild>
                   <AppLogo />
                </SheetClose>
                 <SheetTitle className="sr-only">메인 메뉴</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium mt-6">
                {navItems.map((item) => {
                  return (
                    <SheetClose asChild key={item.href + item.label}>
                      <Link
                        href={item.href}
                        className={cn(
                            buttonVariants({ variant: item.variant, className: item.className }),
                            "justify-start text-base"
                        )}
                        >
                        {item.label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
