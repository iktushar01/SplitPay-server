export interface ICreateSettlementPayload {
  fromUserId: string;
  toUserId: string;
  amount: number;
  date?: string;
}
