import { useState } from 'react';
import { useGenerateInviteCodeWithRole, useGetInviteCodes, useGetAllRSVPs } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Mail, Plus, CheckCircle2, Clock, Users, Shield, User } from 'lucide-react';
import { UserRole } from '../backend';
import { formatDateTime } from '../lib/utils';

export default function InviteManagement() {
  const { data: inviteCodes, isLoading: codesLoading } = useGetInviteCodes();
  const { data: rsvps, isLoading: rsvpsLoading } = useGetAllRSVPs();
  const generateCodeWithRole = useGenerateInviteCodeWithRole();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.user);

  const handleGenerateCode = async () => {
    try {
      const code = await generateCodeWithRole.mutateAsync(selectedRole);
      toast.success(
        selectedRole === UserRole.admin 
          ? 'Codice di invito amministratore generato con successo' 
          : 'Codice di invito utente generato con successo'
      );
    } catch (error) {
      toast.error('Impossibile generare il codice di invito');
      console.error(error);
    }
  };

  const handleCopyLink = (code: string) => {
    const inviteUrl = `${window.location.origin}?invite=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    toast.success('Link di invito copiato negli appunti');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const unusedCodes = inviteCodes?.filter(code => !code.used) || [];
  const usedCodes = inviteCodes?.filter(code => code.used) || [];
  const acceptedRSVPs = rsvps?.filter(rsvp => rsvp.attending) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inviti Team</h2>
          <p className="text-muted-foreground">
            Genera e gestisci i codici di invito per i nuovi membri del team
          </p>
        </div>
      </div>

      {/* Generate Invite Section */}
      <Card>
        <CardHeader>
          <CardTitle>Genera Nuovo Invito</CardTitle>
          <CardDescription>
            Seleziona il ruolo e genera un codice di invito per un nuovo membro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="role-select">Ruolo</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger id="role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.user}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Utente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={UserRole.admin}>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Amministratore</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateCode} disabled={generateCodeWithRole.isPending} className="sm:w-auto">
              {generateCodeWithRole.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Generazione...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Genera Codice
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inviti Disponibili</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unusedCodes.length}</div>
            <p className="text-xs text-muted-foreground">Pronti per l'invio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inviti Utilizzati</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usedCodes.length}</div>
            <p className="text-xs text-muted-foreground">Onboarding completato con successo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membri del Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedRSVPs.length}</div>
            <p className="text-xs text-muted-foreground">Membri attivi</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">
            Codici Disponibili ({unusedCodes.length})
          </TabsTrigger>
          <TabsTrigger value="used">
            Codici Utilizzati ({usedCodes.length})
          </TabsTrigger>
          <TabsTrigger value="members">
            Membri del Team ({acceptedRSVPs.length})
          </TabsTrigger>
        </TabsList>

        {/* Available Codes */}
        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Codici di Invito Disponibili</CardTitle>
              <CardDescription>
                Condividi questi codici con i nuovi membri del team per invitarli al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {codesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : unusedCodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Nessun codice disponibile</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Genera un nuovo codice di invito per invitare membri del team
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unusedCodes.map((invite) => (
                    <div
                      key={invite.code}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                            {invite.code}
                          </code>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Disponibile
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Creato il: {formatDateTime(invite.created)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(invite.code)}
                      >
                        {copiedCode === invite.code ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Copiato!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copia Link
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Used Codes */}
        <TabsContent value="used" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Codici di Invito Utilizzati</CardTitle>
              <CardDescription>
                Codici che sono stati utilizzati con successo per l'onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              {codesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : usedCodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Nessun codice utilizzato ancora</h3>
                  <p className="text-sm text-muted-foreground">
                    I codici di invito utilizzati appariranno qui
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codice</TableHead>
                      <TableHead>Creato</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usedCodes.map((invite) => (
                      <TableRow key={invite.code}>
                        <TableCell>
                          <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                            {invite.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(invite.created)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Utilizzato
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Members */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Membri del Team</CardTitle>
              <CardDescription>
                Persone che si sono unite utilizzando i codici di invito
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rsvpsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : acceptedRSVPs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Nessun membro del team ancora</h3>
                  <p className="text-sm text-muted-foreground">
                    I membri del team che si uniscono appariranno qui
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Iscritto</TableHead>
                      <TableHead>Codice Invito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acceptedRSVPs.map((rsvp) => (
                      <TableRow key={rsvp.inviteCode}>
                        <TableCell className="font-medium">{rsvp.name}</TableCell>
                        <TableCell>
                          {formatDateTime(rsvp.timestamp)}
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                            {rsvp.inviteCode}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
