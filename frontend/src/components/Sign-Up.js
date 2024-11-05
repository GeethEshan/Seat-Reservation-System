import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";
import leftImage from "../images/signup.jpg";

// Use BASE_URL based on the environment
const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000" // Localhost URL for development
    : "https://backend-1-440807.el.r.appspot.com"; // Deployed backend URL

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
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      await axios.post(`${BASE_URL}/api/users/user/add`, formData);
      setSuccessMessage("User registered successfully!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  const handleGoogleLoginSuccess = useCallback(
    async (credential) => {
      try {
        const res = await axios.post(
          `${BASE_URL}/api/users/user/google-signin`,
          { idToken: credential }
        );
        const { _id, name, nicNo, email, contactNo } = res.data.user;

        localStorage.setItem(
          "user",
          JSON.stringify({ _id, name, nicNo, email, contactNo })
        );

        setSuccessMessage("User signed in successfully!");
        navigate("/reserve-seat");
      } catch (err) {
        setError(err.response?.data?.error || "Google Sign-In failed");
      }
    },
    [navigate]
  );

  const loadGoogleSDK = useCallback(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts) {
        window.google.accounts.id.initialize({
          client_id:
            "898926845547-r7h9jlmgom538bnjuh2kigivmuh90qpk.apps.googleusercontent.com",
          callback: (response) => handleGoogleLoginSuccess(response.credential),
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          { theme: "outline", size: "large" }
        );
      } else {
        setError("Google SDK failed to load.");
      }
    };
    script.onerror = () => {
      setError("Google SDK could not be loaded.");
    };
    document.body.appendChild(script);
  }, [handleGoogleLoginSuccess]);

  useEffect(() => {
    loadGoogleSDK();

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "1632017504386559",
        cookie: true,
        xfbml: true,
        version: "v16.0",
      });
    };

    (function (d, s, id) {
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      const js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, [loadGoogleSDK]);

  const handleFacebookLogin = () => {
    window.FB.login((response) => {
      if (response.authResponse) {
        window.FB.api("/me", { fields: "name,email" }, async (userInfo) => {
          try {
            const res = await axios.post(
              `${BASE_URL}/api/users/user/facebook-signin`,
              {
                accessToken: response.authResponse.accessToken,
                userInfo,
              }
            );
            const { _id, name, email } = res.data.user;

            localStorage.setItem(
              "user",
              JSON.stringify({ _id, name, email })
            );

            navigate("/reserve-seat");
          } catch (err) {
            console.error(err);
            setError("Facebook login failed");
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
          {successMessage && <p className="success-message">{successMessage}</p>}
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
              <label htmlFor="nicNo">NIC:</label>
              <input
                type="text"
                name="nicNo"
                value={formData.nicNo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactNo">Contact:</label>
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
            <button
              type="submit"
              className="signup-button"
              style={{
              backgroundColor: "#4CAF50",
              color: "white",
              height: "40px",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              marginBottom: "5px",
              cursor: "pointer",
              }}
            >
              Sign Up
            </button>
          </form>
          <div className="oauth-buttons">
            <div id="google-signin-button" className="google-signin"></div>
            <button
              onClick={handleFacebookLogin}
              className="facebook-login"
              style={{
              backgroundColor: "#3b5998",
              color: "white",
              height: "40px",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "5px",
              }}
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
