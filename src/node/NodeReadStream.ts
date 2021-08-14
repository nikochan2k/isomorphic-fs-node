import * as fs from "fs";
import { AbstractReadStream, OpenOptions } from "isomorphic-fs";
import { NodeFile } from "./NodeFile";
import { convertError } from "./NodeFileSystem";

export class NodeReadStream extends AbstractReadStream {
  private readStream?: fs.ReadStream;

  constructor(private file: NodeFile, options: OpenOptions) {
    super(file, options);
  }

  public async _close(): Promise<void> {
    this._destory();
  }

  public _read(size?: number): Promise<Uint8Array | null> {
    const readStream = this._buildReadStream();
    return new Promise<Uint8Array | null>((resolve, reject) => {
      const fso = this.fso;
      const onError = (err: Error) => {
        reject(convertError(fso.fs.repository, fso.path, err, false));
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

  private _buildReadStream(start?: number) {
    if (this.readStream && !this.readStream.destroyed) {
      if (start) {
        this._destory();
      } else {
        return this.readStream;
      }
    }

    const fso = this.fso;
    const repository = fso.fs.repository;
    const path = fso.path;
    try {
      this.readStream = fs.createReadStream(this.file._getFullPath(), {
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
