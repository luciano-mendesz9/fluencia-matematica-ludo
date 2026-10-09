import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";

export type StoredQuestionImage = {
  mimeType: string;
  altText: string;
  bytes: Uint8Array;
  contentHash: string;
};

export interface QuestionMediaStore {
  writeImage(tx: Prisma.TransactionClient, input: StoredQuestionImage & { versionId: string }): Promise<void>;
  findVersionImage(tx: Prisma.TransactionClient, input: { questionId: string; versionNumber: number }): Promise<StoredQuestionImage | null>;
  readImage(mediaId: string): Promise<Omit<StoredQuestionImage, "altText"> | null>;
}

class PrismaQuestionMediaStore implements QuestionMediaStore {
  async writeImage(tx: Prisma.TransactionClient, input: StoredQuestionImage & { versionId: string }) {
    await tx.questionMedia.create({
      data: {
        versionId: input.versionId,
        mimeType: input.mimeType,
        byteSize: input.bytes.length,
        altText: input.altText,
        contentHash: input.contentHash,
        bytes: new Uint8Array(input.bytes),
      },
    });
  }

  async findVersionImage(tx: Prisma.TransactionClient, input: { questionId: string; versionNumber: number }) {
    const media = await tx.questionMedia.findFirst({
      where: { version: { questionId: input.questionId, versionNumber: input.versionNumber }, kind: "IMAGE" },
      select: { mimeType: true, altText: true, bytes: true, contentHash: true },
    });
    return media ? { ...media, bytes: new Uint8Array(media.bytes) } : null;
  }

  async readImage(mediaId: string) {
    const media = await prisma.questionMedia.findUnique({
      where: { id: mediaId },
      select: { bytes: true, mimeType: true, contentHash: true },
    });
    return media ? { ...media, bytes: new Uint8Array(media.bytes) } : null;
  }
}

export const questionMediaStore: QuestionMediaStore = new PrismaQuestionMediaStore();
