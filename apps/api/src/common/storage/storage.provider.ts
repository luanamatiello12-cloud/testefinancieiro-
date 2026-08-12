export interface StoredFile {
  url: string;
  filename: string;
  mimetype: string;
}

export interface IStorageProvider {
  save(file: Express.Multer.File): Promise<StoredFile>;
}

export const STORAGE_PROVIDER = "STORAGE_PROVIDER";
