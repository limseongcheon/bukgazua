import Link from 'next/link';
import { cn } from '@/lib/utils';
import { HeartHandshake } from 'lucide-react';

interface AppLogoProps {
  className?: string;
}

export const AppLogo = ({ className }: AppLogoProps) => {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <HeartHandshake className="h-9 w-9 text-primary" />
      <span className="text-3xl font-bold relative">천사손길</span>
    </Link>
  );
};
