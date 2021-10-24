import { readFileSync, statSync } from "fs";
import { FileSystem } from "univ-fs";
import path from "path";

export const testAll = (fs: FileSystem) => {
  test("copy large file", async () => {
    const imagePath = path.join(process.cwd(), "sample.jpg");
    const nodeStats = statSync(imagePath);
    const buffer = readFileSync(imagePath);
    await fs.write("/sample.jpg", buffer);
    const stats = await fs.stat("/sample.jpg");
    expect(stats.size).toBe(nodeStats.size);

    await fs.cp("/sample.jpg", "/sample2.jpg");
    const hash1 = await fs.hash("/sample.jpg");
    const hash2 = await fs.hash("/sample2.jpg");
    expect(hash1).toBe(hash2);
  });
};
