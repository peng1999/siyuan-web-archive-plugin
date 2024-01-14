import { Plugin, showMessage, getFrontend, IMenuBaseDetail, EventMenu } from "siyuan";
import "@/index.scss";
import { SettingUtils } from "./libs/setting-utils";
import { Client } from "@siyuan-community/siyuan-sdk";
import { ArchiveAPI, ArchiveOptions } from "./libs/archive";

const STORAGE_NAME = "menu-config";
const SETTING_ACCESS_KEY = "accessKey";
const SETTING_SECRET = "secretKey";
const SETTING_ARCHIVE_OUTLINK = "outlink";
const SETTING_ARCHIVE_SCREENSHOT = "screenshot";

async function checkStatus(job_id: string, api: ArchiveAPI) {
    for (let i = 0; i < 60; i++) {
        const status = await api.getStatus(job_id);
        switch (status.status) {
            case "success":
                console.log(status);
                showMessage(status.original_url + "上传成功");
                return;
            case "error":
                console.log(status);
                showMessage("上传失败：" + status.message ?? "unknown error", 6000, "error");
                return;
            case "pending":
                await new Promise((resolve) => setTimeout(resolve, 5000));
                break;
        }
    }
    console.log("timeout");
}

export default class PluginSample extends Plugin {
    private isMobile: boolean;
    private settingUtils: SettingUtils;
    private client: Client;

    async onload() {
        console.log("loading plugin-web-archive");

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        this.client = new Client({}, "fetch");

        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconLinkOpen" viewBox="0 0 32 32">
<g transform="matrix(2,0,0,2,0,0)"><path d="M10,0C9.447,0 9,0.447 9,1C9,1.553 9.447,2 10,2L12.584,2L6.294,8.294C5.903,8.684 5.903,9.319 6.294,9.709C6.684,10.1 7.319,10.1 7.709,9.709L14,3.416L14,6C14,6.553 14.447,7 15,7C15.553,7 16,6.553 16,6L16,1C16,0.447 15.553,0 15,0L10,0ZM2.5,1C1.119,1 0,2.119 0,3.5L0,13.5C0,14.881 1.119,16 2.5,16L12.5,16C13.881,16 15,14.881 15,13.5L15,10C15,9.447 14.553,9 14,9C13.447,9 13,9.447 13,10L13,13.5C13,13.775 12.775,14 12.5,14L2.5,14C2.225,14 2,13.775 2,13.5L2,3.5C2,3.225 2.225,3 2.5,3L6,3C6.553,3 7,2.553 7,2C7,1.447 6.553,1 6,1L2.5,1Z" style="fill-rule:nonzero;"/></g>
</symbol>
<symbol id="iconArchive" viewBox="0 0 32 32">
<g transform="matrix(1.77449,0,0,1.95528,1.80411,0.670734)"> <path d="M14.155,6.351L14.155,13C14.155,13.661 13.661,14.233 13,14.233L3,14.233C2.339,14.233 1.845,13.661 1.845,13L1.845,6.351L0.155,6.351L0.155,13C0.155,14.546 1.454,15.767 3,15.767C3,15.767 13,15.767 13,15.767C14.546,15.767 15.845,14.546 15.845,13L15.845,6.351L14.155,6.351Z"/> </g>
<g transform="matrix(2,0,0,2.87507,0,-0.875071)"> <path d="M1,1L15,1C15.553,1 16,1.447 16,2L16,3C16,3.553 15.553,4 15,4L1,4C0.447,4 0,3.553 0,3L0,2C0,1.447 0.447,1 1,1ZM1.5,2.043L1.5,2.957L14.5,2.957L14.5,2.043L1.5,2.043Z"/> </g>
<g transform="matrix(2,0,0,2.90657,0,-6.346)"><path d="M5,7.5C5,7.775 5.225,8 5.5,8L10.5,8C10.775,8 11,7.775 11,7.5C11,7.225 10.775,7 10.5,7L5.5,7C5.225,7 5,7.225 5,7.5Z"/></g>
</symbol>`);

        this.setupSettings();

        this.eventBus.on("open-menu-link", this.linkMenuEvent);
        this.eventBus.on("click-editortitleicon", ({ detail }) => {
            this.iconMenuEvent(detail.menu, [detail.data.id]);
        });
        this.eventBus.on("click-blockicon", ({ detail }) => {
            this.iconMenuEvent(
                detail.menu,
                detail.blockElements.map((el) => el.dataset.nodeId)
            );
        });

        console.log(this.i18n.helloPlugin);
    }

    onLayoutReady() {
        this.settingUtils.load();
    }

    async onunload() {
        console.log(this.i18n.byePlugin);
        await this.settingUtils.save();
    }

    openSetting() {
        this.setting.open("网页存档插件")
    }

    private setupSettings() {
        this.settingUtils = new SettingUtils(this, STORAGE_NAME);
        this.settingUtils.addItem({
            key: SETTING_ACCESS_KEY,
            value: "",
            type: "textinput",
            title: "Access Key",
            description: this.i18n.accessKeyDesc,
        });
        this.settingUtils.addItem({
            key: SETTING_SECRET,
            value: "",
            type: "textinput",
            title: "Secret Key",
            description: this.i18n.accessKeyDesc,
        });
        this.settingUtils.addItem({
            key: SETTING_ARCHIVE_OUTLINK,
            value: false,
            type: "checkbox",
            title: "存档出链",
            description: "让 Wayback Machine 同时保存网页的出链",
        });
        this.settingUtils.addItem({
            key: SETTING_ARCHIVE_SCREENSHOT,
            value: false,
            type: "checkbox",
            title: "存档截图",
            description: "让 Wayback Machine 同时保存网页的截图",
        });
    }

    private linkMenuEvent = ({ detail }: CustomEvent<IMenuBaseDetail>) => {
        detail.menu.addItem({
            icon: "iconArchive",
            label: this.i18n.saveLink,
            click: async () => {
                const url = detail.element.dataset.href;
                this.saveUrl(url);
            },
        });
        detail.menu.addItem({
            icon: "iconLinkOpen",
            label: "打开 Web Archive",
            click: () => {
                const url = detail.element.dataset.href;
                window.open("http://web.archive.org/web/" + url);
            },
        });
    };

    private iconMenuEvent = (menu: EventMenu, blockId: string[]) => {
        console.log(blockId);
        menu.addItem({
            icon: "iconArchive",
            label: "存档所有链接",
            click: async () => {
                for (const id of blockId) {
                    const resp = await this.client.getBlockDOM({ id });
                    const parser = new DOMParser();
                    const dom = parser.parseFromString(resp.data.dom, "application/xml");
                    const links = dom.querySelectorAll("[data-href]");
                    if (links.length > 0) {
                        for (const link of links) {
                            const url = link.getAttribute("data-href");
                            this.saveUrl(url);
                        }
                    } else {
                        showMessage("没有找到链接");
                    }
                }
            },
        });
    };

    private saveUrl = async (url: string) => {
        const archiveAPI = new ArchiveAPI(
            this.settingUtils.get(SETTING_ACCESS_KEY),
            this.settingUtils.get(SETTING_SECRET)
        );
        const archiveOptions: ArchiveOptions = {
            capture_outlinks: this.settingUtils.get(SETTING_ARCHIVE_OUTLINK),
            capture_screenshot: this.settingUtils.get(SETTING_ARCHIVE_SCREENSHOT),
        };
        try {
            const result = await archiveAPI.saveUrl(url, archiveOptions);
            console.log(result);
            if ("status" in result) {
                throw Error("存档失败:" + result.message);
            }
            console.log(`start saving url: ${url}`)
            showMessage("开始存档");
            setTimeout(() => checkStatus(result.job_id, archiveAPI), 5000);
        } catch (e) {
            let message = e instanceof Error ? e.message : "unknown error";
            showMessage(`error: ${message}`, 0, "error");
        }
    };
}
