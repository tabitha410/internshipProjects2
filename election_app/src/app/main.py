from fastapi import FastAPI, Form, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from typing import Optional, List
import mysql.connector
import random
import string
import hashlib
import base64
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

app = FastAPI ()

#CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],      # for react development, supposed to contain website url
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection configuration
db_config = { 
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'election_app',
    'port': 3307
}

# Pydantic model to validate input data
class UserRegistration(BaseModel):
    name: str
    email: str
    username: str
    phone_number: str
    password: str
    retype_password: str
    role: str
    admin_key: str = None   #Optional field for admin

class UserLogin(BaseModel):
    username: str
    password: str

class addElection(BaseModel):
    title: str
    description: str
    start_date: datetime
    end_date: datetime

class addPosition(BaseModel):
    positionName: str
    positionDescription: str
    selectElection: str

class addCandidate(BaseModel):
    candidateName: str
    selectElection: str
    selectPosition: str
    bio: str

class addVoters(BaseModel):
    selectElection: str
    selectVoters:   List[int]     # list type to handle multiple voter IDs

class Vote(BaseModel):
    election_id: int
    position_id: int
    candidate_id: int
    users_id: int

# To generate unique user code
def generate_code():
    while True:
        letters = ''.join(random.choices(string.ascii_uppercase, k=3))
        numbers = ''.join(random.choices(string.digits, k=3))
        code = letters + numbers
    
        #Check if the code already exists in the DB
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users WHERE code = %s", (code,))
        result = cursor.fetchone()

        # If the code does not exist, return it
        if result[0] == 0:
            cursor.close()
            conn.close()
            return code
        
        # Close connection and continue if code exists
        cursor.close()
        conn.close()


# To hash passwords
def hash_password(password: str) -> str:
    try:
        sha256 = hashlib.sha256()
        sha256.update(password.encode('utf-8'))
        return sha256.hexdigest()
    except Exception as ex:
        return password      #Return the original password in case of an error


def update_election_status():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, start_date, end_date FROM elections WHERE status != 'completed'")
        elections = cursor.fetchall()

        nigeria_timezone = timezone(timedelta(hours=1))
        current_date = datetime.now(nigeria_timezone)

        for election in elections:
            start_date = election['start_date']
            end_date = election['end_date']

            # Convert start_date and end_date to Nigeria's timezone if they are native
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc).astimezone(nigeria_timezone)
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc).astimezone(nigeria_timezone)

            # Compare current date with the election's start and end dates
            if current_date < start_date:
                status = 'upcoming'
            elif start_date <= current_date <= end_date:
                status = 'ongoing'
            else:
                status = 'completed'

            # Updates the election status in the DB
            cursor.execute("UPDATE elections SET status =  %s WHERE id= %s", (status, election['id']))
            conn.commit()
    except mysql.connector.Error as err:
        print(f"Error updating election status: {err}")
    finally:
        cursor.close()
        conn.close()

# Scheduler to run the update status task daily
scheduler = BackgroundScheduler()
scheduler.add_job(update_election_status, 'interval', minutes=1)
scheduler.start()

# Shutdown the scheduler when the application exits
@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()


@app.post("/register/")
async def register_user(user: UserRegistration):
    #Check if passwords match
    if user.password != user.retype_password:
        raise HTTPException(status_code=400, detail="Mismatched passwords")
    
    # Admin role validation
    if user.role == "admin":
        if user.admin_key != "admin123":
            raise HTTPException(status_code=400, detail="Incorrect admin key")

    user_code = generate_code()
    hashed_password = hash_password(user.password)
    
    #Insert into the database
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = %s", (user.username,))
        result = cursor.fetchone()
        if result[0] > 0:
            raise HTTPException(status_code=409, detail="Username already exists. please try another username")
            
        else:
            #SQL query
            sql = """
            INSERT INTO users (name, email, username, phone_number, password, role, code)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            values = (user.name, user.email, user.username, user.phone_number, hashed_password, user.role, user_code)

            cursor.execute(sql, values)
            conn.commit()

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()

    return {"message": "Registration successful"}

@app.post("/position/")
async def add_position(position: addPosition):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    try:
        election_id = int(position.selectElection)  
        print(f"Using election id: {election_id}")   # for debugging

        # Check if the position already exists for the election
        cursor.execute("SELECT COUNT(*) FROM position WHERE name = %s AND election_id = %s", (position.positionName, election_id))
        result = cursor.fetchone()
        if result[0] > 0:
            raise HTTPException(status_code=409, detail="This position already exists for this election")
        else:

            # handle scenerio where the user doesn't enter a description
            if position.positionDescription == "":
                position.positionDescription = "N/A"

            sql = """
            INSERT INTO position (name, election_id, description)
            VALUES (%s, %s, %s)
            """
            values = (position.positionName, election_id, position.positionDescription)

            cursor.execute(sql, values)
            conn.commit()

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()

    return {"message": "Position for this election has been added successfully"}

@app.post("/candidate/")
async def add_candidate(candidateName: str = Form(...),
                    selectElection:str = Form(...),
                    selectPosition: str = Form(...),
                    bio: Optional[str] = Form(None),
                    photo: UploadFile = File(...)
                ):
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    try:
        # Read the binary image data from the file upload
        photo_data = await photo.read()
        # Extract MIME type
        photo_type = photo.content_type

        position_id = int(selectPosition)
        print(f"Using position id: {position_id}")   # for debugging

        election_id = int(selectElection)  
        print(f"Using election id: {election_id}")   # for debugging

        # Check if the candidate is already running for the election
        cursor.execute("SELECT COUNT(*) FROM candidates WHERE name = %s AND election_id = %s", (candidateName, election_id))
        result = cursor.fetchone()
        if result[0] > 0:
            raise HTTPException(status_code=409, detail="Candidate is already running for this election.")
        else:

            # If no bio is entered 
            if not bio:
                bio = "N/A"

            sql = """
            INSERT INTO candidates (name, election_id, position_id, bio, photo, photo_type)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            values = (candidateName, election_id, position_id, bio, photo_data, photo_type)

            cursor.execute(sql, values)
            conn.commit()

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()

    return {"message": "Candidate has been added successfully"}


@app.get("/positions/{election_id}")
async def get_positions(election_id: int):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, name, description FROM position WHERE election_id = %s", (election_id,))
        positions = cursor.fetchall()

        if not positions:
            return {"message": "No position has been added for this election yet.", "positions": []}
        
        return {"message": "","positions": positions}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error fetching positions: {err}")
    finally:
        cursor.close()
        conn.close()


# For the view candidates table in the admin side
@app.get("/candidates/{election_id}")
async def get_candidates(election_id: int):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, position_id, name, photo, bio, time_created FROM candidates WHERE election_id = %s", (election_id,))
        candidates = cursor.fetchall()

        if not candidates:
            return {"candidateMessage": "No candidate has applied for this election yet.", "candidates": []}
        
        # Convert binary photo data to Base64
        for candidate in candidates:
            if candidate["photo"]:
                candidate["photo"] = base64.b64encode(candidate["photo"]).decode("utf-8")

            # fetch position name
            cursor.execute("SELECT name FROM position WHERE id = %s", (candidate["position_id"],))
            position = cursor.fetchone()
            candidate["position_name"] = position["name"] if position else "Unknown"

        return {"candidateMessage": "","candidates": candidates}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error fetching candidates: {err}")
    finally:
        cursor.close()
        conn.close()


# Get candidates for a specific election, so the user can vote
@app.get("/candidate/{election_id}")
async def get_candidate(election_id: int):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('''
        SELECT c.id, c.name, c.photo, c.photo_type, c.bio, p.name AS position 
        FROM candidates c
        JOIN position p ON c.position_id = p.id
        WHERE c.election_id = %s
        ''', (election_id,))
        candidates = cursor.fetchall()

        if not candidates:
            raise HTTPException(status_code=404, detail="No candidates found for this election.")

        # Organize candidates by position
        candidates_by_position = {}
        for candidate in candidates:
            position = candidate["position"]

            # Convert the photo(binary data) to base64 string
            photo_base64 = None
            if candidate["photo"]:
                photo_base64 = f"data:{candidate['photo_type']};base64," + base64.b64encode(candidate["photo"]).decode("utf-8")

            if position not in candidates_by_position:
                candidates_by_position[position] = []
            candidates_by_position[position].append({
                "id": candidate["id"],
                "name": candidate["name"],
                "photo": photo_base64,
                "bio": candidate["bio"]
            })

        return {"candidates": {"positions": candidates_by_position}}

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error fetching candidates: {err}")
    finally:
        cursor.close()
        conn.close()

@app.get("/get_user_id")
async def get_user_id(username: str):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()

        if user:
            return {"user_id": user['id']}
        else:
            raise HTTPException(status_code=404, detail="User not found.")
    finally:
        cursor.close()
        conn.close()

@app.get("/get_position_id")
async def get_position_id(position: str):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute('SELECT id FROM position WHERE name = %s', (position,))
        position_record = cursor.fetchone()

        if position_record:
            return {"position_id": position_record['id']}
        else:
            raise HTTPException(status_code=404, detail="Position not found.")
    
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error fetching position ID: {err}")

    finally:
        cursor.close()
        conn.close()

@app.post("/submit_vote")
async def submit_vote(votes: List[Vote]):  # Ensure this is a List[Vote]
    print("Incoming votes:", votes)  # Log incoming votes to see the structure
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    try:
        user_id = votes[0].users_id  # Access as an attribute
        election_id = votes[0].election_id

        print(f"User ID: {user_id}, Election ID: {election_id}")

        # Check if the user has already voted
        cursor.execute('SELECT COUNT(*) AS vote_count FROM votes WHERE users_id = %s AND election_id = %s', (user_id, election_id))
        result = cursor.fetchone()

        if result['vote_count'] > 0:
            raise HTTPException(status_code=400, detail="You have already voted for this election.")

        # Insert votes and update results
        for vote in votes:
            cursor.execute('''
                INSERT INTO votes (users_id, election_id, candidate_id, position_id)
                VALUES (%s, %s, %s, %s)
            ''', (vote.users_id, vote.election_id, vote.candidate_id, vote.position_id))

            # Update the results table
            cursor.execute('''
                INSERT INTO results (election_id, candidate_id, votes_count)
                VALUES (%s, %s, 1)
                ON DUPLICATE KEY UPDATE votes_count = votes_count + 1
            ''', (vote.election_id, vote.candidate_id))

        conn.commit()

        return {"message": "Ballot submitted successfully."}
    
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error submitting vote: {err}")
    
    finally:
        cursor.close()
        conn.close()

# 
@app.get("/get_election_results")
async def get_election_results(election_id: int):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    try:
        # Fetch election results including position_id and position_name from the votes table
        cursor.execute(''' 
            SELECT e.title AS election_title, v.election_id, v.position_id, p.name AS position_name, 
                   v.candidate_id, c.name AS candidate_name, COALESCE(SUM(r.votes_count), 0) AS votes_count
            FROM votes v
            JOIN candidates c ON v.candidate_id = c.id
            JOIN position p ON v.position_id = p.id
            JOIN elections e ON v.election_id = e.id
            LEFT JOIN results r ON r.election_id = v.election_id AND r.candidate_id = v.candidate_id
            WHERE v.election_id = %s
            GROUP BY v.position_id, v.candidate_id
        ''', (election_id,))
        
        results = cursor.fetchall()

        if not results:
            return {"message": "No results for this election yet."}

        election_title = results[0]['election_title']  # Get the election title from any row

        # Organize results by position
        positions = {}
        for result in results:
            position_id = result['position_id']
            if position_id not in positions:
                positions[position_id] = {
                    "position_name": result['position_name'],
                    "candidates": []
                }

            # Only add candidate if not already present
            candidate_data = {
                "candidate_name": result['candidate_name'],
                "votes_count": result['votes_count'], 
            }

            # Add the candidate to the list if it does not already exist
            if not any(candidate['candidate_name'] == candidate_data['candidate_name'] for candidate in positions[position_id]["candidates"]):
                positions[position_id]["candidates"].append(candidate_data)

        return {
            "election_title": election_title,
            "positions": positions  # Return results organized by position
        }

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error fetching election results: {err}")

    finally:
        cursor.close()
        conn.close()


# For the admindashboard, display voters that are eligible to vote
@app.get("/voters/{election_id}")
async def get_voters(election_id: int):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    try:
        # JOIN operation to get voter names from 2 tables
        cursor.execute('''SELECT ev.voter_id, u.name, ev.time_added FROM election_voters ev 
                       JOIN users u ON ev.voter_id = u.id WHERE election_id = %s ''', (election_id,))
        voters = cursor.fetchall()

        if not voters:
            return {"voterMessage": "No voter can vote in this election yet.", "voters": []}
        
        return {"voterMessage": "","voters": voters}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error fetching positions: {err}")
    finally:
        cursor.close()
        conn.close()

# For the voterdashboard, display the election for the user to vote in
@app.get("/voter_election/{username}")
async def get_voter_elections(username: str):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(''' SELECT e.id, e.title, e.status FROM elections e
                       JOIN election_voters ev ON e.id = ev.election_id
                       JOIN users u ON ev.voter_id = u.id WHERE u.username = %s''',(username,))
        elections = cursor.fetchall()

        if not elections:
            return {"message": "You are not eligible to vote in any election yet.", "elections":[]}
        
        ongoing_elections = [e for e in elections if e['status'] == 'ongoing']
        print(f"Ongoing elections for {username}: {ongoing_elections}")   # For debugging

        if len(ongoing_elections) == 0:
            return {"message": "No ongoing elections yet", "elections": elections, "ongoing":[]}

        return {"message": "Fetched elections", "elections": elections, "ongoing": ongoing_elections}

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error fetching elections: {err}")
    finally:
        cursor.close()
        conn.close()

@app.post("/election/")
async def add_election(election: addElection):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()      
    try:
        cursor.execute("SELECT COUNT(*) FROM elections WHERE title = %s", (election.title,))
        result = cursor.fetchone()
        if result[0] > 0:
            raise HTTPException(status_code=409, detail="Election title already exists. Rename the election")
        else:
            start_date = election.start_date
            end_date = election.end_date

            # Ensure dates are timezone-aware. If not, assume WAT(UTC+1)
            nigeria_timezone = timezone(timedelta(hours=1))
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=nigeria_timezone)
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=nigeria_timezone)

            # Use Nigeria's timezone for the current date
            current_date = datetime.now(nigeria_timezone)

            # Determine the status based on the current date
            if current_date < start_date:
                status = 'upcoming'
            elif start_date <= current_date <= end_date:
                status = 'ongoing'
            else:
                status = 'completed'


            # handle scenerio where the user doesn't enter a description
            if election.description == "":
                election.description = "N/A"

            sql = """
            INSERT INTO elections (title, description, start_date, end_date, status)
            VALUES (%s, %s, %s, %s, %s)
            """
            values = (election.title, election.description, election.start_date, election.end_date, status)

            cursor.execute(sql, values)
            conn.commit()

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()
        
    return {"message": "Election has been added successfully"}


@app.post("/election/voters")
async def add_voters(voter_data: addVoters):
    election_id = int(voter_data.selectElection)
    voter_ids = voter_data.selectVoters

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    try:
        # Ensure the election exists
        cursor.execute("SELECT id FROM elections WHERE id=%s", (election_id,))
        election = cursor.fetchone()
        if not election:
            raise HTTPException(status_code=404, detail="Election not found.")

        # Insert voters into the election_voters table
        for voter_id in voter_ids:
            # Check for duplicates before inserting
            cursor.execute("SELECT COUNT(*) FROM election_voters WHERE election_id = %s AND voter_id = %s", (election_id, voter_id))
            result = cursor.fetchone()

            if result[0] == 0:
                cursor.execute("INSERT INTO election_voters (election_id, voter_id) VALUES (%s, %s)", (election_id, voter_id))
            else:
                raise HTTPException(status_code=409, detail="Voter has already been added to this election")

        conn.commit()
        return {"message": "Voters added successfully."}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()


# For the dropdown
@app.get("/voters")
async def get_voters():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, name, email FROM users WHERE role = 'voter'")
        voters = cursor.fetchall()

        if not voters:
            return {"Message": "No voters found.", "voters":[]}

        return {"message": "", "voters": voters}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error fetching voters: {err}")
    finally:
        cursor.close()
        conn.close()


@app.post("/login/")
async def login(user: UserLogin):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT password, role FROM users WHERE username = %s", (user.username,))
        result = cursor.fetchone()

        if result is None:
            raise HTTPException(status_code=404, detail="Username not found. Please sign up to use Votify")
    
        stored_password, user_role = result
        hashed_password = hash_password(user.password)

        if hashed_password == stored_password:
            return {"message": "Login successful", "role": user_role}
        else:
            raise HTTPException(status_code=401, detail="Invalid Password")
    
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    
    finally:
        cursor.close()
        conn.close()

@app.get("/elections/")
async def get_elections():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM elections")
        elections = cursor.fetchall()

        if not elections:
            return {"message": "No Election has been added yet.", "elections": []}
        
        return {"message": "", "elections": elections}
    
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    
    finally:
        cursor.close() 
        conn.close()

@app.get("/upcomingElections/")
async def get_upcoming():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM elections WHERE status = 'upcoming'")
        upcoming_elections = cursor.fetchall()

        return {"message": "", "upcoming_elections": upcoming_elections}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/election/{election_id}")
async def delete_election(election_id: int):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM elections WHERE id = %s", (election_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Election not found")
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()
    return {"message": "Election deleted successfully"}


@app.delete("/position/{position_id}")
async def delete_position(position_id: int):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM position WHERE id = %s", (position_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Position not found")
        return {"message": "Position deleted successfully"}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error deleting position: {err}")
    finally:
        cursor.close()
        conn.close()


@app.delete("/candidate/{candidate_id}")
async def delete_candidate(candidate_id: int):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM candidates WHERE id = %s", (candidate_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return {"message": "Candidate deleted successfully"}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error deleting candidate: {err}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/voter/{voter_id}")
async def delete_candidate(voter_id: int):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    try:
        print(f"Using voter id: {voter_id}")    # for debugging

        cursor.execute("DELETE FROM election_voters WHERE voter_id = %s", (voter_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Voter not found")
        return {"message": "Delete successful"}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error deleting: {err}")
    finally:
        cursor.close()
        conn.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Votify API"}



