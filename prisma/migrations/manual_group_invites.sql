-- Run manually if prisma db push fails: npx prisma db execute --file prisma/migrations/manual_group_invites.sql

DO $$ BEGIN
  CREATE TYPE "GroupInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "group_invites" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "inviteeUserId" TEXT,
  "status" "GroupInviteStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "group_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "group_invites_groupId_email_key" ON "group_invites"("groupId", "email");
CREATE INDEX IF NOT EXISTS "group_invites_email_idx" ON "group_invites"("email");
CREATE INDEX IF NOT EXISTS "group_invites_inviteeUserId_idx" ON "group_invites"("inviteeUserId");
CREATE INDEX IF NOT EXISTS "group_invites_status_idx" ON "group_invites"("status");

DO $$ BEGIN
  ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_inviteeUserId_fkey" FOREIGN KEY ("inviteeUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
