import {
    Plugin,
    showMessage,
    getFrontend,
    getBackend,
    IMenuBaseDetail,
} from "siyuan";
import "@/index.scss";
import { SettingUtils } from "./libs/setting-utils";
import { Client } from "@siyuan-community/siyuan-sdk";

const STORAGE_NAME = "menu-config";

export default class PluginSample extends Plugin {

    private isMobile: boolean
    private settingUtils: SettingUtils
    private client: Client

    async onload() {
        console.log("loading plugin-web-archive");

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        this.client = new Client({}, "fetch")

        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
<path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
</symbol>
<symbol id="iconSaving" viewBox="0 0 32 32">
<path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
</symbol>`);

        const topBarElement = this.addTopBar({
            icon: "iconFace",
            title: this.i18n.saveAllLinks,
            position: "left",
            callback: () => {
                showMessage("Clicked")
            }
        });

        const statusIconTemp = document.createElement("template");
        statusIconTemp.innerHTML = `<div class="toolbar__item ariaLabel" aria-label="Remove plugin-sample Data">
    <svg>
        <use xlink:href="#iconTrashcan"></use>
    </svg>
</div>`;
        this.addStatusBar({
            element: statusIconTemp.content.firstElementChild as HTMLElement,
        });

        this.settingUtils = new SettingUtils(this, STORAGE_NAME);
        this.settingUtils.addItem({
            key: "Input",
            value: "",
            type: "textinput",
            title: "Readonly text",
            description: "Input description",
        });
        this.settingUtils.addItem({
            key: "Check",
            value: true,
            type: "checkbox",
            title: "Checkbox text",
            description: "Check description",
        });
        this.settingUtils.addItem({
            key: "Select",
            value: 1,
            type: "select",
            title: "Readonly text",
            description: "Select description",
            options: {
                1: "Option 1",
                2: "Option 2"
            }
        });

        this.eventBus.on("open-menu-link", this.linkMenuEvent)

        console.log(this.i18n.helloPlugin);
    }

    onLayoutReady() {
        // this.loadData(STORAGE_NAME);
        this.settingUtils.load();
        showMessage(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    async onunload() {
        console.log(this.i18n.byePlugin);
        await this.settingUtils.save();
        showMessage("Goodbye SiYuan Plugin");
        console.log("onunload");
    }

    private linkMenuEvent = ({ detail }: CustomEvent<IMenuBaseDetail>) => {
        detail.menu.addItem({
            iconHTML: "",
            label: this.i18n.saveLink,
            click: async () => {
                showMessage("TODO: " + this.settingUtils.get("Input"))
                console.log(detail.element.getAttribute("data-href"))
            }
        });
    }
}
