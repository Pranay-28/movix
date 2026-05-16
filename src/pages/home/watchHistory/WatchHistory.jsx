import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromHistory, clearHistory } from "../../../store/homeSlice";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import Carousel from "../../../components/carousel/Carousel";
import { supabase } from "../../../utils/supabaseClient";
import "./style.scss";

const WatchHistory = () => {
    const dispatch = useDispatch();
    const { watchHistory, user } = useSelector((state) => state.home);

    if (watchHistory.length === 0) return null;

    const onRemove = async (id) => {
        dispatch(removeFromHistory(id));
        
        // Sync with Supabase if logged in
        if (supabase && user) {
            const { error } = await supabase
                .from('watch_history')
                .delete()
                .eq('tmdb_id', id)
                .eq('user_id', user.id);
            
            if (error) console.error("Error deleting item from cloud:", error);
        }
    };

    const onClearAll = async () => {
        if (window.confirm("Are you sure you want to clear all your watch history?")) {
            dispatch(clearHistory());

            // Sync with Supabase if logged in
            if (supabase && user) {
                const { error } = await supabase
                    .from('watch_history')
                    .delete()
                    .eq('user_id', user.id);
                
                if (error) console.error("Error clearing cloud history:", error);
            }
        }
    };

    return (
        <div className="carouselSection watchHistorySection">
            <ContentWrapper>
                <div className="sectionHeader">
                    <span className="carouselTitle">Watch History</span>
                    <button className="clearAllBtn" onClick={onClearAll}>
                        Clear All
                    </button>
                </div>
            </ContentWrapper>
            <Carousel
                data={watchHistory}
                loading={false}
                onRemove={onRemove}
            />
        </div>
    );
};

export default WatchHistory;
