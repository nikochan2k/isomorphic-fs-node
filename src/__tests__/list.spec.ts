import { NodeFileSystem } from "../node/NodeFileSystem";
import { getRootDir } from "./init";
import { testAll } from "isomorphic-fs/lib/__tests__/list";

const fs = new NodeFileSystem(getRootDir());
testAll(fs);
