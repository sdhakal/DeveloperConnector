import axios from "axios";

import {
  GET_PROFILE,
  GET_PROFILES,
  PROFILE_LOADING,
  GET_ERRORS,
  CLEAR_CURRENT_PROFILE,
  SET_CURRENT_USER
} from "./types";

// Ensure Authorization header is set (useful after refresh)
const ensureAuthHeader = () => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    axios.defaults.headers.common["x-auth-token"] = token; // compatible with either extractor
  } else {
    delete axios.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common["x-auth-token"];
  }
};

// Get current profile (private)
export const getCurrentProfile = () => dispatch => {
  dispatch(setProfileLoading());
  ensureAuthHeader();
  axios
    .get("/api/profile")
    .then(res =>
      dispatch({
        type: GET_PROFILE,
        payload: res.data
      })
    )
    .catch(() =>
      dispatch({
        type: GET_PROFILE,
        payload: {}
      })
    );
};

// Get profile by handle (public)
export const getProfileByHandle = handle => dispatch => {
  dispatch(setProfileLoading());
  axios
    .get(`/api/profile/handle/${handle}`)
    .then(res =>
      dispatch({
        type: GET_PROFILE,
        payload: res.data
      })
    )
    .catch(() =>
      dispatch({
        type: GET_PROFILE,
        payload: null
      })
    );
};

// Create / Update Profile (private)
export const createProfile = (profileData, history) => dispatch => {
  ensureAuthHeader();
  axios
    .post("/api/profile", profileData)
    .then(() => history.push("/dashboard"))
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: (err && err.response && err.response.data) || { error: "Profile save failed" }
      })
    );
};

// Add Experience (private)
export const addExperience = (expData, history) => dispatch => {
  ensureAuthHeader();
  axios
    .post("/api/profile/experience", expData)
    .then(() => history.push("/dashboard"))
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: (err && err.response && err.response.data) || { error: "Add experience failed" }
      })
    );
};

// Add Education (private)
export const addEducation = (eduData, history) => dispatch => {
  ensureAuthHeader();
  axios
    .post("/api/profile/education", eduData)
    .then(() => history.push("/dashboard"))
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: (err && err.response && err.response.data) || { error: "Add education failed" }
      })
    );
};

// Delete Experience (private)
export const deleteExperience = id => dispatch => {
  ensureAuthHeader();
  axios
    .delete(`/api/profile/experience/${id}`)
    .then(res =>
      dispatch({
        type: GET_PROFILE,
        payload: res.data
      })
    )
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: (err && err.response && err.response.data) || { error: "Delete experience failed" }
      })
    );
};

// Delete Education (private)
export const deleteEducation = id => dispatch => {
  ensureAuthHeader();
  axios
    .delete(`/api/profile/education/${id}`)
    .then(res =>
      dispatch({
        type: GET_PROFILE,
        payload: res.data
      })
    )
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: (err && err.response && err.response.data) || { error: "Delete education failed" }
      })
    );
};

// Get all profiles (public)
export const getProfiles = () => dispatch => {
  dispatch(setProfileLoading());
  axios
    .get("/api/profile/all")
    .then(res =>
      dispatch({
        type: GET_PROFILES,
        payload: res.data
      })
    )
    .catch(() =>
      dispatch({
        type: GET_PROFILES,
        payload: null
      })
    );
};

// Delete account and profile (private)
export const deleteAccount = () => dispatch => {
  if (window.confirm("This will permanently delete your account and profile. Continue?")) {
    ensureAuthHeader();
    axios
      .delete("/api/profile")
      .then(() => {
        // Clear client state
        dispatch({ type: CLEAR_CURRENT_PROFILE });
        dispatch({ type: SET_CURRENT_USER, payload: {} });

        // Remove token locally (helps prevent ghost auth state)
        localStorage.removeItem("jwtToken");
        delete axios.defaults.headers.common["Authorization"];
        delete axios.defaults.headers.common["x-auth-token"];

        // Optional: redirect to login (uncomment if you want immediate nav)
        // window.location.href = "/login";
      })
      .catch(err =>
        dispatch({
          type: GET_ERRORS,
          payload: (err && err.response && err.response.data) || { error: "Delete account failed" }
        })
      );
  }
};

// Profile loading
export const setProfileLoading = () => {
  return {
    type: PROFILE_LOADING
  };
};

// Clear current profile
export const clearCurrentProfile = () => {
  return {
    type: CLEAR_CURRENT_PROFILE
  };
};
