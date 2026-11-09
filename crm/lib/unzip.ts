import "server-only";
import { inflateRawSync } from "node:zlib";

/** Returns the text of the first .csv (or .tsv/.txt) file inside a .zip, or null. Handles stored and deflated entries. */
export function firstCsvInZip(buf: Buffer): { name: string; text: string } | null {
  // End of central directory record: signature 0x06054b50, within the last 64 KB.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count && p + 46 <= buf.length; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString("utf8");
    p += 46 + nameLen + extraLen + commentLen;
    if (!/\.(csv|tsv|txt)$/i.test(name) || name.startsWith("__MACOSX/")) continue;
    if (buf.readUInt32LE(localOffset) !== 0x04034b50) return null;
    const start = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28);
    const data = buf.subarray(start, start + compSize);
    const raw = method === 0 ? data : method === 8 ? inflateRawSync(data) : null;
    if (!raw) return null;
    return { name, text: raw.toString("utf8") };
  }
  return null;
}
