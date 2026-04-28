// import React from 'react'
import useFetch from '../../hooks/useFetch';
import Cast from './cast/Cast';
import DetailsBanner from './detailsBanner/DetailsBanner';
import './style.scss';
import { useParams } from 'react-router-dom';
import VideosSection from './videoSection/VideoSection';
import Similar from './carousels/Similar';
import Recommendation from './carousels/Recommendation';
import VideoPlayer from '../../components/videoPlayer/VideoPlayer';


const Details = () => {
  const { mediaType, id } = useParams();
  const { data, loading } = useFetch(`/${mediaType}/${id}/videos`);
  const { data: detailData } = useFetch(`/${mediaType}/${id}`);
  const { data: credits, loading: creditsLoading } = useFetch(
    `/${mediaType}/${id}/credits`
  );
  return (
    <div>
      <DetailsBanner video={data?.results[0]} crew={credits?.crew} />
      <VideoPlayer mediaType={mediaType} tmdbId={id} data={detailData} />
      <Cast data={credits?.cast} loading={creditsLoading} />
      <VideosSection data={data} loading={loading} />
      <Similar mediaType={mediaType} id={id} />
      <Recommendation mediaType={mediaType} id={id} />
    </div>
  );
};

export default Details;