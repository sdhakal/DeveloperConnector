import axios from 'axios';

const setAuthToken = token => {
  if (token) {
    // Send both headers so we work with either extractor
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.defaults.headers.common['x-auth-token'] = token;
    localStorage.setItem('jwtToken', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['x-auth-token'];
    localStorage.removeItem('jwtToken');
  }
};

export default setAuthToken;
