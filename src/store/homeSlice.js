import { createSlice } from '@reduxjs/toolkit';

export const homeSlice = createSlice({
    name: "home",
    initialState: {
        url: {},
        genres: {},
        watchHistory: (() => {
            try {
                return JSON.parse(localStorage.getItem("watchHistory")) || [];
            } catch (e) {
                console.error("History Parse Error:", e);
                return [];
            }
        })(),
        watchLater: (() => {
            try {
                return JSON.parse(localStorage.getItem("watchLater")) || [];
            } catch (e) {
                console.error("WatchLater Parse Error:", e);
                return [];
            }
        })(),
        user: null,
        session: null,
    },
    reducers: {
        getApiConfiguration: (state, action) => {
            state.url = action.payload;
        },
        getGenres: (state, action) => {
            state.genres = action.payload;
        },
        addToHistory: (state, action) => {
            const newItem = action.payload;
            // Remove if already exists to move to top
            let updatedHistory = state.watchHistory.filter(
                (item) => Number(item.id) !== Number(newItem.id)
            );
            // Add to start
            updatedHistory.unshift(newItem);
            // Limit to 20 items
            if (updatedHistory.length > 20) {
                updatedHistory = updatedHistory.slice(0, 20);
            }
            state.watchHistory = updatedHistory;
            localStorage.setItem("watchHistory", JSON.stringify(updatedHistory));
        },
        removeFromHistory: (state, action) => {
            const id = action.payload;
            const updatedHistory = state.watchHistory.filter(
                (item) => Number(item.id) !== Number(id)
            );
            state.watchHistory = updatedHistory;
            localStorage.setItem("watchHistory", JSON.stringify(updatedHistory));
        },
        clearHistory: (state) => {
            state.watchHistory = [];
            localStorage.removeItem("watchHistory");
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setSession: (state, action) => {
            state.session = action.payload;
        },
        setWatchHistory: (state, action) => {
            state.watchHistory = action.payload;
            localStorage.setItem("watchHistory", JSON.stringify(action.payload));
        },
        setWatchLater: (state, action) => {
            state.watchLater = action.payload;
            localStorage.setItem("watchLater", JSON.stringify(action.payload));
        },
        addToWatchLater: (state, action) => {
            const newItem = action.payload;
            // Avoid duplicates
            if (!state.watchLater.find(item => item.id === newItem.id)) {
                const updatedList = [newItem, ...state.watchLater];
                state.watchLater = updatedList;
                localStorage.setItem("watchLater", JSON.stringify(updatedList));
            }
        },
        removeFromWatchLater: (state, action) => {
            const id = action.payload;
            const updatedList = state.watchLater.filter(item => item.id !== id);
            state.watchLater = updatedList;
            localStorage.setItem("watchLater", JSON.stringify(updatedList));
        }
    },
});

export const {
    getApiConfiguration,
    getGenres,
    addToHistory,
    removeFromHistory,
    clearHistory,
    setUser,
    setSession,
    setWatchHistory,
    setWatchLater,
    addToWatchLater,
    removeFromWatchLater,
} = homeSlice.actions;
export default homeSlice.reducer;