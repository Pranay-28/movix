import React, { useState, useEffect } from "react";
import { HiOutlineSearch, HiOutlineUserCircle } from "react-icons/hi";
import { SlMenu } from "react-icons/sl";
import { VscChromeClose } from "react-icons/vsc";
import { MdOutlineSwitchAccount } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { supabase } from "../../utils/supabaseClient";

import "./style.scss";

import ContentWrapper from "../contentWrapper/ContentWrapper";
import logo from "../../assets/movix-logo.svg";

const Header = () => {
  const [show, setShow] = useState("top");
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState("");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { user } = useSelector((state) => state.home);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    navigate("/");
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const controlNavbar = () => {
    if (window.scrollY > 200) {
      if (window.scrollY > lastScrollY && !mobileMenu) {
        setShow("hide");
      } else {
        setShow("show");
      }
    } else {
      setShow("top");
    }
    setLastScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", controlNavbar);
    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [lastScrollY]);

  const searchQueryHandler = (event) => {
    if (event.key === "Enter" && query.length > 0) {
      navigate(`/search/${query}`);
      setTimeout(() => {
        setShowSearch(false);
      }, 1000);
    }
  };

  const openSearch = () => {
    setMobileMenu(false)
    setShowSearch(true)
  }

  const openMobileMenu = () => {
    setMobileMenu(true)
    setShowSearch(false)
  }


  const navigationHandler = (type) => {
    if (type === "movie") {
      navigate("/explore/movie");
    } else {
      navigate("/explore/tv");
    }
    setMobileMenu(false);
  };

  const renderAccountMenu = () => (
    <ul className="accountDropdown">
      <li className="userInfo">
        <span className="userName">{user?.user_metadata?.full_name || 'User'}</span>
        <span className="userEmail">{user?.email}</span>
      </li>
      <li className="divider"></li>
      <li onClick={() => { navigate("/login"); setShowAccountMenu(false); }}>
        <MdOutlineSwitchAccount className="menuIcon" />
        <span>Change Account</span>
      </li>
      <li onClick={() => { handleLogout(); setShowAccountMenu(false); }}>
        <FiLogOut className="menuIcon" />
        <span>Logout</span>
      </li>
    </ul>
  );

  return (
    <header className={`header ${mobileMenu ? "mobileView" : ""} ${show}`}>
      <ContentWrapper>
        <div className="logo" onClick={() => navigate("/")}>
          <img src={logo} alt="" />
          <span className="madeBy">made by Pranay</span>
        </div>
        <ul className="menuItems">
          <li className="menuItem" onClick={() => {
            navigationHandler("movie")
          }}>Movies</li>
          <li className="menuItem" onClick={() => {
            navigationHandler("tv")
          }}>TVShows</li>
          {user ? (
            <li 
              className="menuItem account" 
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              onMouseEnter={() => setShowAccountMenu(true)}
              onMouseLeave={() => setShowAccountMenu(false)}
            >
              <div className="avatarWrapper">
                {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                  <img 
                    src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
                    alt="profile" 
                    className="userAvatar"
                  />
                ) : (
                  <HiOutlineUserCircle className="userIcon" />
                )}
              </div>
              {showAccountMenu && (
                <>
                  <div className="accountBackdrop" onClick={(e) => {
                    e.stopPropagation();
                    setShowAccountMenu(false);
                  }}></div>
                  {renderAccountMenu()}
                </>
              )}
            </li>
          ) : (
            <li className="menuItem login" onClick={() => navigate("/login")}>
              <HiOutlineUserCircle className="userIcon" />
            </li>
          )}
          <li className="menuItem">
            <HiOutlineSearch onClick={openSearch} />
          </li>
        </ul>

        <div className="mobileMenuItems">
          <HiOutlineSearch onClick={openSearch} />
          {user ? (
            <div className="mobileAccountWrapper">
              <div className="mobileAvatar" onClick={() => setShowAccountMenu(!showAccountMenu)}>
                {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                  <img 
                    src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
                    alt="profile" 
                  />
                ) : (
                  <HiOutlineUserCircle />
                )}
              </div>
              {showAccountMenu && (
                <>
                  <div className="accountBackdrop" onClick={() => setShowAccountMenu(false)}></div>
                  {renderAccountMenu()}
                </>
              )}
            </div>
          ) : (
            <HiOutlineUserCircle onClick={() => navigate("/login")} />
          )}
          {mobileMenu ? (
            <VscChromeClose onClick={() => setMobileMenu(false)} />
          ) : (
            <SlMenu onClick={openMobileMenu} />
          )}
        </div>

      </ContentWrapper>
      {showSearch && (<div className="searchBar">
        <ContentWrapper>
          <div className="searchInput">
            <input
              type="text"
              placeholder="Search for a movie or TV shows..."
              onChange={(e) => setQuery(e.target.value)}
              onKeyUp={searchQueryHandler}
            />
            <VscChromeClose onClick={() =>
              setShowSearch(false)} />
          </div>
        </ContentWrapper>
      </div>)}
    </header>
  );
};

export default Header;