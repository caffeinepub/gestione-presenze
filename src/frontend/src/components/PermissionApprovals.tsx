import { useState, useMemo } from 'react';
import { useGetAllPermissionRequests, useApprovePermissionRequest, useRejectPermissionRequest } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Variant_pending_approved_rejected, Variant_generic_familyEmergency_medical } from '../backend';
import { toast } from 'sonner';
import { Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function PermissionApprovals() {
  const { data: requests = [], isLoading } = useGetAllPermissionRequests();
  const approveRequest = useApprovePermissionRequest();
  const rejectRequest = useRejectPermissionRequest();
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('pending');

  const handleApprove = async (requestId: bigint) => {
    try {
      await approveRequest.mutateAsync(requestId);
      toast.success('Permission request approved!');
    } catch (error) {
      toast.error('Unable to approve request');
      console.error(error);
    }
  };

  const handleReject = async (requestId: bigint) => {
    try {
      await rejectRequest.mutateAsync(requestId);
      toast.success('Permission request rejected');
    } catch (error) {
      toast.error('Unable to reject request');
      console.error(error);
    }
  };

  const getStatusBadge = (status: Variant_pending_approved_rejected) => {
    const variants: Record<Variant_pending_approved_rejected, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      [Variant_pending_approved_rejected.pending]: { variant: 'secondary', label: 'Pending' },
      [Variant_pending_approved_rejected.approved]: { variant: 'default', label: 'Approved' },
      [Variant_pending_approved_rejected.rejected]: { variant: 'destructive', label: 'Rejected' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRequestTypeLabel = (type: Variant_generic_familyEmergency_medical) => {
    const labels: Record<Variant_generic_familyEmergency_medical, string> = {
      [Variant_generic_familyEmergency_medical.generic]: 'Generic',
      [Variant_generic_familyEmergency_medical.medical]: 'Medical',
      [Variant_generic_familyEmergency_medical.familyEmergency]: 'Family Emergency',
    };
    return labels[type];
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
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === Variant_pending_approved_rejected.approved).length}
            </div>
            <p className="text-xs text-muted-foreground">Total approved</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === Variant_pending_approved_rejected.rejected).length}
            </div>
            <p className="text-xs text-muted-foreground">Total rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Permission Requests</CardTitle>
              <CardDescription>Review and manage permission requests</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'processed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('processed')}
              >
                Processed
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayedRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No permission requests {filter === 'all' ? '' : filter === 'pending' ? 'pending' : 'processed'}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    {filter === 'pending' && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRequests
                    .sort((a, b) => Number(b.id - a.id))
                    .map((request) => (
                      <TableRow key={Number(request.id)}>
                        <TableCell className="font-medium">
                          {request.user.toString().slice(0, 10)}...
                        </TableCell>
                        <TableCell>
                          {format(new Date(Number(request.startDate) / 1_000_000), 'd MMM yyyy', { locale: it })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(Number(request.endDate) / 1_000_000), 'd MMM yyyy', { locale: it })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getRequestTypeLabel(request.requestType)}</Badge>
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
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request.id)}
                                disabled={approveRequest.isPending || rejectRequest.isPending}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Reject
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
