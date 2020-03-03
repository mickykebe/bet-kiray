import path from "path";
import { Storage } from "@google-cloud/storage";
import {
  GC_PROJECT_ID,
  GC_SERVICE_KEY_FILE_NAME,
  GCS_BUCKET_NAME
} from "./utils/secrets";

class CloudStorageUploader {
  constructor(private storage: Storage, private bucketName: string) {}

  async upload(filename: string, contentStream: any): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const gcsFileName = Date.now() + filename;
    const file = bucket.file(gcsFileName);
    const stream = file.createWriteStream();
    contentStream.pipe(stream);

    return await new Promise((resolve, reject) => {
      stream.on("error", reject);
      stream.on("finish", async () => {
        await file.makePublic();
        resolve(
          `https://storage.googleapis.com/${this.bucketName}/${gcsFileName}`
        );
      });
    });
  }
}

export const storageUploader = new CloudStorageUploader(
  new Storage({
    projectId: GC_PROJECT_ID,
    keyFilename: path.resolve(process.cwd(), GC_SERVICE_KEY_FILE_NAME)
  }),
  GCS_BUCKET_NAME
);
