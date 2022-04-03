import { NodeFileSystem } from "../NodeFileSystem";
import { testAll } from "./large_file";
import { getRootDir } from "./setup";

const fs = new NodeFileSystem(getRootDir());
testAll(fs);
