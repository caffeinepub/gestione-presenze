import { useState, useMemo } from 'react';
import { useGetAllHolidayRequests, useApproveHolidayRequest, useRejectHolidayRequest, useGetMultipleUserProfiles } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Variant_pending_approved_rejected } from '../backend';
import { toast } from 'sonner';
import { Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function HolidayApprovals() {
  const { data: requests = [], isLoading } = useGetAllHolidayRequests();
  const approveRequest = useApproveHolidayRequest();
  const rejectRequest = useRejectHolidayRequest();
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('pending');

  // Extract unique user principals from requests
  const uniquePrincipals = useMemo(() => {
    const principals = requests.map(r => r.user);
    return Array.from(new Set(principals.map(p => p.toString()))).map(str => 
      principals.find(p => p.toString() === str)!
    );
  }, [requests]);

  // Fetch all user profiles
  const { data: profilesMap, isLoading: profilesLoading } = useGetMultipleUserProfiles(uniquePrincipals);

  const handleApprove = async (requestId: bigint) => {
    try {
      await approveRequest.mutateAsync(requestId);
      toast.success('Richiesta ferie approvata!');
    } catch (error) {
      toast.error('Impossibile approvare la richiesta');
      console.error(error);
    }
  };

  const handleReject = async (requestId: bigint) => {
    try {
      await rejectRequest.mutateAsync(requestId);
      toast.success('Richiesta ferie rifiutata');
    } catch (error) {
      toast.error('Impossibile rifiutare la richiesta');
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

  const getUserName = (userPrincipal: any) => {
    if (profilesLoading) return 'Caricamento...';
    const profile = profilesMap?.get(userPrincipal.toString());
    return profile?.name || userPrincipal.toString().slice(0, 10) + '...';
  };

  const pendingRequests = requests.filter((r) => r.status === Variant_pending_approved_rejected.pending);
  const processedRequests = requests.filter((r) => r.status !== Variant_pending_approved_rejected.pending);

  const displayedRequests = useMemo(() => {
    if (filter === 'pending') return pendingRequests;
    if (filter === 'processed') return processedRequests;
    return requests;
  }, [filter, pendingRequests, processedRequests, requests]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">In attesa di revisione</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approvate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === Variant_pending_approved_rejected.approved).length}
            </div>
            <p className="text-xs text-muted-foreground">Totale approvate</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rifiutate</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === Variant_pending_approved_rejected.rejected).length}
            </div>
            <p className="text-xs text-muted-foreground">Totale rifiutate</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Richieste Ferie</CardTitle>
              <CardDescription>Rivedi e gestisci le richieste ferie</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                In Attesa
              </Button>
              <Button
                variant={filter === 'processed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('processed')}
              >
                Elaborate
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tutte
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayedRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nessuna richiesta ferie {filter === 'all' ? '' : filter === 'pending' ? 'in attesa' : 'elaborata'}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dipendente</TableHead>
                    <TableHead>Data Inizio</TableHead>
                    <TableHead>Data Fine</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Stato</TableHead>
                    {filter === 'pending' && <TableHead>Azioni</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRequests
                    .sort((a, b) => Number(b.id - a.id))
                    .map((request) => (
                      <TableRow key={Number(request.id)}>
                        <TableCell className="font-medium">
                          {getUserName(request.user)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(Number(request.startDate) / 1_000_000), 'd MMM yyyy', { locale: it })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(Number(request.endDate) / 1_000_000), 'd MMM yyyy', { locale: it })}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        {filter === 'pending' && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                                disabled={approveRequest.isPending || rejectRequest.isPending}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Approva
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request.id)}
                                disabled={approveRequest.isPending || rejectRequest.isPending}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Rifiuta
                              </Button>
                            </div>
                          </TableCell>
                        )}
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
