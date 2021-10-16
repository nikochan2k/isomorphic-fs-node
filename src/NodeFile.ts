import * as fs from "fs";
import {
  AbstractFile,
  AbstractFileSystem,
  AbstractReadStream,
  AbstractWriteStream,
  OpenReadOptions,
  OpenWriteOptions,
  joinPaths,
} from "univ-fs";
import { convertError } from "./NodeFileSystem";
import { NodeReadStream } from "./NodeReadStream";
import { NodeWriteStream } from "./NodeWriteStream";

export class NodeFile extends AbstractFile {
  public override toString = this._getFullPath;

  constructor(fs: AbstractFileSystem, path: string) {
    super(fs, path);
  }

  public async _createReadStream(
    options: OpenReadOptions
  ): Promise<AbstractReadStream> {
    return new NodeReadStream(this, options);
  }

  public async _createWriteStream(
    options: OpenWriteOptions
  ): Promise<AbstractWriteStream> {
    return new NodeWriteStream(this, options);
  }

  public _getFullPath() {
    return joinPaths(this.fs.repository, this.path);
  }

  public _rm(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.rm(this._getFullPath(), { force: true }, (err) => {
        if (err) {
          reject(convertError(this.fs.repository, this.path, err, true));
        } else {
          resolve();
        }
      });
    });
  }
}
