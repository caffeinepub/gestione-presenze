import { useState, useMemo } from 'react';
import { useGetMyAttendanceRecords, useRecordAttendance, useUpdateAttendanceRecord, useDeleteAttendanceRecord } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AttendanceStatus, ActivityType, AttendanceRecord } from '../backend';
import { getStatusLabel, getActivityLabel, getStatusBadgeVariant } from '../lib/attendanceLabels';
import { toast } from 'sonner';
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, Clock, CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type TimeView = 'day' | 'week' | 'month';
type ActivityKind = 'project' | 'service' | 'genericActivity' | 'weekend' | 'workshops';

const MIN_DATE = new Date(2025, 0, 1); // 1 gennaio 2025

export default function MyAttendance() {
  const { data: records = [], isLoading } = useGetMyAttendanceRecords();
  const recordAttendance = useRecordAttendance();
  const updateAttendance = useUpdateAttendanceRecord();
  const deleteAttendance = useDeleteAttendanceRecord();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [status, setStatus] = useState<AttendanceStatus>(AttendanceStatus.present);
  const [activityType, setActivityType] = useState<ActivityKind>('genericActivity');
  const [activityValue, setActivityValue] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakDuration, setBreakDuration] = useState('60');
  const [timeView, setTimeView] = useState<TimeView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editingDate, setEditingDate] = useState<Date | undefined>(undefined);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);

  const calculateHoursWorked = (start: string, end: string, breakMin: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const breakMinutes = parseInt(breakMin) || 0;
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes - breakMinutes;
    
    return Math.max(0, Math.round(totalMinutes / 60));
  };

  const buildActivity = (type: ActivityKind, value: string): ActivityType => {
    if (type === 'project') return { __kind__: 'project', project: value };
    if (type === 'service') return { __kind__: 'service', service: value };
    if (type === 'weekend') return { __kind__: 'weekend', weekend: null };
    if (type === 'workshops') return { __kind__: 'workshops', workshops: null };
    return { __kind__: 'genericActivity', genericActivity: value };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate) {
      toast.error('Seleziona una data per la presenza');
      return;
    }

    if (selectedDate < MIN_DATE) {
      toast.error('La data selezionata deve essere successiva a gennaio 2025');
      return;
    }

    if ((activityType !== 'weekend' && activityType !== 'workshops') && !activityValue.trim()) {
      toast.error('Il campo "Attività svolta" è obbligatorio');
      return;
    }

    const activity = buildActivity(activityType, activityValue);
    const hoursWorked = calculateHoursWorked(startTime, endTime, breakDuration);
    const dateMs = BigInt(selectedDate.getTime() * 1_000_000);

    try {
      await recordAttendance.mutateAsync({
        id: BigInt(0),
        date: dateMs,
        status,
        activity,
        startTime: startTime,
        endTime: endTime,
        breakDuration: BigInt(parseInt(breakDuration) || 0),
        hoursWorked: BigInt(hoursWorked),
        notes: notes.trim() || undefined,
        timestamp: BigInt(Date.now() * 1_000_000),
      });
      toast.success('Presenza registrata con successo!');
      setNotes('');
      setActivityValue('');
      setStatus(AttendanceStatus.present);
      setActivityType('genericActivity');
      setStartTime('09:00');
      setEndTime('18:00');
      setBreakDuration('60');
      setSelectedDate(new Date());
    } catch (error: any) {
      if (error?.message?.includes('gennaio 2025')) {
        toast.error('La data selezionata deve essere successiva a gennaio 2025');
      } else {
        toast.error('Impossibile registrare la presenza');
      }
      console.error(error);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!editingRecord) return;

    if ((activityType !== 'weekend' && activityType !== 'workshops') && !activityValue.trim()) {
      toast.error('Il campo "Attività svolta" è obbligatorio');
      return;
    }

    if (!editingDate) {
      toast.error('Seleziona una data per la presenza');
      return;
    }

    if (editingDate < MIN_DATE) {
      toast.error('La data selezionata deve essere successiva a gennaio 2025');
      return;
    }

    const activity = buildActivity(activityType, activityValue);
    const hoursWorked = calculateHoursWorked(startTime, endTime, breakDuration);
    const dateMs = BigInt(editingDate.getTime() * 1_000_000);

    try {
      await updateAttendance.mutateAsync({
        recordId: editingRecord.id,
        updatedRecord: {
          id: editingRecord.id,
          date: dateMs,
          status,
          activity,
          startTime: startTime,
          endTime: endTime,
          breakDuration: BigInt(parseInt(breakDuration) || 0),
          hoursWorked: BigInt(hoursWorked),
          notes: notes.trim() || undefined,
          timestamp: BigInt(Date.now() * 1_000_000),
        },
      });
      toast.success('Presenza aggiornata con successo!');
      setEditingRecord(null);
      setEditingDate(undefined);
      setNotes('');
      setActivityValue('');
      setStatus(AttendanceStatus.present);
      setActivityType('genericActivity');
      setStartTime('09:00');
      setEndTime('18:00');
      setBreakDuration('60');
    } catch (error: any) {
      if (error?.message?.includes('gennaio 2025')) {
        toast.error('La data selezionata deve essere successiva a gennaio 2025');
      } else {
        toast.error('Impossibile aggiornare la presenza');
      }
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;

    try {
      await deleteAttendance.mutateAsync(deletingRecord.id);
      toast.success('Presenza eliminata con successo!');
      setDeletingRecord(null);
    } catch (error) {
      toast.error('Impossibile eliminare la presenza');
      console.error(error);
    }
  };

  const openEditDialog = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditingDate(new Date(Number(record.date) / 1_000_000));
    setStatus(record.status);
    setNotes(record.notes || '');
    
    if (record.activity.__kind__ === 'project') {
      setActivityType('project');
      setActivityValue(record.activity.project);
    } else if (record.activity.__kind__ === 'service') {
      setActivityType('service');
      setActivityValue(record.activity.service);
    } else if (record.activity.__kind__ === 'weekend') {
      setActivityType('weekend');
      setActivityValue('');
    } else if (record.activity.__kind__ === 'workshops') {
      setActivityType('workshops');
      setActivityValue('');
    } else {
      setActivityType('genericActivity');
      setActivityValue(record.activity.genericActivity);
    }

    if (record.startTime) {
      setStartTime(record.startTime);
    } else {
      setStartTime('09:00');
    }
    
    if (record.endTime) {
      setEndTime(record.endTime);
    } else {
      setEndTime('18:00');
    }
    
    if (record.breakDuration) {
      setBreakDuration(record.breakDuration.toString());
    } else {
      setBreakDuration('60');
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const variant = getStatusBadgeVariant(status);
    const label = getStatusLabel(status);
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredRecords = useMemo(() => {
    if (timeView === 'day') {
      return records.filter((record) => {
        const recordDate = new Date(Number(record.date) / 1_000_000);
        return isSameDay(recordDate, currentDate);
      });
    } else if (timeView === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return records.filter((record) => {
        const recordDate = new Date(Number(record.date) / 1_000_000);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return records.filter((record) => {
        const recordDate = new Date(Number(record.date) / 1_000_000);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });
    }
  }, [records, timeView, currentDate]);

  const calculateTotalHours = () => {
    return filteredRecords.reduce((total, record) => {
      return total + Number(record.hoursWorked || BigInt(0));
    }, 0);
  };

  const navigatePrevious = () => {
    if (timeView === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (timeView === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (timeView === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (timeView === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeLabel = () => {
    if (timeView === 'day') {
      return format(currentDate, 'EEEE, d MMMM yyyy', { locale: it });
    } else if (timeView === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'd MMM', { locale: it })} - ${format(weekEnd, 'd MMM yyyy', { locale: it })}`;
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: it });
    }
  };

  const needsActivityValue = activityType !== 'weekend' && activityType !== 'workshops';

  return (
    <div className="space-y-6">
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Registra Presenza
          </CardTitle>
          <CardDescription>Seleziona la data e registra il tuo stato di presenza</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
              <Label htmlFor="date" className="text-base font-semibold text-primary">
                Data del Giorno di Lavoro <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Seleziona la data per cui vuoi registrare la presenza (a partire da gennaio 2025)
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP', { locale: it }) : 'Seleziona una data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < MIN_DATE}
                    initialFocus
                    locale={it}
                  />
                </PopoverContent>
              </Popover>
              {selectedDate && selectedDate < MIN_DATE && (
                <p className="text-sm text-destructive mt-1">
                  La data deve essere successiva a gennaio 2025
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Stato</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as AttendanceStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AttendanceStatus.present}>Presente</SelectItem>
                  <SelectItem value={AttendanceStatus.absent}>Assente</SelectItem>
                  <SelectItem value={AttendanceStatus.remoteWork}>Lavoro Remoto</SelectItem>
                  <SelectItem value={AttendanceStatus.holiday}>Ferie</SelectItem>
                  <SelectItem value={AttendanceStatus.law104Leave}>Congedo Legge 104</SelectItem>
                  <SelectItem value={AttendanceStatus.sickness}>Sickness</SelectItem>
                  <SelectItem value={AttendanceStatus.timeBank}>Time Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startTime">Ora Inizio</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Ora Fine</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breakDuration">Pausa (minuti)</Label>
                <Input
                  id="breakDuration"
                  type="number"
                  min="0"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="rounded-lg border-2 border-accent/30 bg-accent/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-accent-foreground" />
                <span>Ore Lavorate: {calculateHoursWorked(startTime, endTime, breakDuration)} ore</span>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <Label htmlFor="activityType" className="text-base font-semibold text-primary">
                Attività svolta <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Seleziona il tipo di attività e specifica i dettagli
              </p>
              <Select value={activityType} onValueChange={(value) => setActivityType(value as ActivityKind)}>
                <SelectTrigger id="activityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Progetto</SelectItem>
                  <SelectItem value="service">Servizio</SelectItem>
                  <SelectItem value="genericActivity">Attività Generica</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                  <SelectItem value="workshops">Workshops</SelectItem>
                </SelectContent>
              </Select>
              {needsActivityValue && (
                <Textarea
                  placeholder={
                    activityType === 'project' ? 'Nome del progetto...' :
                    activityType === 'service' ? 'Nome del servizio...' :
                    'Descrizione attività...'
                  }
                  value={activityValue}
                  onChange={(e) => setActivityValue(e.target.value)}
                  rows={2}
                  className="mt-2"
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note (Opzionale)</Label>
              <Textarea
                id="notes"
                placeholder="Aggiungi eventuali note aggiuntive..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={recordAttendance.isPending} className="w-full">
              {recordAttendance.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Registrazione...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Registra Presenza
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
              <CardTitle>Le Mie Presenze</CardTitle>
              <CardDescription>Visualizza, modifica o elimina i tuoi record di presenza</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={timeView === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeView('day')}
              >
                Giorno
              </Button>
              <Button
                variant={timeView === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeView('week')}
              >
                Settimana
              </Button>
              <Button
                variant={timeView === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeView('month')}
              >
                Mese
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-4">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-1 items-center justify-center gap-2">
              <span className="text-sm font-medium">{getDateRangeLabel()}</span>
              <Button variant="ghost" size="sm" onClick={navigateToday}>
                Oggi
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4 rounded-lg border-2 border-accent/30 bg-accent/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent-foreground" />
                <span className="text-lg font-semibold">Ore Lavorate Totali</span>
              </div>
              <span className="text-2xl font-bold text-accent-foreground">
                {calculateTotalHours()} ore
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Per il periodo: {getDateRangeLabel()}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nessun record di presenza per questo {timeView === 'day' ? 'giorno' : timeView === 'week' ? 'settimana' : 'mese'}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Ore</TableHead>
                    <TableHead>Attività</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords
                    .sort((a, b) => Number(b.date - a.date))
                    .map((record) => (
                      <TableRow key={Number(record.id)}>
                        <TableCell className="font-medium">
                          {format(new Date(Number(record.date) / 1_000_000), 'EEE, d MMM yyyy', { locale: it })}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="font-semibold text-accent-foreground">
                          {record.hoursWorked ? `${record.hoursWorked}h` : '—'}
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {getActivityLabel(record.activity)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.notes || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingRecord(record)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => {
        if (!open) {
          setEditingRecord(null);
          setEditingDate(undefined);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Presenza</DialogTitle>
            <DialogDescription>
              Aggiorna i dettagli della tua presenza registrata
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
              <Label htmlFor="edit-date" className="text-base font-semibold text-primary">
                Data del Giorno di Lavoro <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Modifica la data della presenza (a partire da gennaio 2025)
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="edit-date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !editingDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editingDate ? format(editingDate, 'PPP', { locale: it }) : 'Seleziona una data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={editingDate}
                    onSelect={setEditingDate}
                    disabled={(date) => date < MIN_DATE}
                    initialFocus
                    locale={it}
                  />
                </PopoverContent>
              </Popover>
              {editingDate && editingDate < MIN_DATE && (
                <p className="text-sm text-destructive mt-1">
                  La data deve essere successiva a gennaio 2025
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Stato</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as AttendanceStatus)}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AttendanceStatus.present}>Presente</SelectItem>
                  <SelectItem value={AttendanceStatus.absent}>Assente</SelectItem>
                  <SelectItem value={AttendanceStatus.remoteWork}>Lavoro Remoto</SelectItem>
                  <SelectItem value={AttendanceStatus.holiday}>Ferie</SelectItem>
                  <SelectItem value={AttendanceStatus.law104Leave}>Congedo Legge 104</SelectItem>
                  <SelectItem value={AttendanceStatus.sickness}>Sickness</SelectItem>
                  <SelectItem value={AttendanceStatus.timeBank}>Time Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Ora Inizio</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">Ora Fine</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-breakDuration">Pausa (minuti)</Label>
                <Input
                  id="edit-breakDuration"
                  type="number"
                  min="0"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="rounded-lg border-2 border-accent/30 bg-accent/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-accent-foreground" />
                <span>Ore Lavorate: {calculateHoursWorked(startTime, endTime, breakDuration)} ore</span>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <Label htmlFor="edit-activityType" className="text-base font-semibold text-primary">
                Attività svolta <span className="text-destructive">*</span>
              </Label>
              <Select value={activityType} onValueChange={(value) => setActivityType(value as ActivityKind)}>
                <SelectTrigger id="edit-activityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Progetto</SelectItem>
                  <SelectItem value="service">Servizio</SelectItem>
                  <SelectItem value="genericActivity">Attività Generica</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                  <SelectItem value="workshops">Workshops</SelectItem>
                </SelectContent>
              </Select>
              {needsActivityValue && (
                <Textarea
                  placeholder={
                    activityType === 'project' ? 'Nome del progetto...' :
                    activityType === 'service' ? 'Nome del servizio...' :
                    'Descrizione attività...'
                  }
                  value={activityValue}
                  onChange={(e) => setActivityValue(e.target.value)}
                  rows={2}
                  className="mt-2"
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Note (Opzionale)</Label>
              <Textarea
                id="edit-notes"
                placeholder="Aggiungi eventuali note aggiuntive..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingRecord(null);
              setEditingDate(undefined);
            }}>
              Annulla
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={updateAttendance.isPending}>
              {updateAttendance.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Aggiornamento...
                </>
              ) : (
                'Salva Modifiche'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingRecord} onOpenChange={(open) => !open && setDeletingRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa presenza? Questa azione non può essere annullata.
              {deletingRecord && (
                <div className="mt-4 rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">
                    Data: {format(new Date(Number(deletingRecord.date) / 1_000_000), 'd MMMM yyyy', { locale: it })}
                  </p>
                  <p className="text-sm">
                    Attività: {getActivityLabel(deletingRecord.activity)}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAttendance.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Eliminazione...
                </>
              ) : (
                'Elimina'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
