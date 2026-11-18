import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useLetterboxdSession() {
    const KEY = ["lb-session"];

    const queryClient = useQueryClient();

    const session = useQuery({
        queryKey: KEY,
        queryFn: () => window.electron.isLoggedInToLetterboxd(),
        staleTime: Infinity,
    })

    const login = useMutation({
        mutationFn: async () => window.electron.loginToLetterboxd(),
        onSuccess: (result) => queryClient.setQueryData(["lb-session"], result)
    })

    const logout = useMutation({
        mutationFn: async () => window.electron.logoutFromLetterboxd(),
        onSuccess: () => queryClient.setQueryData(["lb-session"], false)
    })

    return { username: session.data, isLoading: session.isLoading, login, logout };
}
