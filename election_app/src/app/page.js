"use client";

import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './globals.css'; 

export default function Home() {

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payLoad = {
      username: formData.username,
      password: formData.password
    };

    try{
      const response = await fetch('http://localhost:8000/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payLoad)
      });

      const result = await response.json();

      if (response.ok){
        //Store the username and role in local storage
        localStorage.setItem('username', formData.username);
        localStorage.setItem('role', result.role);
        setErrorMessage('');

        // alert(result.message);
        

        //Redirect to dashboard
        if (result.role === "admin"){
          router.push('/admindashboard');
        } else if (result.role === "voter"){
          router.push('/voterdashboard')
        }
        

      }else{
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
      setErrorMessage('An error occurred while logging in. Try again later');
    }
  };

  return (
    <div className="container-fluid">
      <div className="row vh-100">
        {/* Left Half */}
        <div className="col-md-6 left-half d-flex flex-column justify-content-center align-items-center">
          <Image 
            src="/vote.png"
            alt="logo"
            width={220} 
            height={150}
            className="img-fluid mb-4"
          />
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          <form className="w-75" onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input required type="text" id="username" className="form-control" placeholder="Enter username" value={formData.username} onChange={handleInputChange} />
            </div>
            <div className="form-group mb-3"> 
              <label htmlFor="password" className="form-label">Password</label>
              <input required type="password" id="password" className="form-control" placeholder="Enter password" value={formData.password} onChange={handleInputChange} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Login</button>
            <div className="d-flex justify-content-between my-3">
              <a href="#">Forgot password?</a>
              <Link href="/register">Don't have an account? Sign Up</Link>
            </div>
          </form>
        </div>
        {/* Right Half */}
        <div className="col-md-6 right-half d-flex flex-column justify-content-center align-items-center text-white">
          <h1>About Votify</h1>
          <p>Votify aims to simplify the voting process by providing a streamlined platform that makes casting your vote quick and easy. Our goal is to ensure that every vote counts and that the voting experience is seamless and accessible for everyone.</p>
        </div>
      </div>
    </div>
  );
}
