import { AccountManagement } from '../components/AccountManagement';
import { useAuth } from '../context/AuthContext';

export function AccountPage() {
  const { auth } = useAuth();

  return <AccountManagement token={auth.token} currentUserId={auth.user.id} />;
}
