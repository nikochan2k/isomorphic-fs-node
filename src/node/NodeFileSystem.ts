import * as fs from "fs";
import {
  AbstractDirectory,
  AbstractFile,
  AbstractFileSystem,
  createDOMException,
  FileSystemOptions,
  HeadOptions,
  InvalidModificationError,
  InvalidStateError,
  NoModificationAllowedError,
  NotAllowedError,
  NotFoundError,
  NotReadableError,
  NotSupportedError,
  PatchOptions,
  Props,
  QuotaExceededError,
  Stats,
  URLType,
  util,
} from "isomorphic-fs";
import { pathToFileURL } from "url";
import { NodeDirectory } from "./NodeDirectory";
import { NodeFile } from "./NodeFile";

const { joinPaths, normalizePath } = util;

export function convertError(
  repository: string,
  path: string,
  err: NodeJS.ErrnoException,
  write: boolean
) {
  const code = err.code;
  if (!code) {
    return createDOMException({
      repository,
      path,
      e: err,
    });
  }
  switch (code) {
    case "ENOENT":
      return createDOMException({
        name: NotFoundError.name,
        repository,
        path,
        e: err,
      });
    case "ENOTDIR":
    case "EISDIR":
      return createDOMException({
        name: write ? InvalidModificationError.name : NotSupportedError.name,
        repository,
        path,
        e: err,
      });
    case "EEXIST":
      return createDOMException({
        name: NoModificationAllowedError.name,
        repository,
        path,
        e: err,
      });
    case "EDQUOT":
      return createDOMException({
        name: QuotaExceededError.name,
        repository,
        path,
        e: err,
      });
    case "EINVAL":
    case "EBADFD":
      return createDOMException({
        name: InvalidStateError.name,
        repository,
        path,
        e: err,
      });
    case "EPERM":
      return createDOMException({
        name: write ? NoModificationAllowedError.name : NotAllowedError.name,
        repository,
        path,
        e: err,
      });
  }
  if (0 <= code.indexOf("NOSUPPORT")) {
    return createDOMException({
      name: NotSupportedError.name,
      repository,
      path,
      e: err,
    });
  }
  if (write) {
    return createDOMException({
      name: NoModificationAllowedError.name,
      repository,
      path,
      e: err,
    });
  } else {
    return createDOMException({
      name: NotReadableError.name,
      repository,
      path,
      e: err,
    });
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
          createDOMException({
            name: InvalidModificationError.name,
            repository: this.repository,
            path,
            e: "No accessed time",
          })
        );
        return;
      }
      if (typeof props.modified !== "number") {
        reject(
          createDOMException({
            name: InvalidModificationError.name,
            repository: this.repository,
            path,
            e: "No modified time",
          })
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
