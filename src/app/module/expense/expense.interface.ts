export interface ICreateExpensePayload {
  title: string;
  amount: number;
  paidById: string;
  date?: string;
  /** Defaults to all group members when omitted (MVP equal split). */
  participantIds?: string[];
}
