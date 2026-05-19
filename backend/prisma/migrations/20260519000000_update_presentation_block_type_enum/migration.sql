-- AlterEnum: replace PresentationBlockType values (Keynote, Break, Other -> General)

-- 1. Create new enum with desired values
CREATE TYPE "PresentationBlockType_new" AS ENUM ('General', 'Presentation');

-- 2. Map old values to new, then swap column type
ALTER TABLE "PresentationBlock"
  ALTER COLUMN "type" TYPE "PresentationBlockType_new"
  USING (
    CASE "type"::text
      WHEN 'Presentation' THEN 'Presentation'::"PresentationBlockType_new"
      ELSE 'General'::"PresentationBlockType_new"
    END
  );

-- 3. Drop old enum and rename
DROP TYPE "PresentationBlockType";
ALTER TYPE "PresentationBlockType_new" RENAME TO "PresentationBlockType";
