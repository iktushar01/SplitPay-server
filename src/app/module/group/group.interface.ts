export interface ICreateGroupPayload {
  name: string;
  description?: string;
}

export interface IAddGroupMemberPayload {
  userId: string;
}
