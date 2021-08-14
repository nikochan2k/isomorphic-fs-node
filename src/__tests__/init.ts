import { rmdirSync } from "fs";
import { DIR_SEPARATOR } from "isomorphic-fs/lib/util/path";
import { tmpdir } from "os";
import { normalize } from "path";

export const getRootDir = () => {
  const tempDir = tmpdir();
  let rootDir = `${tempDir}${DIR_SEPARATOR}isomorphic-fs-test`;
  rootDir = normalize(rootDir);
  rmdirSync(rootDir, { recursive: true });
  return rootDir;
};
