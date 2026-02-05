import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '../components/Header';
import MyAttendance from '../components/MyAttendance';
import MyHolidays from '../components/MyHolidays';
import MyPermissions from '../components/MyPermissions';
import TeamOverview from '../components/TeamOverview';
import HolidayApprovals from '../components/HolidayApprovals';
import PermissionApprovals from '../components/PermissionApprovals';
import InviteManagement from '../components/InviteManagement';
import { Calendar, Palmtree, Users, CheckSquare, Mail, BarChart3, User, FileText } from 'lucide-react';
import { t } from '../lib/i18n';
import { getRoleLabel } from '../lib/domainLabels';

type ViewMode = 'personal' | 'admin';

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('dashboardViewMode');
    return (saved === 'admin' || saved === 'personal') ? saved : 'personal';
  });
  
  const [activeTab, setActiveTab] = useState('attendance');

  useEffect(() => {
    localStorage.setItem('dashboardViewMode', viewMode);
  }, [viewMode]);

  if (!identity || !userProfile) {
    return null;
  }

  const roleLabel = getRoleLabel(userProfile.isEmployee);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight">
                {t('dashboard.welcomeBack', { name: userProfile.name })}
              </h1>
              <p className="text-muted-foreground">
                {userProfile.position} • {roleLabel}
              </p>
            </div>
            
            {!adminLoading && isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'personal' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('personal');
                    setActiveTab('attendance');
                  }}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  {t('views.personalView')}
                </Button>
                <Button
                  variant={viewMode === 'admin' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('admin');
                    setActiveTab('team');
                  }}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  {t('views.adminView')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {viewMode === 'personal' ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-card shadow-sm">
              <TabsTrigger value="attendance" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.myAttendance')}</span>
                <span className="sm:hidden">{t('nav.attendance')}</span>
              </TabsTrigger>
              <TabsTrigger value="holidays" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Palmtree className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.myHolidays')}</span>
                <span className="sm:hidden">{t('nav.holidays')}</span>
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.myPermissions')}</span>
                <span className="sm:hidden">{t('nav.permissions')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-6">
              <MyAttendance />
            </TabsContent>

            <TabsContent value="holidays" className="space-y-6">
              <MyHolidays />
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6">
              <MyPermissions />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-card shadow-sm">
              <TabsTrigger value="team" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.teamOverview')}</span>
                <span className="sm:hidden">{t('nav.team')}</span>
              </TabsTrigger>
              <TabsTrigger value="approvals" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.holidayApprovals')}</span>
                <span className="sm:hidden">{t('nav.holidays')}</span>
              </TabsTrigger>
              <TabsTrigger value="permission-approvals" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.permissionApprovals')}</span>
                <span className="sm:hidden">{t('nav.permissions')}</span>
              </TabsTrigger>
              <TabsTrigger value="invites" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.inviteManagement')}</span>
                <span className="sm:hidden">{t('nav.invites')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="space-y-6">
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {t('dashboard.foundationReport')}
                  </CardTitle>
                  <CardDescription>
                    {t('dashboard.foundationReportDesc')}
                  </CardDescription>
                </CardHeader>
              </Card>
              <TeamOverview />
            </TabsContent>

            <TabsContent value="approvals" className="space-y-6">
              <HolidayApprovals />
            </TabsContent>

            <TabsContent value="permission-approvals" className="space-y-6">
              <PermissionApprovals />
            </TabsContent>

            <TabsContent value="invites" className="space-y-6">
              <InviteManagement />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="mt-16 border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
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
        </div>
      </footer>
    </div>
  );
}
