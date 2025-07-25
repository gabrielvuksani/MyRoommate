import { getProfileInitials } from '@/lib/userUtils';

interface QuickAvatarProps {
  user: any;
  size?: 'sm' | 'md' | 'lg';
  gradientType?: 'emerald' | 'blue';
}

export default function QuickAvatar({ user, size = 'md', gradientType = 'emerald' }: QuickAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  
  const gradients = {
    emerald: 'from-emerald-400 to-cyan-400',
    blue: 'from-blue-400 to-indigo-500'
  };
  
  const initials = getProfileInitials(user);
  
  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br ${gradients[gradientType]} rounded-full flex items-center justify-center text-white font-semibold`}>
      {initials}
    </div>
  );
}