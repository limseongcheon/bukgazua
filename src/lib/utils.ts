import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskName(fullName: string): string {
  if (typeof fullName !== 'string' || fullName.length === 0) {
    return '';
  }

  // " 님" 같은 접미사 처리
  const parts = fullName.trim().split(' ');
  const name = parts[0];
  const suffix = parts.length > 1 ? ` ${parts.slice(1).join(' ')}` : '';

  if (name.length <= 1) {
    return fullName;
  }
  
  if (name.length === 2) {
    return `${name[0]}*${suffix}`;
  }
  
  // 3글자 이상
  const maskedMiddle = '*'.repeat(name.length - 2);
  return `${name[0]}${maskedMiddle}${name[name.length - 1]}${suffix}`;
}
