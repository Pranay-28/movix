import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { addToHistory } from "../../store/homeSlice";
import useFetch from "../../hooks/useFetch";
import ContentWrapper from "../contentWrapper/ContentWrapper";
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
    const { data, loading } = useFetch(`/${mediaType}/${tmdbId}`);
    const [sourceIndex, setSourceIndex] = useState(0);
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [allFailed, setAllFailed] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const timerRef = useRef(null);

    // Track Watch History
    useEffect(() => {
        if (data && !loading) {
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
                })
            );
        }
    }, [data, loading, tmdbId, mediaType, dispatch]);
    const isTV = mediaType === "tv";
    const sources = isTV ? TV_SOURCES : MOVIE_SOURCES;

    // Get episode count for the selected season
    const getEpisodeCount = useCallback(() => {
        if (!isTV || !data?.seasons) return 0;
        const s = data.seasons.find(
            (item) => item.season_number === season
        );
        return s ? s.episode_count : 1;
    }, [isTV, data, season]);

    // Build the current iframe URL
    const currentUrl = isTV
        ? sources[sourceIndex]?.(tmdbId, season, episode)
        : sources[sourceIndex]?.(tmdbId);

    // Reset source index when media changes
    useEffect(() => {
        setSourceIndex(0);
        setAllFailed(false);
        setSeason(1);
        setEpisode(1);
    }, [tmdbId, mediaType]);

    // Reset episode when season changes
    useEffect(() => {
        setEpisode(1);
    }, [season]);

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

    useEffect(() => {
        console.log("VideoPlayer Mounted/Updated:", { mediaType, tmdbId });
        return () => console.log("VideoPlayer Unmounted");
    }, [mediaType, tmdbId]);

    const episodeCount = getEpisodeCount();

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
                    {isTV ? "Watch Episode" : "Watch Now"}
                </div>

                {isTV && (
                    <div className="selectorRow">
                        <div className="selectorGroup">
                            <label htmlFor="season-select">Season</label>
                            <select
                                id="season-select"
                                value={season}
                                onChange={(e) =>
                                    setSeason(Number(e.target.value))
                                }
                            >
                                {data.seasons
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
                        <div className="selectorGroup">
                            <label htmlFor="episode-select">Episode</label>
                            <select
                                id="episode-select"
                                value={episode}
                                onChange={(e) =>
                                    setEpisode(Number(e.target.value))
                                }
                            >
                                {Array.from(
                                    { length: episodeCount },
                                    (_, i) => i + 1
                                ).map((ep) => (
                                    <option key={ep} value={ep}>
                                        Episode {ep}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

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
