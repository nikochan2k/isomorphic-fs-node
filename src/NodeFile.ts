import * as fs from "fs";
import { Data, ConvertOptions } from "univ-conv";
import {
  AbstractFile,
  AbstractFileSystem,
  joinPaths,
  ReadOptions,
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

  public supportRangeRead(): boolean {
    return true;
  }

  public supportRangeWrite(): boolean {
    return true;
  }

  protected async _load(_stats: Stats, options: ReadOptions): Promise<Data> {
    try {
      let readable = fs.createReadStream(this._getFullPath(), {
        flags: "r",
        highWaterMark: options.bufferSize,
        start: options.start,
      });

      if (0 < (options.length as number)) {
        const co: Partial<ConvertOptions> = { ...options };
        delete co.start;
        const converter = this._getConverter();
        readable = (await converter.slice(readable, co)) as fs.ReadStream; // eslint-disable-line
      }

      return readable;
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
        start: options.start,
      });

      const converter = this._getConverter();
      if (0 < (options.length as number)) {
        const co: Partial<ConvertOptions> = { ...options };
        delete co.start;
        data = await converter.slice(data, co);
      }

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
