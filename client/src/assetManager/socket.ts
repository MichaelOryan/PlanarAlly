import { Manager } from "socket.io-client";

import { Asset } from "@/core/comm/types";
import { baseAdjust } from "../core/utils";
import { assetStore } from "./store";
import { BASE_PATH } from "../utils";

const manager = new Manager(location.protocol + "//" + location.host, {
    autoConnect: false,
    path: BASE_PATH + "socket.io",
    transports: ["websocket", "polling"],
});

export const socket = manager.socket("/pa_assetmgmt");

let disConnected = false;

// export const socket = io.connect(location.protocol + "//" + location.host + "/pa_assetmgmt");
socket.on("connect", () => {
    console.log("Connected");
    if (disConnected) socket.emit("Folder.Get", assetStore.folderPath);
});
socket.on("disconnect", () => {
    console.log("Disconnected");
    disConnected = true;
});
socket.on("redirect", (destination: string) => {
    console.log("redirecting");
    window.location.href = destination;
});
socket.on("Folder.Root.Set", (root: number) => {
    assetStore.setRoot(root);
});
socket.on("Folder.Set", (data: { folder: Asset; path?: number[] }) => {
    assetStore.clear();
    assetStore.idMap.set(data.folder.id, data.folder);
    if (data.folder.children) {
        for (const child of data.folder.children) {
            assetStore.idMap.set(child.id, child);
            if (child.file_hash) {
                assetStore.resolveUpload(child.name);
                assetStore.files.push(child.id);
            } else {
                assetStore.folders.push(child.id);
            }
        }
    }
    if (data.path) assetStore.setPath(data.path);
    window.history.pushState(null, "Asset Manager", baseAdjust(`/assets${assetStore.currentFilePath}`));
});
socket.on("Folder.Create", (folder: Asset) => {
    assetStore.folders.push(folder.id);
    assetStore.idMap.set(folder.id, folder);
});
socket.on("Asset.Upload.Finish", (asset: Asset) => {
    assetStore.idMap.set(asset.id, asset);
    assetStore.files.push(asset.id);
    assetStore.resolveUpload(asset.name);
});
