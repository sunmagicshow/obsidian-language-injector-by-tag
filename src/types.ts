
// 定义配置接口
export interface DefaultLanguageSettings {
    customLanguageProperty: string;
    defaulteLanguage: string;
    isReplace: boolean;
}

// 定义默认设置
export const DEFAULT_SETTINGS: DefaultLanguageSettings = {
    customLanguageProperty: 'language',
    defaulteLanguage: '',
    isReplace: false ,
};

