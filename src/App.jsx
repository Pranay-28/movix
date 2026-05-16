import { useState, useEffect } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { fetchDataFromApi } from './utils/api';

import { useSelector, useDispatch } from 'react-redux';

import { getApiConfiguration, getGenres, setUser, setSession, setWatchHistory, setWatchLater } from './store/homeSlice';
import { supabase } from './utils/supabaseClient';

import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import PageNotFound from './pages/404/PageNotFound';
import Details from './pages/details/Details';
import Explore from './pages/explore/Explore';
import Home from './pages/home/Home';
import SearchResult from './pages/searchResult/SearchResult';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

function App() {
  const dispatch = useDispatch()
  const { url } = useSelector((state) =>
    state.home);

  const fetchWatchHistory = async (userId) => {
    if (!supabase) return;
    const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', userId)
        .order('last_watched_at', { ascending: false });

    if (!error && data) {
        const formattedHistory = data.map(item => ({
            id: item.tmdb_id,
            media_type: item.media_type,
            title: item.title,
            season: item.season,
            episode: item.episode,
            poster_path: item.poster_path,
            vote_average: item.vote_average || 0,
            release_date: item.release_date,
            genre_ids: item.genre_ids || [],
        }));
        dispatch(setWatchHistory(formattedHistory));
    }
  };

  const fetchWatchLater = async (userId) => {
    if (!supabase) return;
    const { data, error } = await supabase
        .from('watch_later')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (!error && data) {
        const formattedLater = data.map(item => ({
            id: item.tmdb_id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path,
            vote_average: item.vote_average || 0,
            release_date: item.release_date,
            genre_ids: item.genre_ids || [],
        }));
        dispatch(setWatchLater(formattedLater));
    }
  };


  useEffect(() => {
    fetchApiConfig();
    genresCall();

    // Initialize Supabase session
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        dispatch(setSession(session));
        dispatch(setUser(session?.user ?? null));
        if (session?.user) {
          fetchWatchHistory(session.user.id);
          fetchWatchLater(session.user.id);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        dispatch(setSession(session));
        dispatch(setUser(session?.user ?? null));
        if (session?.user) {
          fetchWatchHistory(session.user.id);
          fetchWatchLater(session.user.id);
        } else {
          dispatch(setWatchHistory([]));
          dispatch(setWatchLater([]));
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const fetchApiConfig = () => {
    fetchDataFromApi("/configuration")
      .then((res) => {
        if (!res || !res.images) {
          console.error("Failed to fetch API configuration", res);
          return;
        }

        const url = {
          backdrop: window.location.origin + "/api/image/original",
          poster: window.location.origin + "/api/image/original",
          profile: window.location.origin + "/api/image/original",
        };

        dispatch(getApiConfiguration(url));
      })
      .catch((err) => {
        console.error("API Config error:", err);
      });
  };

  const genresCall = async () => {
    let promises = [];
    let endPoints = ["tv", "movie"];
    let allGenres = {};

    endPoints.forEach((url) => {
      promises.push(fetchDataFromApi(`/genre/${url}/list`));
    });

    const data = await Promise.all(promises);
    data.map(({ genres }) => {
      return genres.map((item) => (allGenres[item.id] = item))
    });

    dispatch(getGenres(allGenres));
  };

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path="/:mediaType/:id" element={<Details />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/search/:query" element={<SearchResult />} />
        <Route path="/explore/:mediaType" element={<Explore />} />
        <Route path='*' element={<PageNotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
