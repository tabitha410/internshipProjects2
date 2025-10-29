"use client"; // This marks the file as a Client Component

import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phoneNumber: '',
    password: '',
    retypePassword: '',
    role: 'voter',
    adminKey: ''
  });

  const [showAdminCode, setShowAdminCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRoleChange = (event) => {
    setFormData({ ...formData, role: event.target.value})   // Update role
    setShowAdminCode(event.target.value === 'admin');      // Toggle admin key field
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataLoad = {
      name: formData.name,
      email: formData.email,
      username: formData.username,
      phone_number: formData.phoneNumber,
      password: formData.password,
      retype_password: formData.retypePassword,
      role: formData.role,
      admin_key: formData.role === 'admin' ? formData.adminKey : undefined  // Include adminKey only if role is admin
    };

    try{
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataLoad),
      });

      const result = await response.json();

      if (response.ok) {
        //setSuccessMessage(result.message);
        alert(result.message);
        setErrorMessage('');

        // Redirect to the main page
        router.push('/');
      } else{
        // Handle case where result.detail is an array of error messages
        if (Array.isArray(result.detail)){
          setErrorMessage(result.detail.map((err) => err.msg).join(', '));
        } else if (typeof result.detail === 'string'){
          setErrorMessage(result.detail);
        } else{
          setErrorMessage('An unexpected error occurred. Please try again later')
        }
        setSuccessMessage('');
      }
    } catch (error) {
      setErrorMessage('An error occurred while registering. Try again later');
    }
  };

  return (
    <section className="vh-100 gradient-custom">
      <div className="container py-5 h-100">
        <div className="row justify-content-center align-items-center h-100">
          <div className="col-12 col-lg-9 col-xl-12"> {/* Reduced width */}
            <div className="card shadow-2-strong card-registration" style={{ borderRadius: '15px' }}>
              <div className="card-body p-4 p-md-5">
                <h3 className="mb-4 pb-2 pb-md-0 mb-md-5 text-center">Create A Votify Account!</h3>
                {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <div className="form-outline">
                        <label className="form-label" htmlFor="name">Name</label>
                        <input required type="text" id="name" className="form-control form-control-sm" value={formData.name} onChange={handleInputChange}/>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="form-outline">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input required type="email" id="email" className="form-control form-control-sm" value={formData.email} onChange={handleInputChange}/>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <div className="form-outline">
                        <label className="form-label" htmlFor="username">Username</label>
                        <input required type="text" id="username" className="form-control form-control-sm" value={formData.username} onChange={handleInputChange}/>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="form-outline">
                        <label className="form-label" htmlFor="phoneNumber">Phone Number</label>
                        <input required type="tel" id="phoneNumber" className="form-control form-control-sm" value={formData.phoneNumber} onChange={handleInputChange}/>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <div className="form-outline">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input required type="password" id="password" className="form-control form-control-sm" value={formData.password} onChange={handleInputChange}/>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="form-outline">
                        <label className="form-label" htmlFor="retypePassword">Retype Password</label>
                        <input required type="password" id="retypePassword" className="form-control form-control-sm" value={formData.retypePassword} onChange={handleInputChange}/>
                      </div>
                    </div>
                  </div>

                  <div className="row align-items-center"> 
                    <div className="col-md-6 mb-4">
                      <h6 className="mb-2 pb-1 form-label">Role:</h6>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input custom-radio"
                          type="radio"
                          name="roleOptions"
                          id="voterRole"
                          value="voter"
                          checked={!showAdminCode}
                          onChange={handleRoleChange}
                        />
                        <label className="form-check-label" htmlFor="voterRole">Voter</label>
                      </div>

                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input custom-radio"
                          type="radio"
                          name="roleOptions"
                          id="adminRole"
                          value="admin"
                          checked={showAdminCode}
                          onChange={handleRoleChange}
                        />
                        <label className="form-check-label" htmlFor="adminRole">Admin</label>
                      </div>
                    </div>

                    {showAdminCode && (
                      <div className="col-md-6 mb-4" id="adminCodeWrapper"> {/* Placed beside the role */}
                        <div className="form-outline">
                          <label className="form-label" htmlFor="adminKey">Admin Key</label>
                          <input required type="text" id="adminKey" className="form-control form-control-sm" value={formData.adminKey} onChange={handleInputChange} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-0 pt-0 text-center"> {/* Centers the button */}
                    <input className="btn btn-primary btn-sm" type="submit" value="Register" /> 
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
