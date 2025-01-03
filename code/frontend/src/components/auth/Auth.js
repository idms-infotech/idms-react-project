import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import React from "react";
const Auth = () => {
    return 
    (
     <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
     </Router>
    );  
};

export default Auth