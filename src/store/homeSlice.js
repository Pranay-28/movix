import { createSlice } from '@reduxjs/toolkit';

export const homeSlice = createSlice({
    name: "home",
    initialState: {
        url: {},
        genres: {},
        watchHistory: JSON.parse(localStorage.getItem("watchHistory")) || [],
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
                (item) => item.id !== newItem.id
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
                (item) => item.id !== id
            );
            state.watchHistory = updatedHistory;
            localStorage.setItem("watchHistory", JSON.stringify(updatedHistory));
        },
        clearHistory: (state) => {
            state.watchHistory = [];
            localStorage.removeItem("watchHistory");
        },
    },
});

export const {
    getApiConfiguration,
    getGenres,
    addToHistory,
    removeFromHistory,
    clearHistory
} = homeSlice.actions;
export default homeSlice.reducer;