import { useState, useMemo } from 'react';
import { useGetCallerUserProfile, useGetMyHolidayRequests, useSubmitHolidayRequest } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Variant_pending_approved_rejected } from '../backend';
import { toast } from 'sonner';
import { Calendar, Plus, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';

export default function MyHolidays() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: requests = [], isLoading } = useGetMyHolidayRequests();
  const submitRequest = useSubmitHolidayRequest();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason.trim()) {
      toast.error('Compila tutti i campi');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      toast.error('La data di fine deve essere successiva alla data di inizio');
      return;
    }

    try {
      await submitRequest.mutateAsync({
        startDate: BigInt(start.getTime() * 1_000_000),
        endDate: BigInt(end.getTime() * 1_000_000),
        reason: reason.trim(),
      });
      toast.success('Richiesta ferie inviata con successo!');
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (error) {
      toast.error('Impossibile inviare la richiesta ferie');
      console.error(error);
    }
  };

  const getStatusBadge = (status: Variant_pending_approved_rejected) => {
    const variants: Record<Variant_pending_approved_rejected, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      [Variant_pending_approved_rejected.pending]: { variant: 'secondary', label: 'In Attesa' },
      [Variant_pending_approved_rejected.approved]: { variant: 'default', label: 'Approvata' },
      [Variant_pending_approved_rejected.rejected]: { variant: 'destructive', label: 'Rifiutata' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredRequests = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return requests.filter((request) => {
      const requestStart = new Date(Number(request.startDate) / 1_000_000);
      const requestEnd = new Date(Number(request.endDate) / 1_000_000);
      return (requestStart >= monthStart && requestStart <= monthEnd) ||
             (requestEnd >= monthStart && requestEnd <= monthEnd) ||
             (requestStart <= monthStart && requestEnd >= monthEnd);
    });
  }, [requests, currentMonth]);

  const navigatePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const navigateNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const navigateToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Saldo Ferie</CardTitle>
            <CardDescription>Giorni rimanenti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">
                {userProfile ? Number(userProfile.holidayBalance) : 0}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">giorni disponibili</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Richieste in Attesa</CardTitle>
            <CardDescription>In attesa di approvazione</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-5xl font-bold text-secondary">
                {requests.filter((r) => r.status === Variant_pending_approved_rejected.pending).length}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">richieste in attesa</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Ferie Approvate</CardTitle>
            <CardDescription>Quest'anno</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-5xl font-bold text-accent">
                {requests.filter((r) => r.status === Variant_pending_approved_rejected.approved).length}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">ferie approvate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Richiedi Ferie
          </CardTitle>
          <CardDescription>Invia una nuova richiesta ferie per l'approvazione</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inizio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fine</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                placeholder="Spiega il motivo della tua richiesta ferie..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            <Button type="submit" disabled={submitRequest.isPending} className="w-full">
              {submitRequest.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Invio...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Invia Richiesta
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Calendario Ferie
              </CardTitle>
              <CardDescription>Visualizza le tue richieste ferie per mese</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-4">
            <Button variant="outline" size="sm" onClick={navigatePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-1 items-center justify-center gap-2">
              <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy', { locale: it })}</span>
              <Button variant="ghost" size="sm" onClick={navigateToday}>
                Questo Mese
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={navigateNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nessuna richiesta ferie per {format(currentMonth, 'MMMM yyyy', { locale: it })}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Inizio</TableHead>
                    <TableHead>Data Fine</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests
                    .sort((a, b) => Number(b.id - a.id))
                    .map((request) => (
                      <TableRow key={Number(request.id)}>
                        <TableCell className="font-medium">
                          {format(new Date(Number(request.startDate) / 1_000_000), 'd MMM yyyy', { locale: it })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(Number(request.endDate) / 1_000_000), 'd MMM yyyy', { locale: it })}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
