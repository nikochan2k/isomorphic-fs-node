import { NodeFileSystem } from "../node/NodeFileSystem";
import { testAll } from "./large_file";
import { getRootDir } from "./init";

const fs = new NodeFileSystem(getRootDir());
testAll(fs);
