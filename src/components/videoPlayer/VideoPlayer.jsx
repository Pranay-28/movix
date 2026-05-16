import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { BsFillPlayFill } from "react-icons/bs";
import { addToHistory, removeFromWatchLater } from "../../store/homeSlice";
import useFetch from "../../hooks/useFetch";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import EpisodeList from "./EpisodeList";
import "./style.scss";

const MOVIE_SOURCES = [
    (id) => `https://player.videasy.net/movie/${id}`,
    (id) => `https://vidlink.pro/movie/${id}`,
    (id) => `https://vidsrc.to/embed/movie/${id}`,
    (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    (id) => `https://vidsrc.xyz/embed/movie/${id}`,
];

const TV_SOURCES = [
    (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
];

const VideoPlayer = ({ mediaType, tmdbId }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { url, watchHistory, watchLater } = useSelector((state) => state.home);
    const { data, loading } = useFetch(`/${mediaType}/${tmdbId}`);

    // Check for redirected state (from login/signup) or saved progress
    const redirectState = location.state?.redirectState || (() => {
        const stored = localStorage.getItem("movix_redirect_state");
        if (stored) {
            const parsed = JSON.parse(stored);
            // Check if state is fresh (last 10 mins)
            if (Date.now() - parsed.ts < 600000 && parsed.tmdbId === tmdbId) {
                localStorage.removeItem("movix_redirect_state");
                return parsed;
            }
        }
        return null;
    })();

    const savedProgress = watchHistory.find((item) => item.id === tmdbId);

    const [season, setSeason] = useState(
        redirectState?.season || savedProgress?.season || 1
    );
    const [episode, setEpisode] = useState(
        redirectState?.episode || savedProgress?.episode || 1
    );

    // Fetch episodes for the selected season
    const { data: seasonData, loading: seasonLoading } = useFetch(
        mediaType === "tv" ? `/tv/${tmdbId}/season/${season}` : null
    );

    const [sourceIndex, setSourceIndex] = useState(0);
    const [allFailed, setAllFailed] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [startedLoading, setStartedLoading] = useState(false);
    const timerRef = useRef(null);

    // Track Watch History with a 10-second delay
    useEffect(() => {
        let historyTimer;
        if (data && !loading && startedLoading) {
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
    }, [data, loading, startedLoading, tmdbId, mediaType, dispatch, season, episode]);

    const isRedirectApplied = useRef(!!redirectState);

    const hasAttemptedRestore = useRef(null);

    // Initial Reset when movie changes
    useEffect(() => {
        setSourceIndex(0);
        setAllFailed(false);
        setShowPlayButton(false);
        setStartedLoading(false);
        setIframeKey((k) => k + 1);
        hasAttemptedRestore.current = null; // Allow a new restore check
    }, [tmdbId, mediaType]);

    // Restore from History (Both local and Cloud arrival)
    useEffect(() => {
        // Only attempt restore if we haven't successfully restored for this ID yet
        if (hasAttemptedRestore.current === tmdbId) return;

        const item = watchHistory.find((i) => i.id === tmdbId);
        if (item && mediaType === "tv") {
            setSeason(item.season || 1);
            setEpisode(item.episode || 1);
            hasAttemptedRestore.current = tmdbId;
        }
    }, [watchHistory, tmdbId, mediaType]);

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
        setShowPlayButton(false);
        setIframeKey((k) => k + 1);
    }, [season, episode]);

    // Listen for custom event to start playing (from DetailsBanner button)
    useEffect(() => {
        const handleStartPlay = () => {
            // Only show play button if sourceIndex is 1 (Source 2 - vidlink.pro)
            if (sourceIndex === 1) {
                setShowPlayButton(true);
                setStartedLoading(true);
            } else {
                // For other sources, just start loading directly
                setStartedLoading(true);
            }
        };
        window.addEventListener("startVideoPlayback", handleStartPlay);
        return () => window.removeEventListener("startVideoPlayback", handleStartPlay);
    }, [sourceIndex]);

    const handleSourceError = () => {
        if (sourceIndex < sources.length - 1) {
            const newIndex = sourceIndex + 1;
            setSourceIndex(newIndex);
            // Show play button only when switching to Source 2 (index 1)
            if (newIndex === 1) {
                setShowPlayButton(true);
                setStartedLoading(false);
            } else {
                setShowPlayButton(false);
                setStartedLoading(true);
            }
            setIframeKey((k) => k + 1);
        } else {
            setAllFailed(true);
        }
    };

    const handleIframeLoad = () => {
        // Clear the fallback timer on successful load
        if (timerRef.current) clearTimeout(timerRef.current);
        setStartedLoading(true); // Ensure sync starts once iframe is ready
    };

    const handleRetry = () => {
        setSourceIndex(0);
        setAllFailed(false);
        setShowPlayButton(false);
        setIframeKey((k) => k + 1);
        setStartedLoading(true);
    };



    const { user } = useSelector((state) => state.home);
    const [authBlocked, setAuthBlocked] = useState(false);

    // Initialize watchTime from localStorage to prevent refresh loophole
    const [watchTime, setWatchTime] = useState(() => {
        if (user) return 0;
        const stored = localStorage.getItem(`movix_watch_time_${tmdbId}`);
        return stored ? parseInt(stored) : 0;
    });

    // Paywall Logic for TV
    useEffect(() => {
        if (!user && mediaType === "tv" && episode > 1) {
            setAuthBlocked(true);
        } else {
            setAuthBlocked(false);
        }
    }, [user, mediaType, episode]);

    // Paywall Logic for Movies (2 minutes for testing, 35 for production)
    useEffect(() => {
        let timer;
        if (!user && mediaType === "movie" && !showPlayButton && !loading && !authBlocked) {
            timer = setInterval(() => {
                setWatchTime((prev) => {
                    const nextTime = prev + 1;
                    localStorage.setItem(`movix_watch_time_${tmdbId}`, nextTime.toString());

                    if (nextTime >= 35 * 60) { // 2 minutes (Changed for testing)
                        setAuthBlocked(true);
                        clearInterval(timer);
                    }
                    return nextTime;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [user, mediaType, showPlayButton, loading, authBlocked, tmdbId]);

    // Save Progress to Supabase
    useEffect(() => {
        const saveProgress = async () => {
            if (supabase && user && data && startedLoading) {
                const { error } = await supabase
                    .from('watch_history')
                    .upsert({
                        user_id: user.id,
                        tmdb_id: tmdbId,
                        title: data.title || data.name,
                        media_type: mediaType,
                        poster_path: data.poster_path,
                        vote_average: data.vote_average,
                        release_date: data.release_date || data.first_air_date,
                        genre_ids: data.genres?.map((g) => g.id) || [],
                        season: mediaType === "tv" ? season : null,
                        episode: mediaType === "tv" ? episode : null,
                        last_watched_at: new Date().toISOString(),
                    }, { onConflict: 'user_id, tmdb_id' });

                if (error) console.error("Sync Error:", error);
                else {
                    console.log("Progress Synced to Supabase");
                    
                    // Auto-remove from Watch Later if it exists
                    if (watchLater.some(item => item.id === tmdbId)) {
                        dispatch(removeFromWatchLater(tmdbId));
                        await supabase
                            .from('watch_later')
                            .delete()
                            .eq('tmdb_id', tmdbId)
                            .eq('user_id', user.id);
                        console.log("Auto-removed from Watch Later");
                    }
                }
            }
        };

        // Initial sync after 10s of watching, then every 30s
        const initialDelay = setTimeout(saveProgress, 10000);
        const interval = setInterval(saveProgress, 30000);

        return () => {
            clearTimeout(initialDelay);
            clearInterval(interval);
        };
    }, [user, data, startedLoading, tmdbId, mediaType, season, episode]);

    // ... (keep existing useEffects or merge them)

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

                <div
                    className="playerWrapper"
                    style={{
                        backgroundImage: authBlocked ? `url(${url.backdrop + data?.backdrop_path})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* Always show the base content (Placeholder or Video) */}
                    {!authBlocked && (
                        showPlayButton ? (
                            <div
                                className="playPlaceholder"
                                onClick={() => {
                                    setShowPlayButton(false);
                                    setStartedLoading(true);
                                }}
                                style={{
                                    backgroundImage: `url(${url.backdrop + data.backdrop_path})`
                                }}
                            >
                                <div className="overlay"></div>
                                <div className="playContent">
                                    <div className="playIconWrapper">
                                        <BsFillPlayFill />
                                    </div>
                                    <span className="playTitle">{data.title || data.name}</span>
                                    <span className="playYear">
                                        {dayjs(data.release_date || data.first_air_date).format("YYYY")}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )
                    )}

                    {/* Show AuthOverlay on top if blocked */}
                    <AuthOverlay
                        mediaType={mediaType}
                        authBlocked={authBlocked}
                        setAuthBlocked={setAuthBlocked}
                        season={season}
                        episode={episode}
                        tmdbId={tmdbId}
                        navigate={navigate}
                        location={location}
                    />
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
                            className="switchBtn resetBtn"
                            onClick={() => {
                                setSourceIndex(0);
                                setShowPlayButton(false);
                                setIframeKey((k) => k + 1);
                                setAllFailed(false);
                                setStartedLoading(true);
                            }}
                        >
                            Reset to Source 1
                        </button>
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
            </ContentWrapper>
        </div>
    );
};

export default VideoPlayer;

const AuthOverlay = ({ mediaType, authBlocked, setAuthBlocked, season, episode, tmdbId, navigate, location }) => {
    if (!authBlocked) return null;

    return (
        <div className="authOverlay">
            <div className="overlayContent">
                <span className="lockIcon">🔒</span>
                <h2>Continue Watching for Free!</h2>
                <p>
                    Movix is 100% free. Create a free account to continue
                    watching this {mediaType === "tv" ? "series" : "movie"} and
                    sync your progress across all your devices.
                </p>
                <div className="authActions">
                    <button
                        className="loginBtn"
                        onClick={() => {
                            localStorage.setItem("movix_redirect_state", JSON.stringify({
                                season,
                                episode,
                                tmdbId,
                                ts: Date.now()
                            }));
                            navigate("/login", {
                                state: {
                                    from: location,
                                    redirectState: { season, episode },
                                },
                            });
                        }}
                    >
                        Login
                    </button>
                    <button
                        className="signupBtn"
                        onClick={() => {
                            localStorage.setItem("movix_redirect_state", JSON.stringify({
                                season,
                                episode,
                                tmdbId,
                                ts: Date.now()
                            }));
                            navigate("/signup", {
                                state: {
                                    from: location,
                                    redirectState: { season, episode },
                                },
                            });
                        }}
                    >
                        Sign Up Free
                    </button>
                    <button
                        className="closeBtn"
                        onClick={() => setAuthBlocked(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
