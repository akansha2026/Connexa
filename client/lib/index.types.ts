export type User = {
    name: string,
    email: string,
    verified: string,
    id: string
}
export type Store = {
    user: User | null,
    setUser: (newUser: User) => void
}