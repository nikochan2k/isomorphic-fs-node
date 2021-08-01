import { rmdirSync } from "fs";
import { tmpdir } from "os";
import { normalize } from "path";
import { util } from "isomorphic-fs";

const { DIR_SEPARATOR } = util;

export const getRootDir = () => {
  const tempDir = tmpdir();
  let rootDir = `${tempDir}${DIR_SEPARATOR}isomorphic-fs-test`;
  rootDir = normalize(rootDir);
  rmdirSync(rootDir, { recursive: true });
  return rootDir;
};
