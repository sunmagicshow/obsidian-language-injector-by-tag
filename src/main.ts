import {Plugin, TFile, TAbstractFile, Notice} from 'obsidian';
import {DEFAULT_SETTINGS, DefaultLanguageSettings} from "./types";
import {SettingTab} from "./SettingTab";
import * as yaml from 'js-yaml';
import {i18n} from "./i18n";

export default class LanguageInjectorByTagPlugin extends Plugin {
    settings: DefaultLanguageSettings = DEFAULT_SETTINGS;
    //标记是否正在处理文件，避免死循环
    private isProcessing = false;

    public async onload() {
        const loadedData = await this.loadData();
        this.settings = {...DEFAULT_SETTINGS, ...(loadedData as Partial<DefaultLanguageSettings> || {})};

        this.addSettingTab(new SettingTab(this.app, this));


        this.registerEvent(this.app.vault.on('modify', (file) => {
            void this.handleFileModify(file);
        }));
        // 注册命令

        this.addCommand({
            id: 'insert-language-property-to-frontmatter',
            name: '插入语言属性到 YAML 前置区',
            callback: this.insertLanguagePropertyToFrontmatter.bind(this),
        });

    }


    /**
     * 插件卸载时的清理逻辑
     */
    public onunload(): void {
        new Notice(i18n.t.general.plugin_unloaded);
    }

    private async insertLanguagePropertyToFrontmatter() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile || activeFile.extension !== 'md') {
            new Notice(i18n.t.general.no_active_file);
            return;
        }

        try {
            await this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
                const propertyKey = this.settings.customLanguageProperty;

                // 如果属性已存在且设置了不覆盖，则跳过
                if (propertyKey in frontmatter && !this.settings.isReplace) {
                    new Notice(i18n.t.general.already_exists.replace('{propertyKey}', propertyKey));
                    return;
                }
                frontmatter[propertyKey] = "";
            });
        } catch {
            new Notice(i18n.t.general.failed_to_insert_property);
        }
    }

    private async handleFileModify(file: TAbstractFile) {
        //  非 md 文件跳过
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        if (this.isProcessing) return;

        try {
            // 标记为正在处理
            this.isProcessing = true;

            const content = await this.app.vault.cachedRead(file);
            const frontmatter = this.parseFrontMatterFromContent(content);
            const langValue = frontmatter?.[this.settings.customLanguageProperty];
            const defaultLang = typeof langValue === 'string' ? langValue : '';

            if (!defaultLang) return;

            const newContent = this.updateCodeBlocks(content, defaultLang);
            // 4. 只有内容真的变化且非空时才修改（避免空修改触发循环）
            if (newContent && newContent !== content) {
                await this.app.vault.modify(file, newContent);
            }
        } finally {
            // 5. 无论是否出错，都标记为处理完成
            this.isProcessing = false;
        }
    }

    parseFrontMatterFromContent(content: string): Record<string, unknown> | null {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const match = content.match(frontmatterRegex);

        if (!match) return null;

        try {
            return yaml.load(match[1]) as Record<string, unknown>;
        } catch {
            return null;
        }
    }

    updateCodeBlocks(content: string, defaultLanguage: string): string {
        const codeBlockRegex = /```([^\n]*)\n([\s\S]*?)\n```/g;

        return content.replace(codeBlockRegex, (match, language, code) => {
            const trimmedLanguage = language.trim();

            if (this.settings.isReplace) {
                return `\`\`\`${defaultLanguage}\n${code.trimEnd()}\n\`\`\``;
            } else {
                return trimmedLanguage === ''
                    ? `\`\`\`${defaultLanguage}\n${code.trimEnd()}\n\`\`\``
                    : match;
            }
        });
    }
}