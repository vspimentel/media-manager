import { AppContext, AppContextType } from '#contexts/app-context';
import { useContext } from 'react';

export const usePageContext = (): AppContextType => {
    const context = useContext(AppContext);

    if (!context) {
        throw new Error('The element must be used within the PageContextProvider');
    }

    return context;
};
