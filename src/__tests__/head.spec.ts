import { NodeFileSystem } from "../node/NodeFileSystem";
import { testAll } from "isomorphic-fs/lib/__tests__/head";
import { getRootDir } from "./init";

const fs = new NodeFileSystem(getRootDir());
testAll(fs);
