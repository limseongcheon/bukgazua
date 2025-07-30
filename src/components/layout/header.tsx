import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/layout/app-logo';

export default function Header() {
  const navItems = [
    { href: '/#services', label: '서비스' },
    { href: '/#find-caregiver', label: '간병인 찾기' },
    { href: '/insurance-claim', label: '보험서류 청구' },
    { href: '/inquiry', label: '일반 문의' },
    { href: '/support', label: '간병인 지원' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <AppLogo className="mr-auto" />
        
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button asChild 
              variant="outline"
              className={cn(
                "border-accent text-foreground hover:bg-accent hover:text-accent-foreground",
                item.href === '/support' && "border-destructive text-foreground hover:bg-destructive hover:text-destructive-foreground"
              )}
              key={item.href + item.label}
            >
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
                          "flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 justify-start text-base border border-input bg-background hover:bg-muted hover:text-muted-foreground",
                           item.href === '/support' && "border-destructive text-foreground hover:bg-destructive hover:text-destructive-foreground"
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
