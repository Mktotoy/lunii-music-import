// Driver CLI : installe des albums (dossiers de MP3 préparés) sur un volume Lunii via le code du projet.
// Usage : node build.js <volume_lunii> <dossier_pistes_preparees> [--title "Nom"]...
import * as fs from "fs";
import * as path from "path";
import { randomUUID, webcrypto } from "crypto";
import { execFileSync } from "child_process";
import { state } from "PROJECT/store";
import { getDeviceInfo } from "PROJECT/utils/lunii/deviceInfo";
import { installStudioPack } from "PROJECT/utils/lunii/installStudioPack";
import { FsDir, FsFile, toAB } from "./fshandles";

const HERE = __dirname;
const SCRATCH = process.env.LUNII_SCRATCH || path.join(HERE, "scratch");

// ---- globals navigateur ----
(globalThis as any).crypto = webcrypto;
(globalThis as any).navigator = {
  storage: { getDirectory: async () => new FsDir("opfs", SCRATCH) },
};

// ---- album -> pack (même structure que MusicAlbumTool.tsx de lunii-admin-web) ----
type Track = { path: string };
async function buildPack(title: string, tracks: Track[], coverPng: string) {
  const assets = new Map<string, any>();
  const packUuid = randomUUID();
  const coverFile: any = new FsFile("cover.png", coverPng);
  assets.set("menu.full", await coverFile.getFile());

  const stageNodes: any[] = [];
  const actionNodes: any[] = [];
  const menuNode = {
    uuid: randomUUID(),
    controlSettings: { wheel: true, ok: true, home: false, pause: false, autoplay: false, pause_can_resume: true },
    image: "menu.full",
    okTransition: { actionNode: "choice_menu", optionIndex: 0 },
    homeTransition: null,
  };
  stageNodes.push(menuNode);
  const selectUuids = tracks.map(() => randomUUID());
  const playUuids = tracks.map(() => randomUUID());
  actionNodes.push({ id: "cover_action", options: [menuNode.uuid] });

  tracks.forEach((t, i) => {
    const audioName = `track_${i}.mp3`;
    assets.set(audioName, { name: audioName, path: t.path, type: "audio/mpeg", arrayBuffer: async () => toAB(fs.readFileSync(t.path)) });
    const imageName = "menu.full";
    const isLast = i === tracks.length - 1;
    stageNodes.push({
      uuid: selectUuids[i], audio: audioName, image: imageName,
      controlSettings: { wheel: true, ok: true, home: true, pause: false, autoplay: true, pause_can_resume: false },
      okTransition: { actionNode: `play_action_${i}`, optionIndex: 0 },
      homeTransition: { actionNode: "cover_action", optionIndex: 0 },
    });
    stageNodes.push({
      uuid: playUuids[i], audio: audioName, image: imageName,
      controlSettings: { wheel: false, ok: true, home: true, pause: true, autoplay: true, pause_can_resume: true },
      okTransition: { actionNode: isLast ? "choice_menu" : `play_action_${i + 1}`, optionIndex: 0 },
      homeTransition: { actionNode: "choice_menu", optionIndex: i },
    });
    actionNodes.push({ id: `play_action_${i}`, options: [playUuids[i]] });
  });
  actionNodes.push({ id: "choice_menu", options: selectUuids });

  const pack = {
    uuid: packUuid,
    title,
    description: `Album par Inconnu`,
    version: 1,
    stageNodes,
    actionNodes,
  };
  return { pack, assets };
}

async function main() {
  const [volume, albumsRoot] = process.argv.slice(2);
  if (!volume || !albumsRoot) throw new Error("usage: build.js <volume> <dossier_albums_prepares>");
  const deviceHandle = new FsDir("LUNII", volume);
  state.luniiHandle.set(deviceHandle as any);
  const device = await getDeviceInfo(deviceHandle as any);
  state.device.set(device as any);
  console.log(`Appareil : ${device.version}, firmware ${(device as any).firmwareVersion}`);

  const albums = fs.readdirSync(albumsRoot).filter((d) => fs.statSync(path.join(albumsRoot, d)).isDirectory()).sort();
  for (const album of albums) {
    const dir = path.join(albumsRoot, album);
    const tracks = fs.readdirSync(dir).filter((f) => f.endsWith(".mp3")).sort().map((f) => ({ path: path.join(dir, f) }));
    const cover = path.join(SCRATCH, `cover-${album.replace(/[^\w]+/g, "_")}.png`);
    fs.mkdirSync(SCRATCH, { recursive: true });
    const title = album.replace(/^\d+\s+/, "");
    execFileSync("python3", [path.join(HERE, "prep.py"), "cover", title, cover]);
    const { pack, assets } = await buildPack(title, tracks, cover);
    console.log(`Installation : ${album} (${tracks.length} pistes, uuid ${pack.uuid})`);
    await installStudioPack(pack as any, assets, device as any);
    console.log(`OK : ${album}`);
  }
}

main().catch((e) => {
  console.error("ECHEC:", e);
  process.exit(1);
});
