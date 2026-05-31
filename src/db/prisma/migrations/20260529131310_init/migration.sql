-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "regionId" INTEGER NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "quie_hours_start" TIMESTAMP(3),
    "quie_hours_end" TIMESTAMP(3),

    CONSTRAINT "Preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channels" (
    "id" SERIAL NOT NULL,
    "channel" TEXT NOT NULL,

    CONSTRAINT "Channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policies" (
    "id" SERIAL NOT NULL,
    "regionId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChannelsToPreferences" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ChannelsToPreferences_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Preferences_userId_key" ON "Preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Channels_channel_key" ON "Channels"("channel");

-- CreateIndex
CREATE INDEX "_ChannelsToPreferences_B_index" ON "_ChannelsToPreferences"("B");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preferences" ADD CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policies" ADD CONSTRAINT "Policies_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChannelsToPreferences" ADD CONSTRAINT "_ChannelsToPreferences_A_fkey" FOREIGN KEY ("A") REFERENCES "Channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChannelsToPreferences" ADD CONSTRAINT "_ChannelsToPreferences_B_fkey" FOREIGN KEY ("B") REFERENCES "Preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
