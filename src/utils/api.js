import axios from "axios";

const BASE_URL = (typeof window !== 'undefined' ? window.location.origin : '') + "/api/tmdb";
const TMDB_TOKEN = import.meta.env.VITE_APP_TMDB_TOKEN;

const headers = {
    Authorization: "bearer " + TMDB_TOKEN,
};

export const fetchDataFromApi = async (url, params) => {
    try {
        const fullUrl = BASE_URL + (url.startsWith("/") ? url : "/" + url);
        console.log("API Proxy Request:", fullUrl);
        const { data } = await axios.get(fullUrl, {
            headers,
            params,
        });
        return data;
    } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
    }
};