import { createContext, ReactNode, useState } from 'react';

export type AppContextType = {
    showMovieSettingsModal: boolean;
    setShowMovieSettingsModal: (value: boolean) => void;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {

    const [showMovieSettingsModal, setShowMovieSettingsModal] = useState(false);

    return (
        <AppContext.Provider
            value={{
                showMovieSettingsModal,
                setShowMovieSettingsModal,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
