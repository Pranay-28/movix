import React from "react";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import Img from "../lazyLoadImg/Img";
import NoPoster from "../../assets/no-poster.png";

const EpisodeList = ({ episodes, activeEpisode, onEpisodeChange, loading }) => {
    const { url } = useSelector((state) => state.home);

    if (loading) {
        return (
            <div className="episodesList skeleton">
                {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="episodeItem skeletonItem">
                        <div className="thumbnail skeleton"></div>
                        <div className="info skeleton">
                            <div className="line skeleton"></div>
                            <div className="line skeleton"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="episodesList">
            {episodes?.map((episode) => {
                const isSelected = activeEpisode === episode.episode_number;
                const thumbUrl = episode.still_path
                    ? url?.backdrop + episode.still_path
                    : NoPoster;

                return (
                    <div
                        key={episode.id}
                        className={`episodeItem ${isSelected ? "active" : ""}`}
                        onClick={() => onEpisodeChange(episode.episode_number)}
                    >
                        <div className="thumbnail">
                            <div className="episodeNumber">{episode.episode_number}</div>
                            <Img src={thumbUrl} />
                            {isSelected && (
                                <div className="playingOverlay">
                                    <span>Playing</span>
                                </div>
                            )}
                        </div>
                        <div className="info">
                            <div className="title">
                                {episode.episode_number}. {episode.name}
                            </div>
                            <div className="overview">{episode.overview || "No description available."}</div>
                            <div className="meta">
                                {dayjs(episode.air_date).format("MMM D, YYYY")}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EpisodeList;
