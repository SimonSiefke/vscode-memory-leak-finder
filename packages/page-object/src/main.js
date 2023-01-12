import * as ActivityBar from "./parts/ActivityBar/ActivityBar.js";
import * as Editor from "./parts/Editor/Editor.js";
import * as Explorer from "./parts/Explorer/Explorer.js";
import * as KeyBindingsEditor from "./parts/KeyBindingsEditor/KeyBindingsEditor.js";
import * as Output from "./parts/Output/Output.js";
import * as Panel from "./parts/Panel/Panel.js";
import * as QuickPick from "./parts/QuickPick/QuickPick.js";
import * as Search from "./parts/Search/Search.js";
import * as SideBar from "./parts/SideBar/SideBar.js";
import * as Suggest from "./parts/Suggest/Suggest.js";
import * as TitleBar from "./parts/TitleBar/TitleBar.js";

export const create = ({ page, expect, VError }) => {
  return {
    ActivityBar: ActivityBar.create({ page, expect, VError }),
    Editor: Editor.create({ page, expect, VError }),
    Explorer: Explorer.create({ page, expect, VError }),
    KeyBindingsEditor: KeyBindingsEditor.create({ page, expect, VError }),
    Output: Output.create({ page, expect, VError }),
    Panel: Panel.create({ page, expect, VError }),
    QuickPick: QuickPick.create({ page, expect, VError }),
    Search: Search.create({ page, expect, VError }),
    SideBar: SideBar.create({ page, expect, VError }),
    Suggest: Suggest.create({ page, expect, VError }),
    TitleBar: TitleBar.create({ page, expect, VError }),
  };
};
