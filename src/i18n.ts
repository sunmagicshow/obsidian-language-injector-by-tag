import {getLanguage} from 'obsidian';

export interface LangPack {
    settings: {
        languageProperty: string;
        defaultLanguage: string;
        replaceNote: string;

    },
    general: {
        insert_language_property: string;
        replace_all_languages: string;
        plugin_unloaded: string;
        no_active_file: string;
        already_exists: string;
        failed_to_insert_property: string;
    }

}

// 中文语言包
const zh: LangPack = {
    settings: {
        languageProperty: '属性名称',
        defaultLanguage: '默认语言',
        replaceNote: '提示：如需替换本文档所有代码块语言，请在\'快捷键\' 设置中绑定按键。',

    },
    general: {
        insert_language_property: '插入语言属性',
        replace_all_languages: '替换本文档所有代码块语言',
        plugin_unloaded: '插件已卸载',
        no_active_file: '请先打开一个 Markdown 文件',
        already_exists: '属性 {propertyKey} 已经存在',
        failed_to_insert_property: '插入属性失败',
    }
};

// 英文语言包
const en: LangPack = {
    settings: {
        languageProperty: 'Property Name',
        defaultLanguage: 'Default Language',
        replaceNote: 'Note: If you want to replace all code block languages, please bind the key in the "Shortcuts" settings.',

    },
    general: {
        insert_language_property: 'Insert language property',
        replace_all_languages: 'Replace all code block languages in this document',
        plugin_unloaded: 'Plugin unloaded',
        no_active_file: 'Please open a Markdown file first',
        already_exists: 'Property {propertyKey} already exists',
        failed_to_insert_property: 'Failed to insert property',
    }
};


// 定义语言类型
type Locale = 'zh' | 'en';

// 语言包映射
const locales: Record<Locale, LangPack> = {zh, en};

// 获取系统语言
function getSystemLocale(): Locale {
    const language = getLanguage();
    return language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export class I18nService {
    // 当前语言包实例
    public t: LangPack;

    constructor() {
        // 初始化时根据系统语言设置
        this.t = locales[getSystemLocale()];
    }
}

// 创建单例实例
export const i18n = new I18nService();