export type LangStat = {
    lang: string;
    percents: number;
    project: {
        url: string;
        lastActivityAt: string;
        archived: boolean;
    }
};