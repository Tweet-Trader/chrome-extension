export type IStorage = {
    token: string;
    refreshToken: string;
    twitterId: string;
};

const defaultStorage: IStorage = {
    token: '',
    refreshToken: '',
    twitterId: '',
};

export const storage = {
    get: (): Promise<IStorage> =>
        chrome.storage.sync.get(defaultStorage) as Promise<IStorage>,
    set: (value: IStorage): Promise<void> => chrome.storage.sync.set(value),
};
