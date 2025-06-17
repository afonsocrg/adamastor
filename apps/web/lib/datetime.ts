import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function isoStringToTimezoneDate(date: string, tz: string) {
  const utcDate = parseISO(date);
  return toZonedTime(utcDate, tz);
}

/**
 * This function receives a timezone-aware date string and returns
 * a timezone-agnostic date string for the given timezone.
 * 
 * This is important because some input elements do not support timezones
 * 
 * @param d - date string in format "yyyy-MM-dd HH:mm:ssxxx"
 * @param tz - timezone string
 * @returns date string in format "yyyy-MM-dd'T'HH:mm"
 */
export function tzDateStringToDateTimeStringWithNoTimezone(d: string, tz: string) {
  return format(isoStringToTimezoneDate(d, tz), "yyyy-MM-dd'T'HH:mm");
}

export function dateTimeStringWithNoTimezoneToTzDateString(d: string, tz: string) {
  // return format(fromZonedTime(d, tz), "yyyy-MM-dd HH:mm:ssxxx");
  return formatToUTCString(format(fromZonedTime(d, tz), 'yyyy-MM-dd HH:mm:ssxxx'));
}

export function formatToUTCString(d: string) {
  // Parse to Date object and convert to UTC
  const date = new Date(d);

  // Format back to the same format but with +00:00
  const utcStr = date.getUTCFullYear() + '-' + 
  String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + 
  String(date.getUTCDate()).padStart(2, '0') + ' ' +
  String(date.getUTCHours()).padStart(2, '0') + ':' + 
  String(date.getUTCMinutes()).padStart(2, '0') + ':' + 
  String(date.getUTCSeconds()).padStart(2, '0') + '+00:00';

  return utcStr;
}