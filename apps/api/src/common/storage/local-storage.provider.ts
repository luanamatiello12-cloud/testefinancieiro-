import { Injectable } from "@nestjs/common";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { IStorageProvider, StoredFile } from "./storage.provider";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./uploads";

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  async save(file: Express.Multer.File): Promise<StoredFile> {
    if (!existsSync(UPLOADS_DIR)) {
      mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const filename = `${randomUUID()}-${file.originalname}`;
    writeFileSync(join(UPLOADS_DIR, filename), file.buffer);

    return {
      url: `/uploads/${filename}`,
      filename: file.originalname,
      mimetype: file.mimetype,
    };
  }
}
