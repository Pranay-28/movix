// import React from 'react'
import './style.scss';
import HeroBanner from './heroBanner/HeroBanner';
import WatchHistory from './watchHistory/WatchHistory';
import Trending from './trending/Trending';
import Popular from './popular/Popular';
import TopRated from './topRated/TopRated';
import TrendingIndia from './trendingIndia/TrendingIndia';


const home = () => {
  return (
    <div>
      <HeroBanner />
      <WatchHistory />
      <TrendingIndia />
      <Trending />
      <Popular />
      <TopRated />
    </div>
  )
}

export default home