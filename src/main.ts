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

        // 事件监听：依然保持自动处理（仅填充空白）
        this.registerEvent(this.app.vault.on('modify', (file) => {
            void this.handleFileModify(file, false); // 自动修改默认不强制替换
        }));

        this.addCommand({
            id: 'insert-language-property',
            name: i18n.t.general.insert_language_property,
            callback: () => {
                void this.insertLanguagePropertyToFrontmatter();
            },
        });

        this.addCommand({
            id: 'force-replace-language-tags',
            name: i18n.t.general.replace_all_languages,
            callback: () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile)
                    void this.handleFileModify(activeFile, true);
            },
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
                const defaultLangValue = this.settings.defaulteLanguage;

                if (propertyKey in frontmatter) {
                    new Notice(i18n.t.general.already_exists.replace('{propertyKey}', propertyKey));
                    return;
                }
                frontmatter[propertyKey] = defaultLangValue || "";
            });
        } catch {
            new Notice(i18n.t.general.failed_to_insert_property);
        }
    }

    private async handleFileModify(file: TAbstractFile, forceReplace: boolean = false) {
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

            const newContent = this.updateCodeBlocks(content, defaultLang, forceReplace);
            // 只有内容真的变化且非空时才修改
            if (newContent && newContent !== content) {
                await this.app.vault.modify(file, newContent);
            }
        } finally {
            // 无论是否出错，都标记为处理完成
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

    updateCodeBlocks(content: string, defaultLanguage: string, forceReplace: boolean): string {
        const codeBlockRegex = /```([^\n]*)\n([\s\S]*?)\n```/g;

        return content.replace(codeBlockRegex, (match, language, code) => {
            const trimmedLanguage = language.trim();

            if (forceReplace || trimmedLanguage === '') {
                return `\`\`\`${defaultLanguage}\n${code.trimEnd()}\n\`\`\``;
            } else {
                return match;
            }
        });
    }
}