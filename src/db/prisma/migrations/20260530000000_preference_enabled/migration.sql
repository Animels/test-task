-- AlterTable
ALTER TABLE "Preferences" ADD COLUMN "enabled" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "_ChannelsToPreferences";
