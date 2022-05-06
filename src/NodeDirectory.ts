import * as fs from "fs";
import {
  AbstractDirectory,
  AbstractFileSystem,
  Item,
  joinPaths,
} from "univ-fs";
import { convertError } from "./NodeFileSystem";

export class NodeDirectory extends AbstractDirectory {
  constructor(fs: AbstractFileSystem, path: string) {
    super(fs, path);
  }

  protected _doList(): Promise<Item[]> {
    return new Promise<Item[]>((resolve, reject) => {
      fs.readdir(this.getFullPath(), (err, names) => {
        if (err) {
          reject(convertError(this.fs.repository, this.path, err, false));
        } else {
          resolve(
            names.map((name) => {
              return { path: joinPaths(this.path, name) };
            })
          );
        }
      });
    });
  }

  protected _doMkcol(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.mkdir(this.getFullPath(), { recursive: true }, (err) => {
        if (err) {
          reject(convertError(this.fs.repository, this.path, err, true));
        } else {
          resolve();
        }
      });
    });
  }

  protected _doRmdir(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.rmdir(this.getFullPath(), { recursive: false }, (err) => {
        if (err) {
          reject(convertError(this.fs.repository, this.path, err, true));
        } else {
          resolve();
        }
      });
    });
  }

  private getFullPath() {
    return joinPaths(this.fs.repository, this.path);
  }
}
