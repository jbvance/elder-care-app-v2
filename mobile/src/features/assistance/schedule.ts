export const namedZones: [string, string][] = [
  ['America/New_York', 'Eastern'], ['America/Chicago', 'Central'],
  ['America/Denver', 'Mountain'], ['America/Phoenix', 'Arizona'],
  ['America/Los_Angeles', 'Pacific'], ['America/Anchorage', 'Alaska'],
  ['Pacific/Honolulu', 'Hawaii'], ['America/Puerto_Rico', 'Puerto Rico'],
  ['UTC', 'UTC'],
];

export function localSchedule(date: string, time: string, zone: string): { instant: string | null; error: string | null } {
  if (!date && !time) return { instant: null, error: null };
  const d = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date);
  const t = /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(am|pm)$/i.exec(time);
  if (!d) return { instant: null, error: 'Use a real date in month/day/year format, such as 10/25/2026. Your entries are still here.' };
  const calendar = new Date(Date.UTC(+d[3], +d[1] - 1, +d[2]));
  if (calendar.getUTCFullYear() !== +d[3] || calendar.getUTCMonth() !== +d[1] - 1 || calendar.getUTCDate() !== +d[2])
    return { instant: null, error: 'Use a real date in month/day/year format, such as 10/25/2026. Your entries are still here.' };
  if (!t) return { instant: null, error: 'For a timed need, add a date and a time such as 10:00 AM. Your entries are still here.' };
  const hour = (+t[1] % 12) + (t[3].toLowerCase() === 'pm' ? 12 : 0);
  const minute = +t[2];
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    let found: Date | null = null;
    let count = 0;
    const wall = Date.UTC(+d[3], +d[1] - 1, +d[2], hour, minute);
    for (let offset = -14 * 60; offset <= 14 * 60; offset += 15) {
      const candidate = new Date(wall + offset * 60_000);
      const parts = Object.fromEntries(formatter.formatToParts(candidate).map(({ type, value }) => [type, value]));
      if (+parts.year === +d[3] && +parts.month === +d[1] && +parts.day === +d[2] && +parts.hour === hour && +parts.minute === minute) { found = candidate; count++; }
    }
    if (count === 0) return { instant: null, error: 'That local time does not occur because the clocks change. Choose another time or leave the time blank for now.' };
    if (count > 1) return { instant: null, error: 'That local time occurs twice because the clocks change. Choose another time or leave the time blank for now.' };
    return { instant: found!.toISOString(), error: null };
  } catch {
    return { instant: null, error: 'We could not confirm that time zone. Choose a listed time zone or leave the time blank for now.' };
  }
}

export function scheduleLabels(instant: string, zone: string, participantZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') {
  const value = new Date(instant);
  const format = (timeZone: string) => new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(value);
  return { authoritative: `${format(zone)} (${zone})`, participant: `${format(participantZone)} (${participantZone})` };
}
