import * as fs from "fs";
import {
  AbstractWriteStream,
  createError,
  NoModificationAllowedError,
  OpenWriteOptions,
  SeekOrigin,
} from "isomorphic-fs";
import { NodeFile } from "./NodeFile";
import { convertError } from "./NodeFileSystem";

export class NodeWriteStream extends AbstractWriteStream {
  private writeStream?: fs.WriteStream;

  constructor(private file: NodeFile, options: OpenWriteOptions) {
    super(file, options);
  }

  public async _close(): Promise<void> {
    this._destory();
  }

  public async _truncate(len: number): Promise<void> {
    this._destory();

    return new Promise<void>((resolve, reject) => {
      fs.truncate(this.file._getFullPath(), len, (e) => {
        if (e) {
          const fso = this.fso;
          reject(
            createError({
              name: NoModificationAllowedError.name,
              repository: fso.fs.repository,
              path: fso.path,
              e,
            })
          );
          return;
        }
        resolve();
      });
    });
  }

  public async _write(buffer: ArrayBuffer | Uint8Array): Promise<void> {
    if (this.options.append) {
      await this.seek(0, SeekOrigin.End);
    } else {
      this._buildWriteStream();
    }

    const writeStream = this.writeStream as fs.WriteStream;
    return new Promise<void>(async (resolve, reject) => {
      const nodeBuffer = await this.converter.toBuffer(buffer);
      writeStream.write(nodeBuffer, (err) => {
        if (err) {
          const fso = this.fso;
          reject(convertError(fso.fs.repository, fso.path, err, true));
          return;
        }
        resolve();
      });
    });
  }

  protected async _seek(start: number): Promise<void> {
    this._buildWriteStream(start);
  }

  private _buildWriteStream(start?: number) {
    const writeStream = this.writeStream;
    if (writeStream && !writeStream.destroyed) {
      if (start) {
        this._destory();
      } else {
        return writeStream;
      }
    }

    const fso = this.fso;
    try {
      this.writeStream = fs.createWriteStream(this.file._getFullPath(), {
        flags: start ? "a" : "w",
        highWaterMark: this.bufferSize,
        start,
      });
      return this.writeStream;
    } catch (e) {
      throw convertError(fso.fs.repository, fso.path, e, true);
    }
  }

  private async _destory(): Promise<void> {
    if (!this.writeStream) {
      return;
    }

    this.writeStream.removeAllListeners();
    this.writeStream.destroy();
    this.writeStream = undefined;
  }
}
