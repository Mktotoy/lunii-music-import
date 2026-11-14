// Bundle build.ts + code de lunii-admin-web (cloné dans vendor/) en un seul build.js exécutable par Node.
// Les modules réservés au navigateur sont remplacés par des shims. Aucun code de lunii-admin-web
// n'est stocké dans ce dépôt : l'encodeur BMP est extrait de la source clonée au moment du build.
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const ADMIN = resolve(process.env.LUNII_ADMIN || `${here}/../../vendor/lunii-admin-web`);
const SRC = `${ADMIN}/src`;

// 1. shim image : encodeur BMP 4 bits RLE extrait tel quel de la source clonée
const img = readFileSync(`${SRC}/utils/converters/image.ts`, "utf8");
const start = img.indexOf("function create4BitGrayscaleBMP(");
if (start < 0) throw new Error("encodeur BMP introuvable dans lunii-admin-web : version incompatible");
const encoder = img.slice(start);
writeFileSync(`${here}/shim_image.gen.ts`, `// GÉNÉRÉ par bundle.mjs, ne pas versionner.
import { execFileSync } from "child_process";
import { join } from "path";
const PREP = join(__dirname, "prep.py");
export const convertImageToBmp4 = async (blob: any): Promise<Blob> => {
  const raw = execFileSync("python3", [PREP, "raw", blob.path], { maxBuffer: 1 << 26 });
  const ctx: any = { canvas: { width: 320, height: 240 }, getImageData: () => ({ data: new Uint8ClampedArray(raw) }) };
  return new Blob([create4BitGrayscaleBMP(ctx)], { type: "image/bmp" });
};
${encoder}`);

// 2. bundle
const stub = (p) => ({ path: p });
await esbuild.build({
  entryPoints: [`${here}/build.ts`],
  bundle: true, platform: "node", format: "cjs", target: "node18",
  outfile: `${here}/build.js`, logLevel: "warning",
  nodePaths: [`${here}/node_modules`],
  plugins: [{
    name: "lunii-shims",
    setup(b) {
      b.onResolve({ filter: /\/converters\/audio$/ }, () => stub(`${here}/shim_audio.ts`));
      b.onResolve({ filter: /\/converters\/image$/ }, () => stub(`${here}/shim_image.gen.ts`));
      b.onResolve({ filter: /\/utils\/db$/ }, () => stub(`${here}/stubs.ts`));
      b.onResolve({ filter: /^@legendapp\/state\/persist/ }, () => stub(`${here}/stubs.ts`));
      b.onResolve({ filter: /^@ffmpeg\// }, () => stub(`${here}/stubs.ts`));
      b.onResolve({ filter: /^PROJECT\// }, (a) => ({ path: `${SRC}/${a.path.slice(8)}.ts` }));
    },
  }],
});
console.log("bundle OK");
