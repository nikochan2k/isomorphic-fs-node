import * as fs from "fs";
import { Source } from "univ-conv";
import {
  AbstractFile,
  AbstractFileSystem,
  joinPaths,
  OpenOptions,
  WriteOptions,
} from "univ-fs";
import { convertError } from "./NodeFileSystem";

export class NodeFile extends AbstractFile {
  public override toString = this._getFullPath;

  constructor(fs: AbstractFileSystem, path: string) {
    super(fs, path);
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

  protected async _getSource(options: OpenOptions): Promise<Source> {
    try {
      const stream = fs.createReadStream(this._getFullPath(), {
        flags: "r",
        highWaterMark: options.bufferSize,
      });
      return stream;
    } catch (e) {
      throw convertError(this.fs.repository, this.path, e, false);
    }
  }

  protected async _write(src: Source, options: WriteOptions): Promise<void> {
    try {
      const flags = (options.append ? "a" : "w") + (options.create ? "x" : "");
      const writable = fs.createWriteStream(this._getFullPath(), {
        flags,
        highWaterMark: options.bufferSize,
      });
      const converter = this._getConverter(options.bufferSize);
      await converter.pipe(src, writable);
    } catch (e) {
      throw convertError(this.fs.repository, this.path, e, true);
    }
  }
}
