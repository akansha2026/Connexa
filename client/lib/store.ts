import { create } from "zustand"
import { Store, User } from "./index.types"

export const useStore = create<Store>((set) => ({
    user: null,
    setUser: (newUser: User) => {
        // SOME OPERATIONS
        set(() => ({ user: newUser }))
    }
}))