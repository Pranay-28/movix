import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import useFetch from "../../../hooks/useFetch";
import Genres from "../../../components/genres/Genres";
import CircleRating from "../../../components/circleRating/CircleRating";
import Img from "../../../components/lazyLoadImg/Img.jsx";
import PosterFallback from "../../../assets/no-poster.png";
import { PlayIcon } from "../Playbtn";
import VideoPopup from "../../../components/videoPopup/VideoPopup";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { useDispatch } from "react-redux";
import { addToWatchLater, removeFromWatchLater } from "../../../store/homeSlice";
import { supabase } from "../../../utils/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import { VscChromeClose } from "react-icons/vsc";


const DetailsBanner = ({ video, crew }) => {
    const [show, setShow] = useState(false);
    const [videoId, setVideoId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "" });


    const { mediaType, id } = useParams();
    const { data, loading } = useFetch(`/${mediaType}/${id}`);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { url, user, watchLater } = useSelector((state) => state.home);

    const isSaved = watchLater?.some((item) => item.id === id);

    const handleWatchLater = async () => {
        if (!user) {
            navigate("/login", { 
                state: { 
                    from: location, 
                    watchLaterPrompt: true 
                } 
            });
            return;
        }

        if (isSaved) {
            dispatch(removeFromWatchLater(id));
            setToast({ show: true, message: "Removed from Watch Later" });
            if (supabase) {
                await supabase
                    .from('watch_later')
                    .delete()
                    .eq('tmdb_id', id)
                    .eq('user_id', user.id);
            }
        } else {
            const newItem = {
                id: id,
                media_type: mediaType,
                title: data.name || data.title,
                poster_path: data.poster_path,
                vote_average: data.vote_average || 0,
                release_date: data.release_date || data.first_air_date,
                genre_ids: data.genres?.map(g => g.id) || [],
            };
            dispatch(addToWatchLater(newItem));
            setToast({ show: true, message: "Added to Watch Later!" });
            if (supabase) {
                await supabase
                    .from('watch_later')
                    .insert({
                        user_id: user.id,
                        tmdb_id: id,
                        media_type: mediaType,
                        title: data.name || data.title,
                        poster_path: data.poster_path,
                        vote_average: data.vote_average,
                        release_date: data.release_date || data.first_air_date,
                        genre_ids: data.genres?.map(g => g.id),
                    });
            }
        }
        
        // Auto-hide toast after 3 seconds
        setTimeout(() => setToast({ show: false, message: "" }), 3000);
    };

    const _genres = data?.genres?.map((g) => g.id);

    const director = crew?.filter((f) => f.job === "Director");
    const writer = crew?.filter((f) => f.job === "ScreenPlay" || f.job === "Writer" || f.job === "Story");

    const toHoursAndMinutes = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
    };

    return (
        <div className="detailsBanner">
            {!loading ? (
                <>
                    {!!data && (
                        <React.Fragment>
                            <div className="backdrop-img">
                                <Img src={url.backdrop + data.backdrop_path} />
                            </div>
                            <div className="opacity-layer"></div>
                            <ContentWrapper>
                                <div className="content">
                                    <div className="left">
                                        {data.poster_path ? (
                                            <Img
                                                className="posterImg"
                                                src={url.backdrop + data.poster_path} />
                                        ) : (
                                            <Img
                                                className="posterImg"
                                                src={PosterFallback} />
                                        )}
                                    </div>
                                    <div className="right">
                                        <div className="title">
                                            {`${data.name || data.title} 
                                            (${dayjs(data?.release_date).format("YYYY")})`}
                                        </div>
                                        <div className="subtitle">
                                            {data.tagline}
                                        </div>
                                        <Genres data={_genres} />

                                        <div className="row">
                                            <CircleRating rating={data.vote_average.toFixed(1)} />
                                            <div className="playbtn" onClick={() => {
                                                setShow(true)
                                                setVideoId(video.key)
                                            }}>
                                                <div className="iconContainer">
                                                    <PlayIcon />
                                                </div>
                                                <span className="text">
                                                    Trailer
                                                </span>
                                            </div>
                                            <div className="playbtn watchNow" onClick={() => {
                                                document.getElementById("watchNowSection")?.scrollIntoView({ behavior: "smooth" });
                                                window.dispatchEvent(new CustomEvent("startVideoPlayback"));
                                            }}>
                                                <div className="iconContainer">
                                                    <PlayIcon />
                                                </div>
                                                <span className="text">
                                                    {mediaType === "tv" ? "Full Series" : "Full Movie"}
                                                </span>
                                            </div>
                                            <div className="bookmarkBtn" onClick={handleWatchLater}>
                                                <div className="iconContainer">
                                                    {isSaved ? (
                                                        <BsBookmarkFill className="icon filled" />
                                                    ) : (
                                                        <BsBookmark className="icon" />
                                                    )}
                                                </div>
                                                <span className="text">
                                                    {isSaved ? "Saved" : "Watch Later"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overview">
                                            <div className="heading">
                                                Overview
                                            </div>
                                            <div className="descripton">
                                                {data.overview}
                                            </div>
                                        </div>
                                        <div className="info">
                                            {data.status && (
                                                <div className="infoItem">
                                                    <span className="text bold">
                                                        Status:{" "}
                                                    </span>
                                                    <span className="text">
                                                        {data.status}
                                                    </span>
                                                </div>
                                            )}
                                            {(data.release_date ? data.release_date : data.first_air_date) && (
                                                <div className="infoItem">
                                                    <span className="text bold">
                                                        Release Date:{" "}
                                                    </span>
                                                    <span className="text">
                                                        {dayjs(
                                                            data.release_date || data.first_air_date
                                                        ).format("MMM D, YYYY")}
                                                    </span>
                                                </div>
                                            )}
                                            {data.runtime && (
                                                <div className="infoItem">
                                                    <span className="text bold">
                                                        Runtime:{" "}
                                                    </span>
                                                    <span className="text">
                                                        {toHoursAndMinutes(data.runtime)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {director?.length > 0 && (
                                            <div className="info">
                                                <span className="text bold">
                                                    Director:{" "}
                                                </span>
                                                <span className="text">
                                                    {director?.map((d, i) => (
                                                        <span key={i}>
                                                            {d.name}
                                                            {director.length - 1 !== i && ", "}
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>
                                        )}

                                        {writer?.length > 0 && (
                                            <div className="info">
                                                <span className="text bold">
                                                    Writer:{" "}
                                                </span>
                                                <span className="text">
                                                    {writer?.map((d, i) => (
                                                        <span key={i}>
                                                            {d.name}
                                                            {writer.length - 1 !== i && ", "}
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>
                                        )}

                                        {data?.created_by?.length > 0 && (
                                            <div className="info">
                                                <span className="text bold">
                                                    Creator:{" "}
                                                </span>
                                                <span className="text">
                                                    {data?.created_by?.map((d, i) => (
                                                        <span key={i}>
                                                            {d.name}
                                                            {data?.created_by.length - 1 !== i && ", "}
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <VideoPopup
                                    show={show}
                                    setShow={setShow}
                                    videoId={videoId}
                                    setVideoId={setVideoId}
                                />
                            </ContentWrapper>
                        </React.Fragment>
                    )}
                    {toast.show && (
                        <div className="toast">
                            <span className="toastMsg">{toast.message}</span>
                            <button className="toastClose" onClick={() => setToast({ show: false, message: "" })}>
                                <VscChromeClose />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="detailsBannerSkeleton">
                    <ContentWrapper>
                        <div></div>
                        <div className="left skeleton"></div>
                        <div className="right">
                            <div className="row skeleton"></div>
                            <div className="row skeleton"></div>
                            <div className="row skeleton"></div>
                            <div className="row skeleton"></div>
                            <div className="row skeleton"></div>
                            <div className="row skeleton"></div>
                            <div className="row skeleton"></div>
                        </div>
                    </ContentWrapper>
                </div>
            )}
        </div>
    );
};

export default DetailsBanner;