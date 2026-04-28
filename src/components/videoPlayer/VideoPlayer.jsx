import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BsFillPlayFill } from "react-icons/bs";
import { addToHistory } from "../../store/homeSlice";
import useFetch from "../../hooks/useFetch";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import EpisodeList from "./EpisodeList";
import "./style.scss";

const MOVIE_SOURCES = [
    (id) => `https://vidsrc.icu/embed/movie/${id}`,
    (id) => `https://vidsrc.to/embed/movie/${id}`,
    (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    (id) => `https://www.2embed.to/embed/tmdb/movie?id=${id}`,
];

const TV_SOURCES = [
    (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
    (id, s, e) => `https://www.2embed.to/embed/tmdb/tv?id=${id}&s=${s}&e=${e}`,
];

const VideoPlayer = ({ mediaType, tmdbId }) => {
    const dispatch = useDispatch();
    const { url, watchHistory } = useSelector((state) => state.home);
    const { data, loading } = useFetch(`/${mediaType}/${tmdbId}`);
    
    // Check for saved progress in history
    const savedProgress = watchHistory.find((item) => item.id === tmdbId);
    
    const [season, setSeason] = useState(savedProgress?.season || 1);
    const [episode, setEpisode] = useState(savedProgress?.episode || 1);
    
    // Fetch episodes for the selected season
    const { data: seasonData, loading: seasonLoading } = useFetch(
        mediaType === "tv" ? `/tv/${tmdbId}/season/${season}` : null
    );

    const [sourceIndex, setSourceIndex] = useState(0);
    const [allFailed, setAllFailed] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const timerRef = useRef(null);

    // Track Watch History with a 10-second delay
    useEffect(() => {
        let historyTimer;
        if (data && !loading) {
            historyTimer = setTimeout(() => {
                dispatch(
                    addToHistory({
                        id: tmdbId,
                        media_type: mediaType,
                        poster_path: data.poster_path,
                        title: data.title || data.name,
                        name: data.name || data.title,
                        vote_average: data.vote_average,
                        release_date: data.release_date || data.first_air_date,
                        genre_ids: data.genres?.map((g) => g.id) || [],
                        season: mediaType === "tv" ? season : undefined,
                        episode: mediaType === "tv" ? episode : undefined,
                    })
                );
            }, 10000);
        }
        return () => clearTimeout(historyTimer);
    }, [data, loading, tmdbId, mediaType, dispatch, season, episode]);

    // Reset state when media changes (or initialize from history)
    useEffect(() => {
        const item = watchHistory.find((i) => i.id === tmdbId);
        if (item && mediaType === "tv") {
            setSeason(item.season || 1);
            setEpisode(item.episode || 1);
        } else {
            setSeason(1);
            setEpisode(1);
        }
        setSourceIndex(0);
        setAllFailed(false);
        setIframeKey((k) => k + 1);
    }, [tmdbId, mediaType]);

    const isTV = mediaType === "tv";
    const sources = isTV ? TV_SOURCES : MOVIE_SOURCES;

    // Build the current iframe URL
    const currentUrl = isTV
        ? sources[sourceIndex]?.(tmdbId, season, episode)
        : sources[sourceIndex]?.(tmdbId);



    // Reset source index when season/episode changes
    useEffect(() => {
        setSourceIndex(0);
        setAllFailed(false);
        setIframeKey((k) => k + 1);
    }, [season, episode]);

    // Fallback timer — Disabled auto-switching as per user request
    /*
    useEffect(() => {
        if (allFailed) return;
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            // Only auto-switch if we haven't reached the end
            if (sourceIndex < sources.length - 1) {
                handleSourceError();
            }
        }, 5000);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [sourceIndex, iframeKey, allFailed]);
    */

    const handleSourceError = () => {
        if (sourceIndex < sources.length - 1) {
            setSourceIndex((prev) => prev + 1);
            setIframeKey((k) => k + 1);
        } else {
            setAllFailed(true);
        }
    };

    const handleIframeLoad = () => {
        // Clear the fallback timer on successful load
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const handleRetry = () => {
        setSourceIndex(0);
        setAllFailed(false);
        setIframeKey((k) => k + 1);
    };



    if (loading) {
        return (
            <div className="videoPlayerSection">
                <ContentWrapper>
                    <div className="sectionHeading skeleton" style={{ width: "200px", height: "30px", marginBottom: "20px" }}></div>
                    <div className="playerWrapper skeleton" style={{ height: "500px", background: "rgba(255,255,255,0.05)" }}></div>
                </ContentWrapper>
            </div>
        );
    }

    if (!data && !loading) return null;

    return (
        <div className="videoPlayerSection">
            <ContentWrapper>
                <div className="sectionHeading">
                    {isTV ? `Watching: ${data.name} (S${season}E${episode})` : "Watch Now"}
                </div>

                <div className="playerWrapper">
                    {allFailed ? (
                        <div className="errorMessage">
                            <span className="errorIcon">⚠️</span>
                            <p>
                                All streaming sources are currently
                                unavailable.
                            </p>
                            <button
                                className="retryBtn"
                                onClick={handleRetry}
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <iframe
                            key={iframeKey}
                            src={currentUrl}
                            width="100%"
                            height="500"
                            frameBorder="0"
                            allowFullScreen
                            allow="autoplay; encrypted-media"
                            onError={handleSourceError}
                            onLoad={handleIframeLoad}
                            title={
                                isTV
                                    ? `${data.name || data.title} S${season}E${episode}`
                                    : data.name || data.title
                            }
                        />
                    )}
                </div>

                {isTV && (
                    <div className="episodeListSection">
                        <div className="sectionHeader">
                            <div className="listHeading">Episodes</div>
                            <div className="seasonSelector">
                                <select
                                    value={season}
                                    onChange={(e) => {
                                        setSeason(Number(e.target.value));
                                        setEpisode(1);
                                    }}
                                >
                                    {data?.seasons
                                        ?.filter((s) => s.season_number > 0)
                                        .map((s) => (
                                            <option
                                                key={s.id}
                                                value={s.season_number}
                                            >
                                                Season {s.season_number}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                        <EpisodeList
                            episodes={seasonData?.episodes}
                            activeEpisode={episode}
                            onEpisodeChange={(ep) => setEpisode(ep)}
                            loading={seasonLoading}
                        />
                    </div>
                )}

                <div className="sourceInfo">
                    {!allFailed && (
                        <span className="sourceIndicator">
                            Source {sourceIndex + 1} of {sources.length}
                        </span>
                    )}
                    {!allFailed && sourceIndex < sources.length - 1 && (
                        <button
                            className="switchBtn"
                            onClick={handleSourceError}
                        >
                            Next Source (Try if not working)
                        </button>
                    )}
                    {!allFailed && sourceIndex > 0 && (
                        <button
                            className="switchBtn"
                            onClick={() => {
                                setSourceIndex(0);
                                setIframeKey((k) => k + 1);
                                setAllFailed(false);
                            }}
                        >
                            Reset to Source 1
                        </button>
                    )}
                </div>
            </ContentWrapper>
        </div>
    );
};

export default VideoPlayer;
