import React from "react";
import "../Admin-CSS/Footer.css"; 

const Footer = () => {
  return (
    <div className="footer-container">
      <div className="footer-wrapper">
        <div className="footer-section-one">
            <h1 style={{textAlign:"center",marginLeft:"80px",fontSize:"3em"}}>PlaceMate</h1>
          </div>
          

    <div class="footer-wrapper">
  <div class="footer-section-two">
    <div class="founders-section">
      <h3>Founders</h3>
      <ul>
        <li>Sunil Choudhary</li>
        <li>Tanmoy Nath</li>
      </ul>
    </div>
  </div>
  <div className="footer-section-columns">
  <div class="founders-section-2">
          <h3>Contact Us</h3>
          <ul>
        <li>sunil7171ghy@gmail.com</li>
        <li>tanmoytn145@gmail.com</li>
      </ul>
      </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Footer;
