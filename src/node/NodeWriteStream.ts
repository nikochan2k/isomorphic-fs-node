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

  constructor(file: NodeFile, options: OpenWriteOptions) {
    super(file, options);
  }

  public async _close(): Promise<void> {
    this._destory();
  }

  public async _truncate(len: number): Promise<void> {
    this._destory();

    return new Promise<void>((resolve, reject) => {
      const nodeFile = this.file as NodeFile;
      fs.truncate(nodeFile._getFullPath(), len, (e) => {
        if (e) {
          reject(
            createError({
              name: NoModificationAllowedError.name,
              repository: nodeFile.fs.repository,
              path: nodeFile.path,
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
          const file = this.file;
          reject(convertError(file.fs.repository, file.path, err, true));
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

    const nodeFile = this.file as NodeFile;
    try {
      this.writeStream = fs.createWriteStream(nodeFile._getFullPath(), {
        flags: start ? "a" : "w",
        highWaterMark: this.bufferSize,
        start,
      });
      return this.writeStream;
    } catch (e) {
      throw convertError(nodeFile.fs.repository, nodeFile.path, e, true);
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
