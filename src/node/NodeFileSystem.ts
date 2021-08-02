import * as fs from "fs";
import {
  AbstractDirectory,
  AbstractFile,
  AbstractFileSystem,
  FileSystemOptions,
  HeadOptions,
  InvalidStateError,
  NoModificationAllowedError,
  NotFoundError,
  NotReadableError,
  NotSupportedError,
  PatchOptions,
  PathExistsError,
  Props,
  QuotaExceededError,
  SecurityError,
  Stats,
  SyntaxError,
  TypeMismatchError,
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
    return new NotSupportedError(repository, path, err);
  }
  console.log(err.code);
  switch (code) {
    case "ENOENT":
      return new NotFoundError(repository, path, err);
    case "ENOTDIR":
    case "EISDIR":
      return new TypeMismatchError(repository, path, err);
    case "EEXIST":
      return new PathExistsError(repository, path, err);
    case "EDQUOT":
      return new QuotaExceededError(repository, path, err);
    case "EINVAL":
      return new SyntaxError(repository, path, err);
    case "EBADFD":
      return new InvalidStateError(repository, path, err);
    case "EPERM":
      return new SecurityError(repository, path, err);
  }
  if (0 <= code.indexOf("NOSUPPORT")) {
    return new NotSupportedError(repository, path, err);
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
