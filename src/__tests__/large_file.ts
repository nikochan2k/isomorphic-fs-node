import { readFileSync, statSync } from "fs";
import { FileSystem } from "isomorphic-fs";
import path from "path";

export const testAll = (fs: FileSystem) => {
  test("copy large file", async () => {
    const imagePath = path.join(process.cwd(), "sample.jpg");
    const nodeStats = statSync(imagePath);
    const buffer = readFileSync(imagePath);
    await fs.writeAll("/sample.jpg", buffer);
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

    const rs = await fs.createReadStream("/sample.jpg", {
      sourceType: "Buffer",
    });
    const buffer = (await rs.read(777777)) as Buffer;
    await rs.close();

    expect(buffer.byteLength).toBe(777777);
    let success = true;
    for (let i = 0, end = 777777; i < end; i++) {
      if (buffer[i] !== actual[i]) {
        success = false;
        break;
      }
    }
    expect(success).toBe(true);
  });
};
