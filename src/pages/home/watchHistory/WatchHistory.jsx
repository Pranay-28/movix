import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromHistory, clearHistory } from "../../../store/homeSlice";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import Carousel from "../../../components/carousel/Carousel";
import "./style.scss";

const WatchHistory = () => {
    const dispatch = useDispatch();
    const { watchHistory } = useSelector((state) => state.home);

    if (watchHistory.length === 0) return null;

    const onRemove = (id) => {
        dispatch(removeFromHistory(id));
    };

    const onClearAll = () => {
        if (window.confirm("Are you sure you want to clear all your watch history?")) {
            dispatch(clearHistory());
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
