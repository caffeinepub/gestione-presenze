import { useState } from 'react';
import { useGetMyPermissionRequests, useSubmitPermissionRequest } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Variant_pending_approved_rejected, Variant_generic_familyEmergency_medical } from '../backend';
import { toast } from 'sonner';
import { FileText, Plus, CalendarIcon, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function MyPermissions() {
  const { data: requests = [], isLoading } = useGetMyPermissionRequests();
  const submitRequest = useSubmitPermissionRequest();

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [requestType, setRequestType] = useState<Variant_generic_familyEmergency_medical>(
    Variant_generic_familyEmergency_medical.generic
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for your request');
      return;
    }

    if (endDate < startDate) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      await submitRequest.mutateAsync({
        startDate: BigInt(startDate.getTime() * 1_000_000),
        endDate: BigInt(endDate.getTime() * 1_000_000),
        reason: reason.trim(),
        requestType,
      });
      toast.success('Permission request submitted successfully!');
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
      setRequestType(Variant_generic_familyEmergency_medical.generic);
    } catch (error) {
      toast.error('Unable to submit permission request');
      console.error(error);
    }
  };

  const getStatusBadge = (status: Variant_pending_approved_rejected) => {
    const variants: Record<Variant_pending_approved_rejected, { variant: 'default' | 'secondary' | 'destructive'; label: string; icon: any }> = {
      [Variant_pending_approved_rejected.pending]: { variant: 'secondary', label: 'Pending', icon: Clock },
      [Variant_pending_approved_rejected.approved]: { variant: 'default', label: 'Approved', icon: CheckCircle2 },
      [Variant_pending_approved_rejected.rejected]: { variant: 'destructive', label: 'Rejected', icon: XCircle },
    };

    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getRequestTypeLabel = (type: Variant_generic_familyEmergency_medical) => {
    const labels: Record<Variant_generic_familyEmergency_medical, string> = {
      [Variant_generic_familyEmergency_medical.generic]: 'Generic',
      [Variant_generic_familyEmergency_medical.medical]: 'Medical',
      [Variant_generic_familyEmergency_medical.familyEmergency]: 'Family Emergency',
    };
    return labels[type];
  };

  const pendingCount = requests.filter((r) => r.status === Variant_pending_approved_rejected.pending).length;
  const approvedCount = requests.filter((r) => r.status === Variant_pending_approved_rejected.approved).length;
  const rejectedCount = requests.filter((r) => r.status === Variant_pending_approved_rejected.rejected).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Total approved</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Total rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Request Permission
          </CardTitle>
          <CardDescription>Submit a new permission request for approval</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="startDate"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP', { locale: it }) : 'Select start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="endDate"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP', { locale: it }) : 'Select end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestType">Request Type <span className="text-destructive">*</span></Label>
              <Select
                value={requestType}
                onValueChange={(value) => setRequestType(value as Variant_generic_familyEmergency_medical)}
              >
                <SelectTrigger id="requestType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Variant_generic_familyEmergency_medical.generic}>Generic</SelectItem>
                  <SelectItem value={Variant_generic_familyEmergency_medical.medical}>Medical</SelectItem>
                  <SelectItem value={Variant_generic_familyEmergency_medical.familyEmergency}>
                    Family Emergency
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
              <Textarea
                id="reason"
                placeholder="Provide a reason for your permission request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
            </div>

            <Button type="submit" disabled={submitRequest.isPending} className="w-full">
              {submitRequest.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>My Permission Requests</CardTitle>
          <CardDescription>View the status of your submitted permission requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : requests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No permission requests yet. Submit your first request above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests
                    .sort((a, b) => Number(b.id - a.id))
                    .map((request) => (
                      <TableRow key={Number(request.id)}>
                        <TableCell className="font-medium">
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
