import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromWatchLater } from "../../../store/homeSlice";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import Carousel from "../../../components/carousel/Carousel";
import { supabase } from "../../../utils/supabaseClient";
import "./style.scss";

const WatchLater = () => {
    const dispatch = useDispatch();
    const { watchLater, user } = useSelector((state) => state.home);

    if (watchLater.length === 0) return null;

    const onRemove = async (id) => {
        dispatch(removeFromWatchLater(id));
        
        // Sync with Supabase if logged in
        if (supabase && user) {
            const { error } = await supabase
                .from('watch_later')
                .delete()
                .eq('tmdb_id', id)
                .eq('user_id', user.id);
            
            if (error) console.error("Error deleting saved item from cloud:", error);
        }
    };

    return (
        <div className="carouselSection watchLaterSection">
            <ContentWrapper>
                <div className="sectionHeader">
                    <span className="carouselTitle">Watch Later</span>
                </div>
            </ContentWrapper>
            <Carousel
                data={watchLater}
                loading={false}
                onRemove={onRemove}
            />
        </div>
    );
};

export default WatchLater;
