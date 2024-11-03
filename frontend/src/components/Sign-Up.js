import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";
import leftImage from "../images/signup.jpg";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    nicNo: "",
    contactNo: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      await axios.post("http://localhost:8000/api/users/user/add", formData); // Updated to ngrok URL
      setSuccessMessage("User registered successfully!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  const handleGoogleLoginSuccess = async (credential) => {
    try {
      const res = await axios.post(
        "https://d35c-101-2-191-7.ngrok-free.app/api/users/user/google-signin",
        { idToken: credential }
      );
      const { _id, name, nicNo, email, contactNo } = res.data.user;

      localStorage.setItem(
        "user",
        JSON.stringify({
          _id,
          name,
          nicNo,
          email,
          contactNo,
        })
      );

      setSuccessMessage("User signed in successfully!");
      navigate("/reserve-seat");
    } catch (err) {
      setError(err.response?.data?.error || "Google Sign-In failed");
    }
  };

  const loadGoogleSDK = () => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts) {
        window.google.accounts.id.initialize({
          client_id:
            "898926845547-r7h9jlmgom538bnjuh2kigivmuh90qpk.apps.googleusercontent.com", // Google Client ID
          callback: (response) => handleGoogleLoginSuccess(response.credential),
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          { theme: "outline", size: "large" } // Customize button style
        );
      } else {
        setError("Google SDK failed to load.");
      }
    };
    script.onerror = () => {
      setError("Google SDK could not be loaded.");
    };
    document.body.appendChild(script);
  };

  useEffect(() => {
    loadGoogleSDK();

    // Load Facebook SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "1632017504386559", // Facebook app ID
        cookie: true,
        xfbml: true,
        version: "v16.0",
      });
    };

    (function (d, s, id) {
      const fjs = d.getElementsByTagName(s)[0]; // Use const for fjs since it's not reassigned
      if (d.getElementById(id)) {
        return;
      }
      const js = d.createElement(s); // Use const for js since it's not reassigned
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, [loadGoogleSDK]); // Add loadGoogleSDK to the dependencies array

  const handleFacebookLogin = () => {
    window.FB.login((response) => {
      if (response.authResponse) {
        console.log("Facebook login success:", response);
        // Retrieve user data from Facebook
        window.FB.api("/me", { fields: "name,email" }, async (userInfo) => {
          console.log("Facebook user info:", userInfo); // Log entire userInfo

          try {
            const res = await axios.post(
              "https://d35c-101-2-191-7.ngrok-free.app/api/users/user/facebook-signin", // Updated to ngrok URL
              {
                accessToken: response.authResponse.accessToken,
                userInfo,
              }
            );
            const { _id, name, email } = res.data.user;

            localStorage.setItem(
              "user",
              JSON.stringify({
                _id,
                name,
                email,
              })
            );

            // Navigate directly to reserve-seat if user exists
            navigate("/reserve-seat");
          } catch (err) {
            console.error(err);
          }
        });
      } else {
        console.log("User cancelled login or did not fully authorize.");
      }
    });
  };

  return (
    <div className="signup-page">
      <div className="left-section">
        <img src={leftImage} alt="Side Display" className="left-image" />
      </div>
      <div className="right-section">
        <div className="signup-container">
          <h2>Sign Up</h2>
          {error && <p className="error-message">{error}</p>}
          {successMessage && (
            <p className="success-message">{successMessage}</p>
          )}
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="nic">NIC:</label>
              <input
                type="text"
                name="nicNo"
                value={formData.nicNo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="contact">Contact:</label>
              <input
                type="text"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="signup-button">
              Sign Up
            </button>
          </form>
          <div className="oauth-buttons">
            <div id="google-signin-button" className="google-signin"></div>
            <button
              onClick={handleFacebookLogin}
              className="facebook-login"
              style={{ backgroundColor: "white", color: "black" }}
            >
              Continue with Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
