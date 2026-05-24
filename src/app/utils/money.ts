import { Prisma } from "../../generated/prisma/index";

/** Coerce Prisma Decimal / number / string to a JS number (2dp safe for display). */
export const toMoneyNumber = (
  value: Prisma.Decimal | number | string,
): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number(value.toString());
};

export const roundMoney = (amount: number): number =>
  Math.round(amount * 100) / 100;

/** Split `totalAmount` equally across members; remainder cents go to first members. */
export const splitEqually = (
  totalAmount: number,
  memberIds: string[],
): { userId: string; owedAmount: number }[] => {
  if (memberIds.length === 0) {
    throw new Error("Cannot split expense: no members provided");
  }

  const totalCents = Math.round(roundMoney(totalAmount) * 100);
  const baseCents = Math.floor(totalCents / memberIds.length);
  const remainder = totalCents - baseCents * memberIds.length;

  return memberIds.map((userId, index) => ({
    userId,
    owedAmount: (baseCents + (index < remainder ? 1 : 0)) / 100,
  }));
};
