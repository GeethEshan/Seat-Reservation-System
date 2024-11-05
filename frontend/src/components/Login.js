import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css"; // Updated import for CSS Modules

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get("https://backend-1-440807.el.r.appspot.com/api/users/user/get", {
        params: { email, password },
      });

      if (response.status === 200) {
        const { _id, name, nicNo, email, contactNo } = response.data.findUser;
        setSuccess("Login successful");
        setError("");

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

        setTimeout(() => {
          navigate("/reserve-seat");
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
      setSuccess("");
    }
  };

  const handleGoogleLoginSuccess = useCallback(async (credential) => {
    try {
      const res = await axios.post("https://backend-1-440807.el.r.appspot.com/api/users/user/google-signin", {
        idToken: credential,
      });
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

      setSuccess("User signed in successfully!");
      setError("");
      navigate("/reserve-seat");
    } catch (err) {
      setError(err.response?.data?.error || "Google Sign-In failed");
    }
  }, [navigate]);

  const loadGoogleSDK = useCallback(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts) {
        window.google.accounts.id.initialize({
          client_id: "898926845547-r7h9jlmgom538bnjuh2kigivmuh90qpk.apps.googleusercontent.com", // Google Client ID
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
  }, [handleGoogleLoginSuccess]);

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
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      const js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, [loadGoogleSDK]);

  const handleFacebookLogin = () => {
    window.FB.login((response) => {
      if (response.authResponse) {
        console.log("Facebook login success:", response);
        // Retrieve user data from Facebook
        window.FB.api("/me", { fields: "name,email" }, async (userInfo) => {
          console.log("Facebook user info:", userInfo);

          try {
            const res = await axios.post(
              "https://https://backend-1-440807.el.r.appspot.com/api/users/user/facebook-signin",
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
            setError(err.response?.data?.error || "Facebook Sign-In failed");
          }
        });
      } else {
        console.log("User cancelled login or did not fully authorize.");
      }
    });
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label htmlFor="emailInput">Email:</label>
            <input
              type="email"
              id="emailInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="passwordInput">Password:</label>
            <input
              type="password"
              id="passwordInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className={styles.loginButton}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>
        {success && (
          <div className={`${styles.popup} ${styles.success}`}>{success}</div>
        )}
        {error && <div className={`${styles.popup} ${styles.error}`}>{error}</div>}
        <div className={styles.oauthButtons}>
          <div id="google-signin-button" className={styles.googleSignin}></div>
          <button
            onClick={handleFacebookLogin}
            className={styles.facebookLogin}
            style={{
              backgroundColor: "#3b5998",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Continue with Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
