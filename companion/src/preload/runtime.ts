import { contextBridge, ipcRenderer } from "electron";
import { installCompanionBridge } from "./index";

installCompanionBridge(contextBridge, ipcRenderer);
