import React from "react";
import {
    FaFacebookF,
    FaInstagram,
    FaTwitter,
    FaLinkedin,
} from "react-icons/fa";

import ContentWrapper from "../contentWrapper/ContentWrapper";

import "./style.scss";

const Footer = () => {
    const currentyear = new Date().getFullYear;

    return (
        <footer className="footer">
            <ContentWrapper>
                <ul className="menuItems">
                    <li className="menuItem">Terms Of Use</li>
                    <li className="menuItem">Privacy-Policy</li>
                    <li className="menuItem">About</li>
                    <li className="menuItem">Blog</li>
                    <li className="menuItem">FAQ</li>
                </ul>
                <div className="infoText">
                We are dedicated to bringing you the best of the silver screen. Explore our vast collection of movies, ranging from the latest blockbusters to timeless classics. Immerse yourself in captivating stories, unforgettable performances, and breathtaking cinematography. Whether you're a fan of action, romance, comedy, or drama, our website has something for everyone. Stay updated with the latest movie releases, exclusive interviews, and behind-the-scenes insights.
                </div>
                <div className="infoText">
                    Copyright &copy; {currentyear} PRANAY, All rights reserved.
                </div>
                <div className="socialIcons">
                    <span className="icon">
                        <FaFacebookF />
                    </span>
                    <a href="https://instagram.com/pranay__28?igshid=OTk0YzhjMDVlZA==">
                    <span className="icon">
                        <FaInstagram />
                    </span>
                    </a>
                   
                    <span className="icon">
                        <FaTwitter />
                    </span>
                    <span className="icon">
                        <FaLinkedin />
                    </span>
                </div>
            </ContentWrapper>
        </footer>
    );
};

export default Footer;
