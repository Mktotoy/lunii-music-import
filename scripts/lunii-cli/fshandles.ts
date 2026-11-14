// Handles façon File System Access (API navigateur), adossés au disque, pour exécuter le code du projet en Node.
import * as fs from "fs";
import * as path from "path";

// copie exacte du contenu (Buffer peut être un morceau d'un pool)
export const toAB = (b: Buffer): ArrayBuffer => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

// ---- handles de fichiers façon File System Access, adossés au disque ----
export class FsFile {
  kind = "file" as const;
  constructor(public name: string, public p: string) {}
  async getFile() {
    const p = this.p;
    return {
      name: this.name,
      path: p,
      type: this.name.endsWith(".mp3") ? "audio/mpeg" : this.name.endsWith(".png") ? "image/png" : "",
      arrayBuffer: async () => toAB(fs.readFileSync(p)),
      text: async () => fs.readFileSync(p, "utf8"),
    };
  }
  async createWritable() {
    const chunks: Buffer[] = [];
    const p = this.p;
    return {
      write: async (chunk: any) => {
        if (typeof chunk === "string") chunks.push(Buffer.from(chunk));
        else if (chunk instanceof ArrayBuffer) chunks.push(Buffer.from(chunk));
        else if (ArrayBuffer.isView(chunk)) chunks.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
        else chunks.push(Buffer.from(await chunk.arrayBuffer()));
      },
      close: async () => {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, Buffer.concat(chunks));
      },
    };
  }
}
export class FsDir {
  kind = "directory" as const;
  constructor(public name: string, public p: string) {}
  async getDirectoryHandle(name: string, opts: any = {}) {
    const p = path.join(this.p, name);
    if (!fs.existsSync(p)) {
      if (!opts.create) throw new Error(`NotFound: ${p}`);
      fs.mkdirSync(p, { recursive: true });
    }
    return new FsDir(name, p);
  }
  async getFileHandle(name: string, opts: any = {}) {
    const p = path.join(this.p, name);
    if (!fs.existsSync(p)) {
      if (!opts.create) throw new Error(`NotFound: ${p}`);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, Buffer.alloc(0));
    }
    return new FsFile(name, p);
  }
  async removeEntry(name: string, opts: any = {}) {
    fs.rmSync(path.join(this.p, name), { recursive: !!opts.recursive, force: true });
  }
  async *values() {
    for (const n of fs.readdirSync(this.p)) {
      const p = path.join(this.p, n);
      yield fs.statSync(p).isDirectory() ? new FsDir(n, p) : new FsFile(n, p);
    }
  }
}
