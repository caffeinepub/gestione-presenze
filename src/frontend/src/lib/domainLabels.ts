/**
 * Centralized domain label mappings for consistent Italian terminology
 * across the entire application
 */

import { AttendanceStatus, ActivityType, Variant_pending_approved_rejected, Variant_generic_familyEmergency_medical } from '../backend';
import { t } from './i18n';

/**
 * Get Italian label for attendance status
 */
export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  const labels: Record<AttendanceStatus, string> = {
    [AttendanceStatus.present]: t('attendanceStatus.present'),
    [AttendanceStatus.absent]: t('attendanceStatus.absent'),
    [AttendanceStatus.remoteWork]: t('attendanceStatus.remoteWork'),
    [AttendanceStatus.holiday]: t('attendanceStatus.holiday'),
    [AttendanceStatus.law104Leave]: t('attendanceStatus.law104Leave'),
    [AttendanceStatus.sickness]: t('attendanceStatus.sickness'),
    [AttendanceStatus.timeBank]: t('attendanceStatus.timeBank'),
  };

  return labels[status] || status;
}

/**
 * Get Italian label for activity type
 */
export function getActivityTypeLabel(activity: ActivityType): string {
  if (activity.__kind__ === 'project') {
    return t('activityType.projectLabel', { value: activity.project });
  }
  if (activity.__kind__ === 'service') {
    return t('activityType.serviceLabel', { value: activity.service });
  }
  if (activity.__kind__ === 'genericActivity') {
    return t('activityType.activityLabel', { value: activity.genericActivity });
  }
  if (activity.__kind__ === 'weekend') {
    return t('activityType.weekend');
  }
  if (activity.__kind__ === 'workshops') {
    return t('activityType.workshops');
  }
  return 'Unknown Activity';
}

/**
 * Get badge variant for attendance status
 */
export function getAttendanceStatusBadgeVariant(
  status: AttendanceStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<AttendanceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [AttendanceStatus.present]: 'default',
    [AttendanceStatus.absent]: 'destructive',
    [AttendanceStatus.remoteWork]: 'secondary',
    [AttendanceStatus.holiday]: 'outline',
    [AttendanceStatus.law104Leave]: 'outline',
    [AttendanceStatus.sickness]: 'destructive',
    [AttendanceStatus.timeBank]: 'outline',
  };

  return variants[status] || 'outline';
}

/**
 * Get Italian label for request status
 */
export function getRequestStatusLabel(status: Variant_pending_approved_rejected): string {
  const labels: Record<Variant_pending_approved_rejected, string> = {
    [Variant_pending_approved_rejected.pending]: t('requestStatus.pending'),
    [Variant_pending_approved_rejected.approved]: t('requestStatus.approved'),
    [Variant_pending_approved_rejected.rejected]: t('requestStatus.rejected'),
  };

  return labels[status] || status;
}

/**
 * Get Italian label for permission request type
 */
export function getPermissionTypeLabel(type: Variant_generic_familyEmergency_medical): string {
  const labels: Record<Variant_generic_familyEmergency_medical, string> = {
    [Variant_generic_familyEmergency_medical.generic]: t('permissionType.generic'),
    [Variant_generic_familyEmergency_medical.medical]: t('permissionType.medical'),
    [Variant_generic_familyEmergency_medical.familyEmergency]: t('permissionType.familyEmergency'),
  };

  return labels[type] || type;
}

/**
 * Get Italian label for user role
 */
export function getRoleLabel(isEmployee: boolean): string {
  return isEmployee ? t('roles.employee') : t('roles.collaborator');
}
