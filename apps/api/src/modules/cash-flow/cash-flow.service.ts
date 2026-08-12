import { Injectable } from "@nestjs/common";
import { CashFlowRepository } from "./cash-flow.repository";
import { CashFlowGranularity } from "./dto/query-cash-flow.dto";
import { addUTCDays, dayKey, monthKey, utcMondayOf, utcMonthRange, utcToday, utcYearRange, yearKey } from "../../common/date-utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface Bucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

function buildBuckets(granularity: CashFlowGranularity, referenceDate: Date): Bucket[] {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  if (granularity === "day") {
    const { start, end } = utcMonthRange(year, month);
    const buckets: Bucket[] = [];
    for (let d = start; d <= end; d = addUTCDays(d, 1)) {
      const dayEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
      buckets.push({ key: dayKey(d), label: String(d.getUTCDate()), start: d, end: dayEnd });
    }
    return buckets;
  }

  if (granularity === "week") {
    const { start: monthStart, end: monthEnd } = utcMonthRange(year, month);
    const buckets: Bucket[] = [];
    let cursor = utcMondayOf(monthStart);
    while (cursor <= monthEnd) {
      const weekEnd = addUTCDays(cursor, 6);
      const weekEndOfDay = new Date(
        Date.UTC(weekEnd.getUTCFullYear(), weekEnd.getUTCMonth(), weekEnd.getUTCDate(), 23, 59, 59, 999),
      );
      buckets.push({
        key: dayKey(cursor),
        label: `${pad(cursor.getUTCDate())}/${pad(cursor.getUTCMonth() + 1)}`,
        start: cursor,
        end: weekEndOfDay,
      });
      cursor = addUTCDays(cursor, 7);
    }
    return buckets;
  }

  if (granularity === "month") {
    const buckets: Bucket[] = [];
    for (let m = 0; m < 12; m++) {
      const { start, end } = utcMonthRange(year, m);
      buckets.push({ key: monthKey(start), label: monthKey(start), start, end });
    }
    return buckets;
  }

  const buckets: Bucket[] = [];
  for (let y = year - 4; y <= year; y++) {
    const { start, end } = utcYearRange(y);
    buckets.push({ key: yearKey(start), label: String(y), start, end });
  }
  return buckets;
}

@Injectable()
export class CashFlowService {
  constructor(private readonly repository: CashFlowRepository) {}

  async get(granularity: CashFlowGranularity, referenceDateStr?: string) {
    const referenceDate = referenceDateStr ? new Date(referenceDateStr) : utcToday();
    const buckets = buildBuckets(granularity, referenceDate);
    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;

    const transactions = await this.repository.paidTransactionsInRange(rangeStart, rangeEnd);

    let runningBalance = 0;
    const series = buckets.map((bucket) => {
      const inRange = transactions.filter((t) => t.date >= bucket.start && t.date <= bucket.end);
      const receitas = round(inRange.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.value, 0));
      const despesas = round(inRange.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.value, 0));
      runningBalance = round(runningBalance + receitas - despesas);
      return { key: bucket.key, label: bucket.label, receitas, despesas, saldo: runningBalance };
    });

    const totalReceitas = round(transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.value, 0));
    const totalDespesas = round(transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.value, 0));

    return {
      granularity,
      referenceDate: referenceDate.toISOString(),
      series,
      totalReceitas,
      totalDespesas,
      saldoPeriodo: round(totalReceitas - totalDespesas),
      transactions,
    };
  }
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
