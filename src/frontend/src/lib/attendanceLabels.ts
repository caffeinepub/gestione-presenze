/**
 * Attendance label helpers - now delegates to centralized domain labels
 * Maintained for backward compatibility
 */

import { AttendanceStatus, ActivityType } from '../backend';
import { getAttendanceStatusLabel, getActivityTypeLabel, getAttendanceStatusBadgeVariant } from './domainLabels';

/**
 * Get human-readable label for attendance status
 * @deprecated Use getAttendanceStatusLabel from domainLabels instead
 */
export function getStatusLabel(status: AttendanceStatus): string {
  return getAttendanceStatusLabel(status);
}

/**
 * Get human-readable label for activity type
 * @deprecated Use getActivityTypeLabel from domainLabels instead
 */
export function getActivityLabel(activity: ActivityType): string {
  return getActivityTypeLabel(activity);
}

/**
 * Get badge variant for attendance status
 * @deprecated Use getAttendanceStatusBadgeVariant from domainLabels instead
 */
export function getStatusBadgeVariant(status: AttendanceStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  return getAttendanceStatusBadgeVariant(status);
}
