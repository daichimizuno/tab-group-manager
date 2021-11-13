import { StorageKeys } from "./storage_keys";
import { assertIsDefined, AssertIsDefinedError } from "./utils/validations";

export interface TabGroup {
  id: number;
  tabGroupName: string;
  tabColor: Color;
  urls: string[];
}

const Color = {
  Grey: "grey",
  Blue: "blue",
  Red: "red",
  Yellow: "yellow",
  Green: "green",
  Pink: "pink",
  Purple: "purple",
  Cyan: "cyan",
} as const;
export type Color = typeof Color[keyof typeof Color];

export default class ChromeStorageAccess {
  addNewTabGroup = async (tabName: string, tabColor: Color) => {
    const tabGroupLastIndex = ((await this.syncUpdateLastIndex()) as number) || 1;
    const tabGroupData = ((await this.getAllTabGroup()) as TabGroup[]) || [];

    const newTabGroup = {
      id: tabGroupLastIndex,
      tabGroupName: tabName,
      tabColor: tabColor,
      urls: [],
    } as TabGroup;

    tabGroupData.push(newTabGroup);

    await chrome.storage.sync.set({ tabGroup: tabGroupData }, async () => {});
  };

  addUrlToTabGroup = async (url: string, tabId: number) => {
    const tabGroupData = ((await this.getAllTabGroup()) as TabGroup[]) || [];
    if (tabGroupData.length > 0) {
      const tabGroup = tabGroupData.find((tabGroup) => tabGroup.id === tabId);
      const tabGroupIndex = tabGroupData.findIndex((tabGroup) => tabGroup.id === tabId);

      try {
        assertIsDefined(tabGroup);

        // 既存のTabGroupにurlを追加する
        tabGroup.urls.push(url);

        // TabGroupのリストを新しいものに入れ替える
        tabGroupData.splice(tabGroupIndex, 1, tabGroup);

        await chrome.storage.sync.set({ tabGroup: tabGroupData }, async () => {});
      } catch (e) {
        if (e instanceof AssertIsDefinedError) {
          throw new AssertIsDefinedError("不明なエラー");
        }
      }
    }
  };

  syncUpdateLastIndex = async (): Promise<number> => {
    let index = await this.getTabGroupLastIndex();
    if (isNaN(index)) {
      index = 1;
    } else {
      index = index + 1;
    }

    await this.setTabGroupLastIndex(index.toString());
    return index;
  };

  getTabGroupLastIndex = (): Promise<number> => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([StorageKeys.TAB_GORUP_LAST_INDEX], (value) => {
        if (chrome.runtime.lastError) {
          throw chrome.runtime.lastError;
        }

        const index = value.tabGroupLastIndex === undefined ? NaN : Number(value.tabGroupLastIndex);
        resolve(index);
      });
    });
  };

  setTabGroupLastIndex = (newIndex: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ tabGroupLastIndex: newIndex }, () => {
        if (chrome.runtime.lastError) {
          throw chrome.runtime.lastError;
        }

        resolve();
      });
    });
  };

  getAllTabGroup = (): Promise<TabGroup[]> => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([StorageKeys.TAB_GROUP], (value) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        }

        resolve(value.tabGroup as TabGroup[]);
      });
    });
  };
}
