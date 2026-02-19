import { useState, useMemo } from 'react';
import { useGetAttendanceByDay, useGetAttendanceByWeek, useGetAttendanceByMonth, useGetAllAttendanceRecords, useExportAttendanceCSV, useExportHolidayRequestsCSV, useGetMultipleUserProfiles } from '../hooks/useQueries';
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

  // Extract all unique principals from current data
  const principals = useMemo(() => {
    return currentData.map(item => item.principal);
  }, [currentData]);

  // Fetch user profiles for all principals
  const { data: userProfilesMap = new Map(), isLoading: profilesLoading } = useGetMultipleUserProfiles(principals);

  const getUserName = (principal: Principal): string => {
    const profile = userProfilesMap.get(principal.toString());
    if (profile) {
      return profile.name;
    }
    // Fallback to truncated principal if profile not found
    const principalStr = principal.toString();
    return `Utente (${principalStr.slice(0, 8)}...)`;
  };

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
    return (
      <Badge variant={variant}>
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const handlePrevious = () => {
    if (timeView === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (timeView === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (timeView === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (timeView === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeLabel = () => {
    if (timeView === 'day') {
      return format(currentDate, 'd MMMM yyyy', { locale: it });
    } else if (timeView === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      return `${format(start, 'd MMM', { locale: it })} - ${format(end, 'd MMM yyyy', { locale: it })}`;
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: it });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panoramica Team</h2>
          <p className="text-muted-foreground">
            Monitora le presenze e le performance del team
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAttendance} disabled={exportAttendanceCSV.isPending}>
            {exportAttendanceCSV.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Esportazione...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Esporta Presenze
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportHolidays} disabled={exportHolidayCSV.isPending}>
            {exportHolidayCSV.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Esportazione...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Esporta Ferie
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membri del Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Utenti attivi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso di Presenza</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.presentCount + stats.remoteCount} su {stats.totalRecords} presenze
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ore Totali</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">Nel periodo selezionato</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lavoro Remoto</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.remoteCount}</div>
            <p className="text-xs text-muted-foreground">Presenze da remoto</p>
          </CardContent>
        </Card>
      </div>

      {/* Time View Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Presenze del Team</CardTitle>
              <CardDescription>{getDateRangeLabel()}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 rounded-lg border p-1">
                <Button
                  variant={timeView === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeView('day')}
                >
                  Giorno
                </Button>
                <Button
                  variant={timeView === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeView('week')}
                >
                  Settimana
                </Button>
                <Button
                  variant={timeView === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeView('month')}
                >
                  Mese
                </Button>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Oggi
                </Button>
                <Button variant="outline" size="sm" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || profilesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : currentData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Nessuna presenza registrata</h3>
              <p className="text-sm text-muted-foreground">
                Non ci sono presenze registrate per questo periodo
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Presenze</TableHead>
                    <TableHead>Ore Totali</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Attività</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((item) => {
                    const userName = getUserName(item.principal);
                    const totalHours = calculateUserHours(item.records);
                    const latestRecord = item.records[0];

                    return (
                      <TableRow key={item.principal.toString()}>
                        <TableCell className="font-medium">{userName}</TableCell>
                        <TableCell>{item.records.length}</TableCell>
                        <TableCell>{totalHours}h</TableCell>
                        <TableCell>{getStatusBadge(latestRecord.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getActivityLabel(latestRecord.activity)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
