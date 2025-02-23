import { join } from "path";
import * as GetVscodeUserDataPath from "../GetVscodeUserDataPath/GetVsCodeUserDataPath.js";

export const getStorageFolders = () => {
  const userDataPath = GetVscodeUserDataPath.getVscodeUserDataPath();
  const globalStoragePath =
    process.env.GLOBAL_STORAGE || join(userDataPath, "User", "globalStorage");
  const workSpaceStoragePaths =
    process.env.WORKSPACE_STORAGE ||
    join(userDataPath, "User", "workspaceStorage");
  return {
    globalStoragePath,
    workSpaceStoragePaths,
  };
};
