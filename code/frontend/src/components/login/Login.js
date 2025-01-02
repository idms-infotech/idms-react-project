import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.scss";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logo, setLogo] = useState("");
  const [welcomeInfo, setWelcomeInfo] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    ip: "127.0.0.1",
  });

  const navigate = useNavigate();

  // Simulate API calls to get company URLs and IP
  useEffect(() => {
    // Mocked API response for company details
    setTimeout(() => {
      setLogo("./assets/companies/logo.svg");
      setWelcomeInfo("./assets/companies/welcome.svg");
      setIsLoading(true);
    }, 2000);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email) {
      alert("User ID is required");
      return false;
    }
    if (!formData.password) {
      alert("Password is required");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Mock login API
      console.log("Logging in with:", formData);
      navigate("/default/home"); // Navigate to dashboard on success
    }
  };

  return (
    <div className="container-fluid">
      <div className="flashScreen">
        {!isLoading ? (
          <img src="../assets/company/splash.svg" alt="Splash Screen" className="scale-up-center" />
        ) : (
          <div className="row loginFlash login-card">
            <div className="col part-1 text-center">
              <img src={logo} alt="Logo" className="img-fluid" />
            </div>
            <div className="col part-2 text-center">
              <img src={welcomeInfo} alt="Welcome" className="img-welcome img-fluid" />
              <form className="text-start" onSubmit={handleSubmit}>
                <div>
                  <label className="form-label">
                    User ID <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter User Name"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter Password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="d-grid">
                  <button className="btn btn-primary login-btn" type="submit">
                    Login
                  </button>
                </div>
              </form>
            </div>
            <div className="w-100"></div>
            <div className="col text-center part-3">
              <label className="text-label">All Rights Reserved 2022</label>
            </div>
            <div className="col text-center part-4">
              <label className="text-label">
                Forgot Password?
                <a href="/auth1/forget"> Click Here</a>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
