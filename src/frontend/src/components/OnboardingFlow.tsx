import { useState } from 'react';
import { useSaveCallerUserProfile, useSubmitRSVP } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { CheckCircle2, UserPlus } from 'lucide-react';

interface OnboardingFlowProps {
  inviteCode: string;
}

export default function OnboardingFlow({ inviteCode }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [isEmployee, setIsEmployee] = useState<'true' | 'false'>('true');
  const saveProfile = useSaveCallerUserProfile();
  const submitRSVP = useSubmitRSVP();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !position.trim()) {
      toast.error('Compila tutti i campi');
      return;
    }

    try {
      // Submit RSVP first to mark invite code as used
      await submitRSVP.mutateAsync({
        name: name.trim(),
        attending: true,
        inviteCode,
      });

      // Then save the profile
      await saveProfile.mutateAsync({
        name: name.trim(),
        position: position.trim(),
        isEmployee: isEmployee === 'true',
        holidayBalance: BigInt(20), // Default 20 giorni
      });

      setStep(3);
      toast.success('Benvenuto nel team!');
      
      // Clear invite code from URL
      window.history.replaceState({}, '', window.location.pathname);
    } catch (error: any) {
      if (error.message?.includes('already used')) {
        toast.error('Questo codice di invito è già stato utilizzato');
      } else if (error.message?.includes('not found')) {
        toast.error('Codice di invito non valido');
      } else {
        toast.error('Impossibile completare l\'onboarding');
      }
      console.error(error);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>Passo {step} di 3</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <img
                  src="/assets/generated/onboarding-welcome.dim_400x300.png"
                  alt="Benvenuto"
                  className="h-12 w-12 rounded-lg object-cover"
                />
              </div>
              <CardTitle className="text-2xl">Benvenuto nel Team!</CardTitle>
              <CardDescription className="text-base">
                Sei stato invitato a unirti al nostro sistema di gestione presenze. Configuriamoti in pochi semplici passi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-2 font-semibold">Cosa ti servirà:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Il tuo nome completo</li>
                  <li>• La tua posizione o ruolo</li>
                  <li>• Tipo di impiego (Dipendente o Collaboratore)</li>
                </ul>
              </div>
              <Button onClick={() => setStep(2)} className="w-full" size="lg">
                Inizia
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Profile Setup */}
        {step === 2 && (
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Crea il Tuo Profilo</CardTitle>
              <CardDescription className="text-base">
                Raccontaci qualcosa di te per completare il tuo onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    placeholder="Inserisci il tuo nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Posizione *</Label>
                  <Input
                    id="position"
                    placeholder="es. Ingegnere Software, Manager"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo di Impiego *</Label>
                  <RadioGroup value={isEmployee} onValueChange={(value) => setIsEmployee(value as 'true' | 'false')}>
                    <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50">
                      <RadioGroupItem value="true" id="employee" />
                      <Label htmlFor="employee" className="flex-1 cursor-pointer font-normal">
                        <div className="font-medium">Dipendente</div>
                        <div className="text-sm text-muted-foreground">Dipendente a tempo pieno o parziale</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50">
                      <RadioGroupItem value="false" id="collaborator" />
                      <Label htmlFor="collaborator" className="flex-1 cursor-pointer font-normal">
                        <div className="font-medium">Collaboratore</div>
                        <div className="text-sm text-muted-foreground">Consulente o collaboratore esterno</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Indietro
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saveProfile.isPending || submitRSVP.isPending}>
                    {saveProfile.isPending || submitRSVP.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Creazione Profilo...
                      </>
                    ) : (
                      'Completa Configurazione'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Tutto Pronto!</CardTitle>
              <CardDescription className="text-base">
                Il tuo profilo è stato creato con successo. Ora puoi accedere al sistema di gestione presenze.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-2 font-semibold">Cosa fare dopo?</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Registra la tua presenza giornaliera</li>
                  <li>• Richiedi ferie quando necessario</li>
                  <li>• Visualizza lo storico delle tue presenze</li>
                  <li>• Traccia il tuo saldo ferie</li>
                </ul>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Reindirizzamento alla dashboard...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
