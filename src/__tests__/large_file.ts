import { readFileSync, statSync } from "fs";
import { FileSystem } from "isomorphic-fs";
import { conv } from "isomorphic-fs";
import path from "path";

const c = new conv.Converter();

export const testAll = (fs: FileSystem) => {
  test("copy large file", async () => {
    const imagePath = path.join(process.cwd(), "sample.jpg");
    const nodeStats = statSync(imagePath);
    const buffer = readFileSync(imagePath);
    const ab = await c.toArrayBuffer(buffer);
    await fs.writeAll("/sample.jpg", ab);
    const stats = await fs.stat("/sample.jpg");
    expect(stats.size).toBe(nodeStats.size);

    await fs.cp("/sample.jpg", "/sample2.jpg");
    const hash1 = await fs.hash("/sample.jpg");
    const hash2 = await fs.hash("/sample2.jpg");
    expect(hash1).toBe(hash2);
  });

  test("read specific bytes", async () => {
    const imagePath = path.join(process.cwd(), "sample.jpg");
    const actual = readFileSync(imagePath);

    const rs = await fs.createReadStream("/sample.jpg");
    const buffer = (await rs.read(777777)) as ArrayBuffer;
    await rs.close();

    expect(buffer.byteLength).toBe(777777);
    const u8 = new Uint8Array(buffer);
    let success = true;
    for (let i = 0, end = 777777; i < end; i++) {
      if (u8[i] !== actual[i]) {
        success = false;
        break;
      }
    }
    expect(success).toBe(true);
  });
};
