import { BlobServiceClient } from "@azure/storage-blob";
import axios from "axios";
import path from "path";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const DEFAULT_CONTAINER = process.env.AZURE_STORAGE_CONTAINER!;

export class AzureUtil {
    private static blobServiceClient = BlobServiceClient.fromConnectionString(
        AZURE_STORAGE_CONNECTION_STRING
    );

    /**
     * Uploads any file (PDF, image, etc.) from a Buffer to Azure Blob Storage.
     * Automatically infers MIME type and returns the full blob URL.
     */
    static async uploadFileFromBuffer(
        buffer: Buffer,
        fileName: string,
        containerName: string = DEFAULT_CONTAINER,
        mimeType?: string
    ): Promise<string> {
        try {
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            await containerClient.createIfNotExists();

            const blockBlobClient = containerClient.getBlockBlobClient(fileName);

            await blockBlobClient.uploadData(buffer, {
                blobHTTPHeaders: { blobContentType: mimeType || this.getMimeType(fileName) },
            });

            return blockBlobClient.url;
        } catch (err) {
            console.error("AzureUtil.uploadFileFromBuffer() failed:", err);
            throw err;
        }
    }

    /**
     * Convert a blob URL (private container) into a base64 string.
     */
    static async imageUrlToBase64(blobUrl: string): Promise<string> {
        try {
            const url = new URL(blobUrl);
            const [, containerName, ...blobPathParts] = url.pathname.split("/");
            const blobName = blobPathParts.join("/");

            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlobClient(blobName);

            let mimeType: string;
            try {
                const props = await blobClient.getProperties();
                mimeType = props.contentType || AzureUtil.getMimeType(blobUrl);
            } catch {
                mimeType = AzureUtil.getMimeType(blobUrl);
            }

            const downloadResponse = await blobClient.download();
            const buffer = await this.streamToBuffer(downloadResponse.readableStreamBody);

            return `data:${mimeType};base64,${buffer.toString("base64")}`;
        } catch (err) {
            console.error("Failed to fetch blob from Azure:", err);
            throw err;
        }
    }

    /**
     * Uploads a file directly from an external URL to Azure.
     */
    static async uploadFileFromUrl(
        fileUrl: string,
        fileName: string,
        containerName: string = DEFAULT_CONTAINER
    ): Promise<string> {
        const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");

        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists();

        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: this.getMimeType(fileName) },
        });

        return blockBlobClient.url;
    }

    private static async streamToBuffer(
        readableStream?: NodeJS.ReadableStream | null
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            if (!readableStream) return reject(new Error("Empty stream"));

            readableStream.on("data", (data) =>
                chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data))
            );
            readableStream.on("end", () => resolve(Buffer.concat(chunks)));
            readableStream.on("error", reject);
        });
    }

    private static getMimeType(fileUrl: string): string {
        const ext = path.extname(fileUrl).toLowerCase();
        switch (ext) {
            case ".png": return "image/png";
            case ".jpg":
            case ".jpeg": return "image/jpeg";
            case ".pdf": return "application/pdf";
            case ".heic": return "image/heic";
            case ".heif": return "image/heif";
            default: return "application/octet-stream";
        }
    }
}