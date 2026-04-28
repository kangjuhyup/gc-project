import { UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';

interface ProfileLinkProps {
  compact?: boolean;
}

export function ProfileLink({ compact = false }: ProfileLinkProps) {
  const { member } = useAuth();
  const displayName = member?.nickname || member?.name || '회원';

  return (
    <Button asChild className="profile-link" data-compact={compact} variant="ghost">
      <Link aria-label="내 프로필" to="/profile" viewTransition>
        <UserRound size={18} aria-hidden="true" />
        <span>{compact ? displayName : `내 프로필 · ${displayName}`}</span>
      </Link>
    </Button>
  );
}
