import { useState, useEffect } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { fetchDataFromApi } from './utils/api';

import { useSelector, useDispatch } from 'react-redux';

import { getApiConfiguration, getGenres } from './store/homeSlice';

import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import PageNotFound from './pages/404/PageNotFound';
import Details from './pages/details/Details';
import Explore from './pages/explore/Explore';
import Home from './pages/home/Home';
import SearchResult from './pages/searchResult/SearchResult';

function App() {
  const dispatch = useDispatch()
  const { url } = useSelector((state) =>
    state.home);


  useEffect(() => {
    fetchApiConfig();
    genresCall();
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
        <Route path="/search/:query" element={<SearchResult />} />
        <Route path="/explore/:mediaType" element={<Explore />} />
        <Route path='*' element={<PageNotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
