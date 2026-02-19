import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export type Time = bigint;
export interface HolidayRequest {
    id: bigint;
    status: Variant_pending_approved_rejected;
    endDate: Time;
    user: Principal;
    startDate: Time;
    reason: string;
}
export interface AttendanceModification {
    oldRecord?: AttendanceRecord;
    modifiedBy: Principal;
    modificationType: Variant_created_deleted_updated;
    timestamp: Time;
    recordId: bigint;
    newRecord?: AttendanceRecord;
}
export interface PermissionRequest {
    id: bigint;
    status: Variant_pending_approved_rejected;
    endDate: Time;
    user: Principal;
    requestType: Variant_generic_familyEmergency_medical;
    startDate: Time;
    reason: string;
}
export interface AttendanceRecord {
    id: bigint;
    startTime?: string;
    status: AttendanceStatus;
    endTime?: string;
    date: Time;
    hoursWorked?: bigint;
    notes?: string;
    timestamp: Time;
    breakDuration?: bigint;
    activity: ActivityType;
}
export type ActivityType = {
    __kind__: "service";
    service: string;
} | {
    __kind__: "weekend";
    weekend: null;
} | {
    __kind__: "genericActivity";
    genericActivity: string;
} | {
    __kind__: "workshops";
    workshops: null;
} | {
    __kind__: "project";
    project: string;
};
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export interface UserProfile {
    isEmployee: boolean;
    name: string;
    position: string;
    holidayBalance: bigint;
}
export enum AttendanceStatus {
    present = "present",
    sickness = "sickness",
    absent = "absent",
    holiday = "holiday",
    law104Leave = "law104Leave",
    timeBank = "timeBank",
    remoteWork = "remoteWork"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_created_deleted_updated {
    created = "created",
    deleted = "deleted",
    updated = "updated"
}
export enum Variant_generic_familyEmergency_medical {
    generic = "generic",
    familyEmergency = "familyEmergency",
    medical = "medical"
}
export enum Variant_pending_approved_rejected {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    approveHolidayRequest(requestId: bigint): Promise<void>;
    approvePermissionRequest(requestId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateTotalHours(startDate: Time, endDate: Time): Promise<bigint>;
    calculateTotalHoursForAllUsers(startDate: Time, endDate: Time): Promise<Array<[Principal, bigint]>>;
    deleteAttendanceRecord(recordId: bigint): Promise<void>;
    exportAttendanceRecordsAsCSV(): Promise<string>;
    exportHolidayRequestsAsCSV(): Promise<string>;
    exportPermissionRequestsAsCSV(): Promise<string>;
    generateInviteCode(): Promise<string>;
    generateInviteCodeWithRole(role: UserRole): Promise<string>;
    getAllAttendanceRecords(): Promise<Array<[Principal, Array<AttendanceRecord>]>>;
    getAllHolidayRequests(): Promise<Array<HolidayRequest>>;
    getAllPermissionRequests(): Promise<Array<PermissionRequest>>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getAttendanceByDay(date: Time): Promise<Array<[Principal, AttendanceRecord]>>;
    getAttendanceByMonth(startDate: Time): Promise<Array<[Principal, Array<AttendanceRecord>]>>;
    getAttendanceByWeek(startDate: Time): Promise<Array<[Principal, Array<AttendanceRecord>]>>;
    getAttendanceModificationsByPeriod(startDate: Time, endDate: Time): Promise<Array<AttendanceModification>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHolidayRequestsByPeriod(startDate: Time, endDate: Time): Promise<Array<HolidayRequest>>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getMyAttendanceModifications(): Promise<Array<AttendanceModification>>;
    getMyAttendanceRecords(): Promise<Array<AttendanceRecord>>;
    getMyHolidayRequests(): Promise<Array<HolidayRequest>>;
    getMyPermissionRequests(): Promise<Array<PermissionRequest>>;
    getUserAttendanceModifications(user: Principal): Promise<Array<AttendanceModification>>;
    getUserAttendanceRecords(user: Principal): Promise<Array<AttendanceRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    recordAttendance(record: AttendanceRecord): Promise<void>;
    rejectHolidayRequest(requestId: bigint): Promise<void>;
    rejectPermissionRequest(requestId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitHolidayRequest(startDate: Time, endDate: Time, reason: string): Promise<bigint>;
    submitPermissionRequest(startDate: Time, endDate: Time, reason: string, requestType: Variant_generic_familyEmergency_medical): Promise<bigint>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    updateAttendanceRecord(recordId: bigint, updatedRecord: AttendanceRecord): Promise<void>;
}
