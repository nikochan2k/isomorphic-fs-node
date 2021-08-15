import * as fs from "fs";
import {
  AbstractReadStream,
  OpenReadOptions,
  Source,
  SourceType,
} from "isomorphic-fs";
import { NodeFile } from "./NodeFile";
import { convertError } from "./NodeFileSystem";

export class NodeReadStream extends AbstractReadStream {
  private readStream?: fs.ReadStream;

  constructor(file: NodeFile, options: OpenReadOptions) {
    super(file, options);
  }

  public async _close(): Promise<void> {
    this._destory();
  }

  public _read(size?: number): Promise<Source | null> {
    const readStream = this._buildReadStream();
    return new Promise<Source | null>((resolve, reject) => {
      const file = this.file;
      const onError = (err: Error) => {
        reject(convertError(file.fs.repository, file.path, err, false));
        this._destory();
      };
      readStream.on("error", onError);
      const onEnd = () => {
        resolve(null);
        this._destory();
      };
      readStream.on("end", onEnd);
      const onReadable = () => {
        const buffer: Buffer = size ? readStream.read(size) : readStream.read();
        if (buffer) {
          resolve(buffer);
        } else {
          resolve(null);
        }
        readStream.removeAllListeners();
      };
      readStream.on("readable", onReadable);
    });
  }

  public async _seek(start: number): Promise<void> {
    this._destory();
    this._buildReadStream(start);
  }

  protected getDefaultSourceType(): SourceType {
    return "Buffer";
  }

  private _buildReadStream(start?: number) {
    if (this.readStream && !this.readStream.destroyed) {
      if (start) {
        this._destory();
      } else {
        return this.readStream;
      }
    }

    const file = this.file;
    const repository = file.fs.repository;
    const path = file.path;
    try {
      const nodeFile = this.file as NodeFile;
      this.readStream = fs.createReadStream(nodeFile._getFullPath(), {
        flags: "r",
        highWaterMark: this.bufferSize,
        start,
      });
      return this.readStream;
    } catch (e) {
      throw convertError(repository, path, e, false);
    }
  }

  private _destory() {
    if (!this.readStream) {
      return;
    }

    this.readStream.removeAllListeners();
    this.readStream.destroy();
    this.readStream = undefined;
  }
}
