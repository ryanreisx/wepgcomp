-- CreateTable
CREATE TABLE "_PresentationToUserAccount" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PresentationToUserAccount_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PresentationToUserAccount_B_index" ON "_PresentationToUserAccount"("B");

-- AddForeignKey
ALTER TABLE "_PresentationToUserAccount" ADD CONSTRAINT "_PresentationToUserAccount_A_fkey" FOREIGN KEY ("A") REFERENCES "Presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PresentationToUserAccount" ADD CONSTRAINT "_PresentationToUserAccount_B_fkey" FOREIGN KEY ("B") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
