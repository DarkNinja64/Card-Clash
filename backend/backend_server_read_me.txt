========================================
  CARD CLASH - BACKEND SETUP
========================================

REQUIREMENTS
------------
- Python 3.11+
- pip

----------------------------------------

STEP 1 - Create a virtual environment
--------------------------------------
python3 -m venv venv

STEP 2 - Activate the virtual environment
------------------------------------------
Linux/Mac:
  source venv/bin/activate

Windows:
  venv\Scripts\activate

You should see (venv) in your terminal prompt.

STEP 3 - Install dependencies
------------------------------
pip install -r requirements.txt

STEP 4 - Create your .env file
--------------------------------
Create a file called .env in the backend/ folder with the following:

  DATABASE_URL=sqlite+aiosqlite:///./cardclash.db
  REDIS_URL=redis://localhost:6379
  JWT_SECRET=your-secret-key-here

Note: .env is gitignored — each person needs their own local copy.

STEP 5 - Run the server
------------------------
uvicorn main:combined_app --reload

IMPORTANT: Use main:combined_app NOT main:app
  - main:app runs FastAPI only (REST routes work, socket.io broken)
  - main:combined_app runs both FastAPI + Socket.io together

The server will start at: http://localhost:8000
API docs available at:    http://localhost:8000/docs

----------------------------------------

STOPPING THE SERVER
-------------------
Press Ctrl+C in the terminal.

DEACTIVATING THE VENV
---------------------
deactivate
