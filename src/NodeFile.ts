import * as fs from "fs";
import { Data } from "univ-conv";
import {
  AbstractFile,
  AbstractFileSystem,
  joinPaths,
  OpenOptions,
  Stats,
  WriteOptions,
} from "univ-fs";
import { convertError } from "./NodeFileSystem";

export class NodeFile extends AbstractFile {
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

  protected async _load(options: OpenOptions): Promise<Data> {
    try {
      const stream = fs.createReadStream(this._getFullPath(), {
        flags: "r",
        highWaterMark: options.bufferSize,
      });
      return Promise.resolve(stream);
    } catch (e: unknown) {
      throw convertError(
        this.fs.repository,
        this.path,
        e as NodeJS.ErrnoException,
        false
      );
    }
  }

  protected async _save(
    data: Data,
    _stats: Stats | undefined, // eslint-disable-line
    options: WriteOptions
  ): Promise<void> {
    try {
      const flags = (options.append ? "a" : "w") + (options.create ? "x" : "");
      const writable = fs.createWriteStream(this._getFullPath(), {
        flags,
        highWaterMark: options.bufferSize,
      });
      const converter = this._getConverter(options.bufferSize);
      await converter.pipe(data, writable);
    } catch (e) {
      throw convertError(
        this.fs.repository,
        this.path,
        e as NodeJS.ErrnoException,
        true
      );
    }
  }
}
