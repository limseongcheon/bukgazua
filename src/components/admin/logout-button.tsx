'use client';

import { logout } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline">
        <LogOut className="mr-2 h-4 w-4" />
        로그아웃
      </Button>
    </form>
  );
}
