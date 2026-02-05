import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, AttendanceRecord, HolidayRequest, PermissionRequest, InviteCode, RSVP } from '../backend';
import { Variant_generic_familyEmergency_medical } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: AttendanceRecord) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordAttendance(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAttendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['allAttendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceByDay'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceByWeek'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceByMonth'] });
    },
  });
}

export function useUpdateAttendanceRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recordId: bigint; updatedRecord: AttendanceRecord }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAttendanceRecord(params.recordId, params.updatedRecord);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAttendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['allAttendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceByDay'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceByWeek'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceByMonth'] });
    },
  });
}

export function useDeleteAttendanceRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAttendanceRecord(recordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAttendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['allAttendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceByDay'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceByWeek'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceByMonth'] });
    },
  });
}

export function useGetMyAttendanceRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['myAttendanceRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyAttendanceRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAttendanceByDay(date: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, AttendanceRecord]>>({
    queryKey: ['attendanceByDay', date.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendanceByDay(date);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAttendanceByWeek(startDate: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, AttendanceRecord[]]>>({
    queryKey: ['attendanceByWeek', startDate.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendanceByWeek(startDate);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAttendanceByMonth(startDate: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, AttendanceRecord[]]>>({
    queryKey: ['attendanceByMonth', startDate.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendanceByMonth(startDate);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitHolidayRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { startDate: bigint; endDate: bigint; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitHolidayRequest(params.startDate, params.endDate, params.reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myHolidayRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allHolidayRequests'] });
      queryClient.invalidateQueries({ queryKey: ['holidayRequestsByPeriod'] });
    },
  });
}

export function useGetMyHolidayRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<HolidayRequest[]>({
    queryKey: ['myHolidayRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyHolidayRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllHolidayRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<HolidayRequest[]>({
    queryKey: ['allHolidayRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllHolidayRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetHolidayRequestsByPeriod(startDate: bigint, endDate: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<HolidayRequest[]>({
    queryKey: ['holidayRequestsByPeriod', startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHolidayRequestsByPeriod(startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApproveHolidayRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveHolidayRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHolidayRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myHolidayRequests'] });
      queryClient.invalidateQueries({ queryKey: ['holidayRequestsByPeriod'] });
    },
  });
}

export function useRejectHolidayRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectHolidayRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHolidayRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myHolidayRequests'] });
      queryClient.invalidateQueries({ queryKey: ['holidayRequestsByPeriod'] });
    },
  });
}

// Permission request hooks
export function useSubmitPermissionRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      startDate: bigint;
      endDate: bigint;
      reason: string;
      requestType: Variant_generic_familyEmergency_medical;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPermissionRequest(
        params.startDate,
        params.endDate,
        params.reason,
        params.requestType
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPermissionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allPermissionRequests'] });
    },
  });
}

export function useGetMyPermissionRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<PermissionRequest[]>({
    queryKey: ['myPermissionRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPermissionRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPermissionRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<PermissionRequest[]>({
    queryKey: ['allPermissionRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPermissionRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApprovePermissionRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approvePermissionRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPermissionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myPermissionRequests'] });
    },
  });
}

export function useRejectPermissionRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectPermissionRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPermissionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myPermissionRequests'] });
    },
  });
}

export function useGetAllAttendanceRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, AttendanceRecord[]]>>({
    queryKey: ['allAttendanceRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAttendanceRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

// Invite code hooks
export function useGenerateInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
    },
  });
}

export function useGetInviteCodes() {
  const { actor, isFetching } = useActor();

  return useQuery<InviteCode[]>({
    queryKey: ['inviteCodes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInviteCodes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitRSVP() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; attending: boolean; inviteCode: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitRSVP(params.name, params.attending, params.inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rsvps'] });
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
    },
  });
}

export function useGetAllRSVPs() {
  const { actor, isFetching } = useActor();

  return useQuery<RSVP[]>({
    queryKey: ['rsvps'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRSVPs();
    },
    enabled: !!actor && !isFetching,
  });
}

// CSV Export hooks
export function useExportAttendanceCSV() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.exportAttendanceRecordsAsCSV();
    },
  });
}

export function useExportHolidayRequestsCSV() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.exportHolidayRequestsAsCSV();
    },
  });
}

export function useExportPermissionRequestsCSV() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.exportPermissionRequestsAsCSV();
    },
  });
}

// Hours calculation hooks
export function useCalculateTotalHours(startDate: bigint, endDate: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totalHours', startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.calculateTotalHours(startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCalculateTotalHoursForAllUsers(startDate: bigint, endDate: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, bigint]>>({
    queryKey: ['totalHoursAllUsers', startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.calculateTotalHoursForAllUsers(startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}
