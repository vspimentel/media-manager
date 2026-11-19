import { useGetConfig } from '#hooks/services/general/useGetConfig';
import { AppConfig } from '#types/common';
import { createContext, ReactNode, useState } from 'react';

export type AppContextType = {
    config: AppConfig;
    showMovieSettingsModal: boolean;
    setShowMovieSettingsModal: (value: boolean) => void;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {

    const [showMovieSettingsModal, setShowMovieSettingsModal] = useState(false);

    const { data: config } = useGetConfig() as { data: AppConfig };

    return (
        <AppContext.Provider
            value={{
                showMovieSettingsModal,
                setShowMovieSettingsModal,
                config,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
