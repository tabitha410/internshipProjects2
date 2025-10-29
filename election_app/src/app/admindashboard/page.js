"use client";
import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

// Register the necessary components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default function AdminDashboard() {
    const [username, setusername] = useState('');
    const [elections, setElections] = useState([])
    const [message, setMessage] = useState('');
    const [candidateMessage, setCandidateMessage] = useState('');
    const [view, setView] = useState('home');    //state to track which link is clicked
    const [formData, setFormData] = useState({
        title:'',
        description:'',
        start_date:'',
        end_date:''
    });
    const [positionForm, setPositionData] = useState({
        positionName: "",
        positionDescription: "",
        selectElection: ""
    });
    const [candidateForm, setCandidateData] = useState({
        selectElection: "",
        selectPosition: "",
        candidateName: "",
        bio: ""
    });
    const [voterForm, setVoterData] = useState({
        selectElection: "",
        selectVoters: []
    });
    const [resultForm, setResultForm] = useState({
        selectElection: ''
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [upcomingElections, setUpcomingElections] = useState([]);  // state for upcoming elections
    const [positions, setPositions] = useState([]);   // Holds the positions retrieved from the backend
    const [candidates, setCandidates] = useState([]);  // Holds the candidates retrieved from the backend
    const [positionDropdown, setPositionDropdown] = useState([]);
    const [voterDropdown, setVoterDropdown] = useState([]);
    const [voters, setVoters] = useState([]); 
    const [voterMessage, setVoterMessage] = useState('');
    const [resultsData, setResultsData] = useState([])

    //Store the username in local storage after login
    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setusername(storedUsername);
        }
    }, []);

    // Fetch elections data
    async function fetchElections() {
        try{
            const response = await fetch('http://localhost:8000/elections/');
            const result = await response.json();

            if (response.ok){
                setElections(result.elections);
                setMessage(result.message);
            }else{
                setMessage(result.message || 'Failed to retrieve elections');
            }
        } catch(error){
            setMessage('An error occurred while fetching elections');
        }
    };

    useEffect(() => {   
        fetchElections();
    }, []);

    // Fetch upcoming elections
    const fetchUpcomingElections = async () => {
        try {
            const response = await fetch('http://localhost:8000/upcomingElections');
            const data = await response.json();
            if (response.ok) {
                setUpcomingElections(data.upcoming_elections);
            } else {
                setErrorMessage('Failed to load upcoming elections');
            }
        } catch (error) {
            setErrorMessage('Error fetching upcoming elections');
        }
    };
    
    useEffect(() => {
        fetchUpcomingElections();
    }, []);

    const fetchPositions = async (electionId) => {
        try{
            const response = await fetch(`http://localhost:8000/positions/${electionId}`);
            const data = await response.json();

            if(response.ok){
                setPositionDropdown(data.positions);    //Populate the positions dropdown
            } else{
                setPositionDropdown([]);
            }  
        } catch (error){
            console.error("Error fetching positions:", error);
            setPositionDropdown([]);
        }
    };

    const fetchVoters = async () => {
        try {
            const response = await fetch('http://localhost:8000/voters');
            const data = await response.json();

            if (response.ok){
                setVoterDropdown(data.voters);
            } else{
                console.error('Error fetching voters:', data.message);
            }
        } catch (error){
            console.error('Error fetching voters:', error);
        }
    };

    useEffect(() => {
        fetchVoters();
    }, []);

    const handleViewChange = (newView) => {
        setView(newView);      
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value }); 
    };
    const positionformChange = (e) => {
        setPositionData({ ...positionForm, [e.target.id]: e.target.value });
    };
    const addVotersChange = (e) => {
        setVoterData({...voterForm, [e.target.id]: e.target.value});
    };
    const dropdownChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setVoterData({ ...voterForm, selectVoters: selectedOptions });
    };
    const candidateformChange = (e) => {
        setCandidateData({ ...candidateForm, [e.target.id]: e.target.value });

        // Fetch positions when the user selects an election
        if (e.target.id === "selectElection") {
            fetchPositions(e.target.value);
        }
    };
    const resultChange = (e) => {
        setResultForm({
            ...resultForm,
            selectElection: e.target.value
        });
    };

    const handleDelete = async (id) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this election?");
        if (!isConfirmed) {
            return;
        }

        try{
            const response = await fetch(`http://localhost:8000/election/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const result = await response.json();

            if (response.ok) {
                setSuccessMessage(result.message);
                setErrorMessage('')
                fetchElections();   //Refresh elections after deletion
            } else{
                setErrorMessage('Failed to delete the election');
            }
        } catch(error) {
            setErrorMessage('An error occurred while deleting the elction')
        }
    };

    const handleDeleteUpcoming = async (id) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this election?");
        if (!isConfirmed) {
            return;
        }

        try{
            const response = await fetch(`http://localhost:8000/election/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const result = await response.json();

            if (response.ok) {
                setSuccessMessage(result.message);
                setErrorMessage('')
                fetchUpcomingElections();   //Refresh elections after deletion
            } else{
                setErrorMessage('Failed to delete the election');
            }
        } catch(error) {
            setErrorMessage('An error occurred while deleting the elction')
        }
    };

    const deletePosition = async (positionId) =>{
        if (window.confirm("Are you sure you want to delete this position?")){
            try{
                const response = await fetch(`http://localhost:8000/position/${positionId}`,{
                    method: 'DELETE'
                });

                const result = await response.json();

                if (response.ok){
                    // If successful, update the list of positions
                    setPositions(positions.filter((position) => position.id !== positionId));
                    setSuccessMessage("Position deleted successfully.");
                    setErrorMessage("");
                } else{
                    setErrorMessage(result.detail || "Failed to delete position.");
                }
            } catch (error){
                setErrorMessage("An error occurred while deleting the position.");
            }
        }
    };

    const deleteCandidate = async (candidateId) =>{
        if (window.confirm("Are you sure you want to delete this candidate?")){
            try{
                const response = await fetch(`http://localhost:8000/candidate/${candidateId}`,{
                    method: 'DELETE'
                });

                const result = await response.json();

                if (response.ok){
                    // If successful, update the list of candidates
                    setCandidates(candidates.filter((candidate) => candidate.id !== candidateId));
                    setSuccessMessage("Candidate deleted successfully.");
                    setErrorMessage("");
                } else{
                    setErrorMessage(result.detail || "Failed to delete candidate.");
                }
            } catch (error){
                setErrorMessage("An error occurred while deleting the candidate.");
            }
        }
    };

    const deleteVoter = async (voterId) =>{
        if (window.confirm("Are you sure you want to delete this ?")){
            try{
                const response = await fetch(`http://localhost:8000/voter/${voterId}`,{
                    method: 'DELETE'
                });

                const result = await response.json();

                if (response.ok){
                    // If successful, update the list of voters
                    setVoters(voters.filter((voter) => voter.voter_id !== voterId));
                    setSuccessMessage("Delete successful");
                    setErrorMessage("");
                } else{
                    setErrorMessage(result.detail || "Failed to delete");
                }
            } catch (error){
                setErrorMessage("An error occurred while deleting.");
            }
        }
    };

    const handleSearch = async(electionId) => {
        try{
            const response = await fetch(`http://localhost:8000/positions/${electionId}`);
            const result = await response.json();
            if (response.ok) {
                setPositions(result.positions);  //Store the positions data
                setErrorMessage("")
                setMessage(result.message)
            }else {
                setErrorMessage(result.detail || "An error occurred while fetching positions.");
            }
        } catch (error) {
            setErrorMessage("Failed to fetch positions. Please try again later.");
        }
    };

    const searchCandidates = async (electionId) => {
        try{
            const response = await fetch(`http://localhost:8000/candidates/${electionId}`);
            const result = await response.json();
            if (response.ok) {
                setCandidates(result.candidates);  //Store the candidates data
                setErrorMessage("");
                setCandidateMessage(result.candidateMessage)
            } else {
                setErrorMessage(result.detail || "An error occurred while fetching positions.");
            }
        } catch (error){
            setErrorMessage("Failed to fetch candidates. Please try again later.")
        }
    };

    const searchVoters = async (electionId) => {
        try{
            const response = await fetch(`http://localhost:8000/voters/${electionId}`);
            const result = await response.json();
            if (response.ok) {
                setVoters(result.voters);  
                setErrorMessage("");
                setVoterMessage(result.voterMessage)
            } else {
                setErrorMessage(result.detail || "An error occurred while fetching voters.");
            }
        } catch (error){
            setErrorMessage("Failed to fetch voters. Please try again later.")
        }
    };

    const searchResults = async (electionId) => {
        if (!electionId) {
            setErrorMessage('Please select an election.');
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:8000/get_election_results?election_id=${electionId}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Response data:', data);
                setSuccessMessage(`Results for election: ${data.election_title}`);
                
                // Map the results data to match recharts format
                // Use positions instead of results (because the backend is returning the results by position)

                // const formattedData = Object.entries(data.positions).flatMap(([positionId, positionData]) => 
                //     positionData.candidates.map(candidate => ({
                //         positionId,
                //         position_name: positionData.position_name,
                //         name: candidate.candidate_name,
                //         votes: candidate.votes_count
                //     }))
                // );

                setResultsData(data);

            } else {
                setErrorMessage('Failed to fetch election results.');
            }
        } catch (error) {
            console.error('Error fetching election results:', error);
            setErrorMessage('An error occurred while fetching results.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const dataLoad = {
          title: formData.title,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date
        };
    
        try{
          const response = await fetch('http://localhost:8000/election', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataLoad),
          });
    
          const result = await response.json();
    
          if (response.ok) {
            setSuccessMessage(result.message);
            setErrorMessage('');
            fetchUpcomingElections();    //Refresh
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
          setErrorMessage('An error occurred while adding. Try again later');
        }
    };

    const submitForm = async (e) => {
        e.preventDefault();
    
        const payLoad = {
          positionName: positionForm.positionName,
          positionDescription: positionForm.positionDescription,
          selectElection: positionForm.selectElection
        };
    
        try{
          const response = await fetch('http://localhost:8000/position', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payLoad),
          });
    
          const result = await response.json();
    
          if (response.ok) {
            setSuccessMessage(result.message);
            setErrorMessage('');
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
          setErrorMessage('An error occurred while adding. Try again later');
        }
    };

    const submitCandidates = async (e) => {
        e.preventDefault();
    
        const formData = new FormData();     // FormData object
        formData.append('candidateName', candidateForm.candidateName);
        formData.append('selectPosition', candidateForm.selectPosition);
        formData.append('selectElection', candidateForm.selectElection);
        formData.append('bio', candidateForm.bio);

        // Handle the file input 
        const photoFile = document.getElementById('photo').files[0];
        formData.append('photo', photoFile)

        try{
          const response = await fetch('http://localhost:8000/candidate', {
            method: 'POST',
            body: formData     // Send formData directly instead of json format
          });
    
          const result = await response.json();
    
          if (response.ok) {
            setSuccessMessage(result.message);
            setErrorMessage('');
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
          setErrorMessage('An error occurred while adding. Try again later');
        }
    };

    const submitVotersToElection = async (e) => {
        e.preventDefault();
    
        const payLoad = {
          selectElection: voterForm.selectElection,
          selectVoters: voterForm.selectVoters
        };
    
        try{
          const response = await fetch('http://localhost:8000/election/voters', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payLoad),
          });
    
          const result = await response.json();
    
          if (response.ok) {
            setSuccessMessage(result.message);
            setErrorMessage('');
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
          setErrorMessage('An error occurred while adding. Try again later');
        }
    };
    

    //Hide error and success messages after 4 seconds
    useEffect(() => {
        if (errorMessage || successMessage){
            const timer = setTimeout(() => {
                setErrorMessage('');
                setSuccessMessage('');
            }, 2000);
            return () => clearTimeout(timer); 
        }  
    }, [errorMessage, successMessage]);


    const computeWinner = (candidates) => {
        // Find the candidate with the highest votes
        return candidates.reduce((prev, curr) => (prev.votes_count > curr.votes_count ? prev : curr));
    };
    

    return (
        <>
            <header className="header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/vote.png" alt="Logo" width="40" height="40" />
                    <h3 style={{ marginLeft: '15px' }}>Votify - Admin Dashboard</h3>
                </div>
                <span style={{ fontSize: '20px', fontWeight: 'medium' }}>Welcome, {username || "Guest"}!</span>
            </header>

            <nav className="navbar navbar-expand-lg navbar-custom">
                <div className="container-fluid">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <a className="nav-link" href="#" onClick={() => handleViewChange('home')}>Home</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#" onClick={() => handleViewChange('addElection')}>Add elections</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#" onClick={() => handleViewChange('addPosition')}>Add positions</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link dropbtn" href="#" onClick={() => handleViewChange('addCandidates')}>Add candidates</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#" onClick={() => handleViewChange('addVoters')}>Add Voters</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#" onClick={() => handleViewChange('results')}>Results</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="/">Logout</a>
                        </li>
                    </ul>
                </div>
            </nav>

            <main className="container mt-4">
                {view === 'home' && (
                    <>
                        <h4 style={{ marginLeft: '-30px' }}>All Elections</h4>
                        {message && <p>{message}</p>}

                        {elections.length > 0 && (
                            <table className="table table-striped" style={{ marginLeft: '-30px' }}>
                                <thead>
                                    <tr>
                                        <th>S/N</th>
                                        <th>Election Title</th>
                                        <th>Description</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Status</th>
                                        <th>Time Added</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {elections.map((election, index) => (
                                        <tr key={election.id}>
                                            <td>{index + 1}</td>
                                            <td>{election.title}</td>
                                            <td>{election.description}</td>
                                            <td>{election.start_date}</td>
                                            <td>{election.end_date}</td>
                                            <td>{election.status}</td>
                                            <td>{election.time_created}</td>
                                            <td>
                                                <button className="btn btn-primary btn-sm" style={{ marginBottom: '5px', display: 'inline-block' }}>Edit</button>
                                                <button className="btn btn-danger btn-sm" style={{ display: 'inline-block' }} onClick={() => handleDelete(election.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}

                {view === 'addElection' && (
                    <div className="row" >
                        <div className="col-md-5" style={{ marginLeft: '-100px' }}>
                            <h4>Add New Election</h4>
                            {errorMessage && <div id="error-message" className="alert alert-danger">{errorMessage}</div>}
                            {successMessage && <div id="success-message" className="alert alert-success">{successMessage}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="title" className="form-label">Election Title</label>
                                    <input required type="text" className="form-control" id="title" value={formData.title} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="description" className="form-label">Description</label>
                                    <textarea className="form-control" id="description" rows="3" value={formData.description} onChange={handleInputChange}></textarea>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="start_date" className="form-label">Start Date</label>
                                    <input required type="datetime-local" className="form-control" id="start_date" value={formData.start_date} onChange={handleInputChange}/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="end_date" className="form-label">End Date</label>
                                    <input required type="datetime-local" className="form-control" id="end_date" value={formData.end_date} onChange={handleInputChange}/>
                                </div>
                                <button type="submit" className="btn btn-primary mt-2">Add Election</button>
                            </form>
                        </div>

                        <div className="col-md-9" style={{ marginRight: '-200px' }}>
                            <h4>Upcoming Elections</h4>
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>S/N</th>
                                        <th>Election Title</th>
                                        <th>Description</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {upcomingElections.map((election, index) => (
                                        <tr key={election.id}>
                                            <td>{index + 1}</td>
                                            <td>{election.title}</td>
                                            <td>{election.description}</td>
                                            <td>{election.start_date}</td>
                                            <td>{election.end_date}</td>
                                            <td>{election.status}</td>
                                            <td>
                                                <button className="btn btn-primary btn-sm" style={{ marginBottom: '5px', display: 'inline-block' }}>Edit</button>
                                                <button className="btn btn-danger btn-sm" style={{ display: 'inline-block' }} onClick={() => handleDeleteUpcoming(election.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {view === 'addPosition' && (
                    <div className="row">
                        <div className="col-md-6" style={{ marginLeft: '-100px' }}>
                            <h4>Add Positions for Elections</h4>
                            {errorMessage && <div id="error-message" className="alert alert-danger">{errorMessage}</div>}
                            {successMessage && <div id="success-message" className="alert alert-success">{successMessage}</div>}
                            <form onSubmit={submitForm}>
                                <div className="form-group">
                                    <label htmlFor="selectElection" className="form-label">Select Election</label>
                                    <select required className="form-control" id="selectElection" value={positionForm.selectElection} onChange={positionformChange}>
                                        <option value="">Select an Election</option>
                                        {upcomingElections.map((election) => (
                                            <option key={election.id} value={election.id}>{election.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="positionName" className="form-label">Position Name</label>
                                    <input required type="text" className="form-control" id="positionName" value={positionForm.positionName} onChange={positionformChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="positionDescription" className="form-label">Description</label>
                                    <textarea className="form-control" id="positionDescription" value={positionForm.positionDescription} onChange={positionformChange}></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary mt-2">Add Position</button>
                            </form>
                        </div>

                        <div className="col-md-6" style={{ marginLeft: '100px' }}>
                            <h4>View the Positions for a Particular Election</h4>
                            <div className="row" style={{ display: 'flex', alignItems: 'center', marginTop: '35px' }}>
                                <div className="col-md-9">
                                    <select required className="form-control" id="selectElection" value={positionForm.selectElection} onChange={positionformChange}>
                                        <option value="">Select an Election</option>
                                        {upcomingElections.map((election) => (
                                            <option key={election.id} value={election.id}>{election.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <button className="btn btn-primary btn-sm" style={{ padding: '7px' }} onClick={() => handleSearch(positionForm.selectElection)}>Search</button>
                                </div>
                            </div>

                            {positions.length === 0 && (
                                <div style={{marginTop: '35px'}} >
                                    {message && <p>{message}</p>}
                                </div>    
                            )}

                            {positions.length > 0 && (
                                <table className="table table-striped mt-4">
                                    <thead>
                                        <tr>
                                            <th>S/N</th>
                                            <th>Position Name</th>
                                            <th>Description</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positions.map((position, index) =>(
                                            <tr key={position.id}>
                                                <td>{index + 1}</td>
                                                <td>{position.name}</td>
                                                <td>{position.description}</td>
                                                <td>
                                                    <button className="btn btn-primary btn-sm" style={{ marginRight:'5px' }}>Edit</button>
                                                    <button className="btn btn-danger btn-sm" style={{ display: 'inline-block' }} onClick={() => deletePosition(position.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                    </div>
                )}

                {view === 'addCandidates' && (
                    <div className="row">
                        <div className="col-md-5" style={{ marginLeft: '-100px' }}>
                            <h4>Add Candidates to an Election</h4>
                            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                            {successMessage && <div className="alert alert-success">{successMessage}</div>}
                            <form onSubmit={submitCandidates}>
                                <div className="form-group">
                                    <label htmlFor="selectElection" className="form-label">Select Election</label>
                                    <select required className="form-control" id="selectElection" value={candidateForm.selectElection} onChange={candidateformChange}>
                                        <option value="">Select an Election</option>
                                        {upcomingElections.map((election) => (
                                            <option key={election.id} value={election.id}>{election.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="selectPosition" className="form-label">Select Position</label>
                                    <select required className="form-control" id="selectPosition" value={candidateForm.selectPosition} onChange={candidateformChange}>
                                        <option value="">Select Position</option>
                                        {positionDropdown.map((position) => (
                                            <option key={position.id} value={position.id}>{position.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="candidateName" className="form-label">Candidate Name</label>
                                    <input required type="text" className="form-control" id="candidateName" value={candidateForm.positionName} onChange={candidateformChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="photo" className="form-label">Photo</label>
                                    <input required type="file" className="form-control" id="photo" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="bio" className="form-label">Bio</label>
                                    <textarea className="form-control" id="bio" value={candidateForm.bio} onChange={candidateformChange}></textarea> 
                                </div>
                                <button type="submit" className="btn btn-primary mt-1">Add Candidate</button>
                            </form>
                        </div>
                        
                        <div className="col-md-7" style={{ marginLeft: '100px' }}>
                            <h4>View the Candidates for a Particular Election</h4>
                            <div className="row" style={{display: 'flex', alignItems: 'center', marginTop:'30px' }}>
                                <div className="col-md-9" style={{  }}>
                                    <select required className="form-control" id="selectElection" value={positionForm.selectElection} onChange={positionformChange}>
                                        <option value="">Select an Election</option>
                                        {upcomingElections.map((election) => (
                                            <option key={election.id} value={election.id}>{election.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <button className="btn btn-primary btn-sm" style={{ padding: '7px' }} onClick={() => searchCandidates(positionForm.selectElection)}>Search</button>
                                </div>
                            </div>

                            {candidates.length === 0 && (
                                <div style={{ marginTop:'25px' }}>
                                    {candidateMessage && <p>{candidateMessage}</p>}
                                </div>
                            )}

                            {candidates.length > 0 && (
                                <table className="table table-striped mt-4">
                                    <thead>
                                        <tr>
                                            <th>S/N</th>
                                            <th>Name</th>
                                            <th>Position</th>
                                            <th>Photo</th>
                                            <th>Bio</th>
                                            <th>Time Added</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {candidates.map((candidate, index) =>(
                                            <tr key={candidate.id}>
                                                <td>{index + 1}</td>
                                                <td>{candidate.name}</td>
                                                <td>{candidate.position_name}</td>
                                                <td>
                                                    {candidate.photo && (
                                                        <img src={`data:${candidate.photo_type};base64,${candidate.photo}`} alt={candidate.name} style={{ width: '50px', height:'50px' }} />
                                                    )}
                                                </td>
                                                <td>{candidate.bio}</td>
                                                <td>{candidate.time_created}</td>
                                                <td>
                                                    <button className="btn btn-primary btn-sm" style={{ marginBottom: '5px', display: 'inline-block' }}>Edit</button>
                                                    <button className="btn btn-danger btn-sm" style={{ display: 'inline-block' }} onClick={() => deleteCandidate(candidate.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                        </div>
                    </div>
                )}

                {view === 'addVoters' && (
                    <div className="row">
                        <div className="col-md-5" style={{ marginLeft: '-100px'}}>
                            <h4 >Add Voters to an Election</h4>
                            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                            {successMessage && <div className="alert alert-success">{successMessage}</div>}
                            <form onSubmit={submitVotersToElection}>
                                <div className="form-group">
                                    <label htmlFor="selectElection" className="form-label">Select Election</label>
                                    <select className="form-control" id="selectElection" value={voterForm.selectElection} onChange={addVotersChange} required>
                                        <option value="">Select an Election</option>
                                        {upcomingElections.map(election=>(
                                            <option key={election.id} value={election.id}>{election.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="selectVoters" className="form-label">Select Voters</label>
                                    <select className="form-control" id="selectVoters" multiple value={voterForm.selectVoters} onChange={dropdownChange} required>
                                        {voterDropdown.map(voter=>(
                                            <option key={voter.id} value={voter.id}>{voter.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary mt-3">Add Voters</button>
                            </form>
                        </div>

                        <div className="col-md-7" style={{ marginLeft: '100px' }}>
                            <h4>View Eligible Voters for an Election</h4>
                            <div className="row" style={{display: 'flex', alignItems: 'center', marginTop:'30px' }}>
                                <div className="col-md-9" style={{  }}>
                                    <select required className="form-control" id="selectElection" value={voterForm.selectElection} onChange={addVotersChange}>
                                        <option value="">Select an Election</option>
                                        {upcomingElections.map((election) => (
                                            <option key={election.id} value={election.id}>{election.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <button className="btn btn-primary btn-sm" style={{ padding: '7px' }} onClick={() => searchVoters(voterForm.selectElection)}>Search</button>
                                </div>
                            </div>
                        
                            {voters.length === 0 && (
                                <div style={{ marginTop:'25px' }}>
                                    {voterMessage && <p>{voterMessage}</p>}
                                </div>
                            )}

                            {voters.length > 0 && (
                                <table className="table table-striped mt-4">
                                    <thead>
                                        <tr>
                                            <th>S/N</th>
                                            <th>Voter</th>
                                            <th>Time Added</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {voters.map((voter, index) =>(
                                            <tr key={voter.voter_id}>
                                                <td>{index + 1}</td>
                                                <td>{voter.name}</td>
                                                <td>{voter.time_added}</td>
                                                <td>
                                                    <button className="btn btn-primary btn-sm" style={{ marginRight:'5px' }} >Edit</button>
                                                    <button className="btn btn-danger btn-sm"  onClick={() => deleteVoter(voter.voter_id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {view === 'results' && (
                    <div className="row">
                        <div className="col-md-12">
                            <h4>View Election Results</h4>
                            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                            {successMessage && <div className="alert alert-success">{successMessage}</div>}
                            <div className="row" style={{ display: 'flex', alignItems: 'center', marginTop: '30px' }}>
                                <div className="col-md-9">
                                    <select required className="form-control" id="selectElection" value={resultForm.selectElection} onChange={resultChange}>
                                        <option value="">Select an Election</option>

                                        {elections.map((election) => (
                                            <option key={election.id} value={election.id}>
                                                {election.title}
                                            </option>
                                        ))}
                                        {/* {completedElections.map((election) => (
                                            <option key={election.id} value={election.id}>
                                                {election.title} (Completed)
                                            </option>
                                        ))} */}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <button className="btn btn-primary btn-sm" style={{ padding: '7px' }} onClick={() => searchResults(resultForm.selectElection)}>
                                        Search
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Show bar chart if results are available */}
                {!resultsData || !resultsData.positions || Object.keys(resultsData.positions).length === 0 ? (
                    <p> </p>
                ) : (
                    <div style={{ marginTop: '30px' }}>
                        <h4>Election Results Bar Chart</h4>
                        {Object.entries(resultsData.positions).map(([positionId, positionData]) => {
                            const winner = computeWinner(positionData.candidates);
                            
                            const chartData = {
                                labels: positionData.candidates.map(candidate => candidate.candidate_name),
                                datasets: [{
                                    label: 'Votes',
                                    data: positionData.candidates.map(candidate => candidate.votes_count),
                                    backgroundColor: '#00A6A6',
                                    borderColor: '#00A6A6',
                                    borderWidth: 1
                                }]
                            };

                            const chartOptions = {
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        precision: 0 // Ensures whole numbers only
                                    }
                                }
                            };

                            return (
                                <div key={positionId} className="mt-5">
                                    <h3>{positionData.position_name}</h3>
                                    <div style={{ width: '400px', height: '300px' }}>
                                        <Bar data={chartData} options={chartOptions} />
                                    </div>
                                    <p className="mt-3">Winner: <strong>{winner.candidate_name}</strong></p>
                                </div>
                            );
                        })}
                    </div>
                )}

            </main>
        </>   
    );

}