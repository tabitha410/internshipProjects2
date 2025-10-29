"use client";
import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";

export default function VoterDashboard() {
    const [username, setusername] = useState('');
    const [elections, setElections] = useState([]);
    const [ongoingElections, setOngoingElections] = useState([]);
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [candidates, setCandidates] = useState('');
    const [IsVoteSubmitted, setIsVoteSubmitted] = useState(false);
    const [selectedCandidates, setSelectedCandidates] = useState({});

    //Store the username in local storage after login
    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setusername(storedUsername);
        }
    }, []);

    //Fetch elections the voter is eligible for
    const fetchVoterElections = async (username) => {
        try{
            const response = await fetch (`http://localhost:8000/voter_election/${username}`);
            const result = await response.json();
            if (response.ok){
                setElections(result.elections);
                setOngoingElections(result.ongoing || []);
                setMessage(result.message);

                // If there are ongoing elections, fetch candidates for the first one
                if (result.ongoing && result.ongoing.length > 0) {
                    fetchCandidates(result.ongoing[0].id);
                }
            } else {
                setErrorMessage(result.detail || "An error occurred while fetching elections");
            }
        } catch (error){
            setErrorMessage("Failed to fetch elections. Please try again later.");
        }
    };

    useEffect(() => {
        if (username) {
            fetchVoterElections(username);       // Pass the username to the function
        }
    }, [username]);

    //Fetch candidates for a particular election
    const fetchCandidates = async (electionId) => {
        try{
            const response = await fetch(`http://localhost:8000/candidate/${electionId}`);
            const result = await response.json();

            if (response.ok) {
                setCandidates(result.candidates);
            } else{
                setErrorMessage("An error occurred while fetching candidates.")
            }
        } catch (error){
            setErrorMessage("Failed to fetch candidates. Please try again later.");
        }
    };

    const handleCandidateSelection = (position, candidateId) => {
        setSelectedCandidates((prevSelected) => ({
            ...prevSelected,
            [position]: candidateId,
        }));
    };

    const fetchUserId = async (username) => {
        const response = await fetch(`http://localhost:8000/get_user_id?username=${username}`); 
        if (response.ok) {
            const data = await response.json();
            return data.user_id; 
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch user ID');
        }
    };

    const fetchPositionId = async (position) => {
        const response = await fetch(`http://localhost:8000/get_position_id?position=${encodeURIComponent(position)}`);
        if (response.ok) {
            const data = await response.json();
            return data.position_id; 
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch position ID');
        }
    };    
    
    const handleSubmitVote = async () => {
        const username = localStorage.getItem('username');
        if (!username) {
            setErrorMessage('No username found. Please log in.');
            return;
        }
    
        let userId;
        try {
            userId = await fetchUserId(username); // Fetch the user ID based on the username
        } catch (error) {
            setErrorMessage('Failed to fetch user ID. Please try again.');
            return;
        }
    
        // Prepare the votes array
        const votes = await Promise.all(Object.entries(selectedCandidates).map(async ([position, candidateId]) => {
            let positionId;
            try {
                positionId = await fetchPositionId(position); // Fetch the position ID
            } catch {
                setErrorMessage('Invalid position selected. Please try again.');
                return null; // Skip this vote
            }
    
            return {
                election_id: ongoingElections[0].id,
                position_id: positionId,
                candidate_id: candidateId,
                users_id: userId,
            };
        })).then(votes => votes.filter(vote => vote)); // Filter out any null votes

        console.log("Votes:", votes)
    
        // Check for valid votes before proceeding
        if (votes.length === 0) {
            setErrorMessage('No valid votes to submit. Please check your selections.');
            return;
        }
    
        //submit the votes
        try {
            const response = await fetch('http://localhost:8000/submit_vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(votes),
            });
    
            if (response.ok) {
               //  alert('Ballot submitted successfully.');
                setIsVoteSubmitted(true);  // Update state to reflect successful submission
                setErrorMessage(''); 
            } else {
                const result = await response.json();
                setErrorMessage(result.detail || 'Failed to submit vote. Please try again.');
            }
        } catch {
            setErrorMessage('Error submitting votes. Please try again.');
        }
    };            
    
     
    return (
        <>
            {IsVoteSubmitted ? (
                <>
                    <div className="alert alert-success">
                        <strong>Success!</strong> <br /> Ballot submitted.
                    </div>
                    <div className="mt-3 text-center">
                        <p style={{marginLeft:'120px'}}>You have already voted for this election.</p>
                        <button className="btn btn-primary">View Ballot</button>
                    </div>
                </>
            ) : ongoingElections.length === 0 ? (
                <>
                    <h2>Voting Page</h2>
                    {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                    {elections.length === 0 && <div className="alert alert-warning mt-4">You are not eligible to vote in any election yet.</div>}
                    {elections.length > 0 && ongoingElections.length === 0 && <div className="alert alert-info mt-4">No ongoing elections yet.</div>}
                </>
            ) : (
                <>
                    <h1 className="text-center mt-4" style={{ marginTop: '-20px' }}>{ongoingElections[0].title}</h1>
                    
                    <div className="text-start" style={{ marginLeft: '50px' }}>
                        {candidates.positions && Object.keys(candidates.positions).length > 0 && Object.keys(candidates.positions).map((position) => (
                            <div key={position} className="mt-4">
                                {/* Display the position title */}
                                <h4><strong>{position}</strong></h4>
    
                                <p className="text-start"><strong>Select only one candidate</strong></p>
    
                                <ul className="list-group">
                                    {candidates.positions[position].map((candidate) => (
                                        <li key={candidate.id} className="list-group-item d-flex align-items-center">
                                            
                                            {/* Radio button and candidate information */}
                                            <input required type="radio" name={position} className="me-2 custom-radio" 
                                            onChange={() => handleCandidateSelection(position, candidate.id)}/>

                                            <img src={candidate.photo} alt={`${candidate.name}'s photo`} className="me-3" style={{ width: "60px", height: "60px", borderRadius: "50%" }} />
                                            <div className="candidate-info">
                                                <strong>{candidate.name}</strong>
                                                <br />
                                                <small>{candidate.bio}</small>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {/* Display error message if exists */}
                        {errorMessage && <div className="alert alert-danger mt-4">{errorMessage}</div>}

                        <div className="text-center">
                            <button className="btn btn-primary mt-4"  onClick={handleSubmitVote}>Submit</button>
                        </div>

                    </div>
                </>
            )}
        </>
    );
            
}