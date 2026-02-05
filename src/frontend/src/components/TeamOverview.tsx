import { useState, useMemo } from 'react';
import { useGetAttendanceByDay, useGetAttendanceByWeek, useGetAttendanceByMonth, useGetAllAttendanceRecords, useExportAttendanceCSV, useExportHolidayRequestsCSV } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AttendanceStatus } from '../backend';
import { getStatusLabel, getActivityLabel, getStatusBadgeVariant } from '../lib/attendanceLabels';
import type { Principal } from '@icp-sdk/core/principal';
import { Users, TrendingUp, Calendar, Briefcase, ChevronLeft, ChevronRight, Download, Clock } from 'lucide-react';
import { format, startOfWeek, startOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

type TimeView = 'day' | 'week' | 'month';

export default function TeamOverview() {
  const [timeView, setTimeView] = useState<TimeView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const dayDate = BigInt(new Date(currentDate.setHours(0, 0, 0, 0)).getTime() * 1_000_000);
  const weekStartDate = BigInt(startOfWeek(currentDate, { weekStartsOn: 1 }).getTime() * 1_000_000);
  const monthStartDate = BigInt(startOfMonth(currentDate).getTime() * 1_000_000);

  const { data: dayData = [], isLoading: dayLoading } = useGetAttendanceByDay(dayDate);
  const { data: weekData = [], isLoading: weekLoading } = useGetAttendanceByWeek(weekStartDate);
  const { data: monthData = [], isLoading: monthLoading } = useGetAttendanceByMonth(monthStartDate);
  const { data: allRecords = [] } = useGetAllAttendanceRecords();
  
  const exportAttendanceCSV = useExportAttendanceCSV();
  const exportHolidayCSV = useExportHolidayRequestsCSV();

  const isLoading = timeView === 'day' ? dayLoading : timeView === 'week' ? weekLoading : monthLoading;

  const currentData = useMemo(() => {
    if (timeView === 'day') {
      return dayData.map(([principal, record]) => ({ principal, records: [record] }));
    } else if (timeView === 'week') {
      return weekData.map(([principal, records]) => ({ principal, records }));
    } else {
      return monthData.map(([principal, records]) => ({ principal, records }));
    }
  }, [timeView, dayData, weekData, monthData]);

  const calculateStats = () => {
    const totalUsers = allRecords.length;
    let totalRecords = 0;
    let presentCount = 0;
    let remoteCount = 0;
    let absentCount = 0;
    let totalHours = 0;

    if (timeView === 'day') {
      dayData.forEach(([_, record]) => {
        totalRecords++;
        if (record.status === AttendanceStatus.present) presentCount++;
        if (record.status === AttendanceStatus.remoteWork) remoteCount++;
        if (record.status === AttendanceStatus.absent) absentCount++;
        totalHours += Number(record.hoursWorked || BigInt(0));
      });
    } else {
      currentData.forEach((item) => {
        totalRecords += item.records.length;
        item.records.forEach((record) => {
          if (record.status === AttendanceStatus.present) presentCount++;
          if (record.status === AttendanceStatus.remoteWork) remoteCount++;
          if (record.status === AttendanceStatus.absent) absentCount++;
          totalHours += Number(record.hoursWorked || BigInt(0));
        });
      });
    }

    const attendanceRate = totalRecords > 0 ? ((presentCount + remoteCount) / totalRecords) * 100 : 0;

    return {
      totalUsers,
      totalRecords,
      presentCount,
      remoteCount,
      absentCount,
      attendanceRate,
      totalHours,
    };
  };

  const stats = calculateStats();

  const calculateUserHours = (records: any[]) => {
    return records.reduce((total, record) => {
      return total + Number(record.hoursWorked || BigInt(0));
    }, 0);
  };

  const handleExportAttendance = async () => {
    try {
      const csvData = await exportAttendanceCSV.mutateAsync();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `presenze_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report presenze esportato con successo!');
    } catch (error) {
      toast.error('Errore durante l\'esportazione del report presenze');
      console.error(error);
    }
  };

  const handleExportHolidays = async () => {
    try {
      const csvData = await exportHolidayCSV.mutateAsync();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ferie_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report ferie esportato con successo!');
    } catch (error) {
      toast.error('Errore durante l\'esportazione del report ferie');
      console.error(error);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const variant = getStatusBadgeVariant(status);
    const label = getStatusLabel(status);
    return <Badge variant={variant}>{label}</Badge>;
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
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${format(weekStart, 'd MMM', { locale: it })} - ${format(weekEnd, 'd MMM yyyy', { locale: it })}`;
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: it });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-accent/30 bg-accent/5 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-accent-foreground" />
                Esportazione Report CSV
              </CardTitle>
              <CardDescription>
                Scarica report dettagliati in formato CSV per analisi esterne
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportAttendance}
                disabled={exportAttendanceCSV.isPending}
                variant="default"
                className="gap-2"
              >
                {exportAttendanceCSV.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Esportazione...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Esporta Presenze
                  </>
                )}
              </Button>
              <Button
                onClick={handleExportHolidays}
                disabled={exportHolidayCSV.isPending}
                variant="outline"
                className="gap-2"
              >
                {exportHolidayCSV.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Esportazione...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Esporta Ferie
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Membri del team attivi</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso di Presenza</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Per il periodo selezionato</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presenti</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentCount}</div>
            <p className="text-xs text-muted-foreground">In ufficio</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ore Lavorate Totali</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">Per il periodo selezionato</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Record Presenze Team</CardTitle>
              <CardDescription>Visualizza presenze per periodo con filtri temporali</CardDescription>
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

          {currentData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nessun record di presenza per questo {timeView === 'day' ? 'giorno' : timeView === 'week' ? 'settimana' : 'mese'}.
            </div>
          ) : (
            <div className="space-y-6">
              {currentData.map((item) => {
                const userHours = calculateUserHours(item.records);
                return (
                  <div key={item.principal.toString()} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-muted-foreground">
                        Utente: {item.principal.toString().slice(0, 10)}...
                      </h3>
                      <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1">
                        <Clock className="h-4 w-4 text-accent-foreground" />
                        <span className="text-sm font-semibold text-accent-foreground">
                          {userHours} ore
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Ore</TableHead>
                            <TableHead>Attività</TableHead>
                            <TableHead>Note</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...item.records]
                            .sort((a, b) => Number(b.date - a.date))
                            .map((record, index) => (
                              <TableRow key={index}>
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
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
