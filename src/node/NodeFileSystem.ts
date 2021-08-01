import * as fs from "fs";
import { pathToFileURL } from "url";
import {
  AbstractDirectory,
  AbstractFile,
  AbstractFileSystem,
  FileSystemOptions,
  HeadOptions,
  PatchOptions,
  Props,
  Stats,
  URLType,
  InvalidStateError,
  NoModificationAllowedError,
  NotFoundError,
  NotReadableError,
  util,
} from "isomorphic-fs";
import { NodeDirectory } from "./NodeDirectory";
import { NodeFile } from "./NodeFile";

const { joinPaths, normalizePath } = util;

export function convertError(
  repository: string,
  path: string,
  err: NodeJS.ErrnoException,
  write: boolean
) {
  if (err.code === "ENOENT") {
    return new NotFoundError(repository, path, err);
  }
  if (write) {
    return new NoModificationAllowedError(repository, path, err);
  } else {
    return new NotReadableError(repository, path, err);
  }
}

export class NodeFileSystem extends AbstractFileSystem {
  constructor(rootDir: string, options?: FileSystemOptions) {
    super(normalizePath(rootDir), options);
    fs.mkdirSync(rootDir, { recursive: true });
  }

  public _head(path: string, _options: HeadOptions): Promise<Stats> {
    return new Promise<Stats>((resolve, reject) => {
      fs.stat(this.getFullPath(path), (err, stats) => {
        if (err) {
          reject(convertError(this.repository, path, err, false));
        } else {
          if (stats.isDirectory()) {
            resolve({
              accessed: stats.atimeMs,
              modified: stats.mtimeMs,
            });
          } else {
            resolve({
              size: stats.size,
              accessed: stats.atimeMs,
              modified: stats.mtimeMs,
            });
          }
        }
      });
    });
  }

  public _patch(
    path: string,
    props: Props,
    _options: PatchOptions
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (typeof props.accessed !== "number") {
        reject(
          new InvalidStateError(this.repository, path, "No accessed time")
        );
        return;
      }
      if (typeof props.modified !== "number") {
        reject(
          new InvalidStateError(this.repository, path, "No modified time")
        );
        return;
      }
      fs.utimes(
        this.getFullPath(path),
        props.accessed,
        props.modified,
        (err) => {
          if (err) {
            reject(convertError(this.repository, path, err, true));
          } else {
            resolve();
          }
        }
      );
    });
  }

  public async getDirectory(path: string): Promise<AbstractDirectory> {
    return new NodeDirectory(this, path);
  }

  public async getFile(path: string): Promise<AbstractFile> {
    return new NodeFile(this, path);
  }

  public async toURL(path: string, _urlType?: URLType): Promise<string> {
    return pathToFileURL(this.getFullPath(path)).href;
  }

  protected getFullPath(path: string) {
    return joinPaths(this.repository, path);
  }
}
