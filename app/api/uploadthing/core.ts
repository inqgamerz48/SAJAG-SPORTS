import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
    productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
        .onUploadComplete(async ({ metadata, file }) => {
            return { url: file.url };
        }),
    repairImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Repair image upload complete:", file.url);
            return { url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
