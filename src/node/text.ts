import { DEFAULT_BUFFER_SIZE, util } from "isomorphic-fs";
import { isBuffer } from "./buffer";

async function bufferToBase64(buffer: Buffer) {
  return buffer.toString("base64");
}

export async function toBase64(
  value: Buffer | ArrayBuffer | Uint8Array | string,
  encoding: "utf8" | "base64" = "utf8"
): Promise<string> {
  if (isBuffer(value)) {
    const chunks: string[] = [];
    for (
      let start = 0, end = value.byteLength;
      start < end;
      start += DEFAULT_BUFFER_SIZE
    ) {
      const buf = value.slice(start, start + DEFAULT_BUFFER_SIZE);
      const chunk = await bufferToBase64(buf);
      chunks.push(chunk);
    }
    const base64 = chunks.join("");
    return base64;
  }

  return util.toBase64(value, encoding);
}

export async function toString(
  value: Buffer | ArrayBuffer | Uint8Array | string,
  encoding: "utf8" | "base64" = "utf8"
): Promise<string> {
  if (isBuffer(value)) {
    return value.toString("utf8");
  }

  return util.toString(value, encoding);
}
