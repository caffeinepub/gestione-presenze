import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import LoginPage from './pages/LoginPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './pages/Dashboard';
import { t } from './lib/i18n';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    if (code) {
      setInviteCode(code);
    }
  }, []);

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
  const showOnboarding = showProfileSetup && inviteCode;

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginPage inviteCode={inviteCode} />
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {showOnboarding ? (
        <OnboardingFlow inviteCode={inviteCode!} />
      ) : showProfileSetup ? (
        <ProfileSetupModal />
      ) : (
        <Dashboard />
      )}
      <Toaster />
    </ThemeProvider>
  );
}
