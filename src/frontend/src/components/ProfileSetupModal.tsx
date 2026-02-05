import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { t } from '../lib/i18n';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !position.trim()) {
      toast.error(t('profileSetup.fillAllFields'));
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        position: position.trim(),
        isEmployee: role === 'employee',
        holidayBalance: BigInt(20),
      });
      toast.success(t('profileSetup.profileCreated'));
    } catch (error) {
      toast.error(t('profileSetup.unableToCreate'));
      console.error(error);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('profileSetup.title')}</DialogTitle>
          <DialogDescription>
            {t('profileSetup.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
            <Label className="text-base font-semibold text-primary">
              {t('profileSetup.selectRole')} <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              {t('profileSetup.selectRoleDescription')}
            </p>
            <RadioGroup value={role} onValueChange={(value) => setRole(value as 'admin' | 'employee')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="font-normal">
                  {t('roles.administrator')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="employee" />
                <Label htmlFor="employee" className="font-normal">
                  {t('roles.employee')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t('profileSetup.fullName')} <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder={t('profileSetup.fullNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">{t('profileSetup.position')} <span className="text-destructive">*</span></Label>
            <Input
              id="position"
              placeholder={t('profileSetup.positionPlaceholder')}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                {t('profileSetup.creatingProfile')}
              </>
            ) : (
              t('profileSetup.createProfile')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
