export function daysSeries(days: number) {
  const out: Array<{ label: string; start: Date; end: Date }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(today);
    start.setDate(today.getDate() - i);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    out.push({
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      start,
      end,
    });
  }
  return out;
}
