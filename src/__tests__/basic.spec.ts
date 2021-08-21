import { NodeFileSystem } from "../NodeFileSystem";
import { testAll } from "univ-fs/lib/__tests__/basic";
import { getRootDir } from "./init";

const fs = new NodeFileSystem(getRootDir());
testAll(fs);
