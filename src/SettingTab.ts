import {Setting, PluginSettingTab, App} from 'obsidian';
import {i18n} from "./i18n";
import LanguageInjector from "./main";


export class SettingTab extends PluginSettingTab {
    private readonly plugin: LanguageInjector;

    constructor(app: App, plugin: LanguageInjector) {
        super(app, plugin);
        this.plugin = plugin;
    }


    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        new Setting(this.containerEl)
            .setName(i18n.t.settings.languageProperty)
            .addText(text => text
                .setPlaceholder('Language')
                .setValue(this.plugin.settings.customLanguageProperty)
                .onChange(async (value) => {
                    this.plugin.settings.customLanguageProperty = value;
                    await this.plugin.saveData(this.plugin.settings);
                })
            );

        new Setting(containerEl)
            .setName(i18n.t.settings.isReplace)
            .addToggle(toggle => {
                return toggle
                    .setValue(this.plugin.settings.isReplace)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.isReplace = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });
    }
}