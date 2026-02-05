import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Calendar, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { t } from '../lib/i18n';

interface LoginPageProps {
  inviteCode: string | null;
}

export default function LoginPage({ inviteCode }: LoginPageProps) {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-2xl bg-primary/10 p-4">
                <Calendar className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">
              {t('login.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('login.subtitle')}
            </p>
          </div>

          {/* Hero Image */}
          <div className="mb-12 overflow-hidden rounded-2xl shadow-2xl">
            <img
              src="/assets/generated/attendance-hero.dim_800x400.png"
              alt={t('login.title')}
              className="h-auto w-full object-cover"
            />
          </div>

          {/* Invite Code Alert */}
          {inviteCode && (
            <Alert className="mx-auto mb-8 max-w-md border-primary/50 bg-primary/5">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                {t('login.inviteAlert')}
              </AlertDescription>
            </Alert>
          )}

          {/* Login Card */}
          <Card className="mx-auto mb-12 max-w-md border-2 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {inviteCode ? t('login.welcomeTeam') : t('login.welcomeBack')}
              </CardTitle>
              <CardDescription>
                {inviteCode
                  ? t('login.completeProfile')
                  : t('login.accessDashboard')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {t('auth.loggingIn')}
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    {t('auth.loginWith')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <img
                    src="/assets/generated/dashboard-icon.dim_64x64.png"
                    alt="Dashboard"
                    className="h-8 w-8"
                  />
                </div>
                <CardTitle className="text-xl">{t('login.personalDashboard')}</CardTitle>
                <CardDescription>
                  {t('login.personalDashboardDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <img
                    src="/assets/generated/holiday-icon.dim_64x64.png"
                    alt={t('nav.holidays')}
                    className="h-8 w-8"
                  />
                </div>
                <CardTitle className="text-xl">{t('login.holidayManagement')}</CardTitle>
                <CardDescription>
                  {t('login.holidayManagementDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <img
                    src="/assets/generated/analytics-icon.dim_64x64.png"
                    alt={t('login.teamAnalytics')}
                    className="h-8 w-8"
                  />
                </div>
                <CardTitle className="text-xl">{t('login.teamAnalytics')}</CardTitle>
                <CardDescription>
                  {t('login.teamAnalyticsDesc')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Footer */}
          <footer className="mt-16 text-center text-sm text-muted-foreground">
            <p>
              © 2026. {t('footer.builtWith')}{' '}
              <span className="inline-block text-destructive">❤</span> {t('footer.using')}{' '}
              <a
                href="https://caffeine.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
