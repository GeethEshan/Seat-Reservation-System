import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
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
      const response = await axios.get(
        "http://localhost:8000/api/users/user/get",
        {
          params: { email, password },
        }
      );
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

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;

    try {
      const res = await axios.post(
        "http://localhost:8000/api/users/user/google-signin",
        { idToken: credential }
      );
      const { _id, name, nicNo, email, contactNo } = res.data.user;

      // Save the Google signed-in user data in local storage
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
      console.log(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Google Sign-In failed");
    }
  };

  const handleGoogleFailure = (error) => {
    console.error("Google Sign-In error:", error);
    setError("Google Sign-In failed, please try again");
  };

  return (
    <GoogleOAuthProvider clientId="898926845547-r7h9jlmgom538bnjuh2kigivmuh90qpk.apps.googleusercontent.com">
      <div className={styles.loginPage}>
        <div className={styles.loginContainer}>
          <h1>Login</h1>
          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label htmlFor="emailInput">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="passwordInput">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              style={{
                background: "#0099ff",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                padding: "10px 15px",
                fontSize: "1rem",
                marginBottom: "5px",
                cursor: "pointer",
                transition: "background 0.3s ease",
                width: "200px",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#007acc")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#0099ff")}
              onFocus={(e) => (e.currentTarget.style.background = "#007acc")} // Ensure focus works for keyboard navigation
              onBlur={(e) => (e.currentTarget.style.background = "#0099ff")} // Ensure blur works when focus is lost
            >
              Login
            </button>
          </form>
          {success && (
            <div className={`${styles.popup} ${styles.success}`}>{success}</div>
          )}
          {error && (
            <div className={`${styles.popup} ${styles.error}`}>{error}</div>
          )}
          <div className={styles.googleLogin}>
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onFailure={handleGoogleFailure}
              style={{ margin: "1rem 0" }}
            />
          </div>
          <div className={styles.registerLink}>
            <p>Don't have an account?</p>
            <button
              onClick={() => navigate("/Sign-Up")}
              className={styles.registerButton}
            >
              Register Now
            </button>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
