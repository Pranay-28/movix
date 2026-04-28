import React, { useState, useEffect, useRef, useCallback } from "react";
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

const VideoPlayer = ({ mediaType, tmdbId, data }) => {
    const [sourceIndex, setSourceIndex] = useState(0);
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [allFailed, setAllFailed] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const timerRef = useRef(null);
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

    if (!data) return null;

    const episodeCount = getEpisodeCount();

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
