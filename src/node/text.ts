import { util } from "isomorphic-fs";
import { isBuffer } from "./buffer";

export function toBase64(
  value: Buffer | ArrayBuffer | Uint8Array | string,
  encoding: "utf8" | "base64" = "utf8"
): string {
  if (isBuffer(value)) {
    return value.toString("base64");
  }

  return util.toBase64(value, encoding);
}

export function toString(
  value: Buffer | ArrayBuffer | Uint8Array | string,
  encoding: "utf8" | "base64" = "utf8"
): string {
  if (isBuffer(value)) {
    return value.toString("utf8");
  }

  return util.toString(value, encoding);
}
