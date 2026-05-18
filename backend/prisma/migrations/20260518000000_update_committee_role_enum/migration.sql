-- AlterEnum: CommitteeRole
-- Old values: Organizer, Reviewer, Evaluator
-- New values: OrganizingCommittee, StudentVolunteers, AdministativeSupport, Communication, ITSupport

-- 1. Rename old enum
ALTER TYPE "CommitteeRole" RENAME TO "CommitteeRole_old";

-- 2. Create new enum with correct values
CREATE TYPE "CommitteeRole" AS ENUM ('OrganizingCommittee', 'StudentVolunteers', 'AdministativeSupport', 'Communication', 'ITSupport');

-- 3. Migrate column, mapping old values to new
ALTER TABLE "CommitteeMember" ALTER COLUMN "role" TYPE "CommitteeRole" USING (
  CASE "role"::text
    WHEN 'Organizer' THEN 'OrganizingCommittee'
    WHEN 'Reviewer' THEN 'OrganizingCommittee'
    WHEN 'Evaluator' THEN 'StudentVolunteers'
  END
)::"CommitteeRole";

-- 4. Drop old enum
DROP TYPE "CommitteeRole_old";
