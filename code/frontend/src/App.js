import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/auth/login/Login";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/styles/styles.scss';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/default/home" element={<div>Home Page</div>} />
      </Routes>
    </Router>
  );
}

export default App;
