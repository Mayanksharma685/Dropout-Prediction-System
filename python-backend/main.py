from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib

# --- 1. Setup and Model Loading ---
app = FastAPI(title="Dropout-Risk-Detector API")

# Defining the expected input data structure for validation
class StudentData(BaseModel):
    studentID: str
    persona: str  # Must be one of: 'Average', 'Fast learners', 'Good', 'Slow learners'
    Current_CGPA: float
    Total_Backlogs: int
    Semester_Score: float
    Previous_CGPA: float
    Previous_Backlogs: int
    Previous_Score: float

# Load all necessary files
try:
    model = joblib.load('dropout_model_v3.joblib')
    le_persona = joblib.load('label_encoder_v2.joblib')
    training_columns = joblib.load('training_columns_v2.joblib')
    print("Model and helper files loaded successfully.")
except FileNotFoundError as e:
    print(f"Error loading files: {e}")
    model = None # Set model to None if loading fails

# --- 2. Define the API Endpoint ---
@app.post("/predict")
def predict(student_data: StudentData):
    """
    Receives student data, processes it, makes a prediction, and returns the risk.
    """
    if model is None:
        return {"error": "Model is not loaded. Please check server logs."}

    # --- a. Data Preprocessing ---
    # Validate persona value
    valid_personas = ['Average', 'Fast learners', 'Good', 'Slow learners']
    if student_data.persona not in valid_personas:
        return {
            "error": f"Invalid persona '{student_data.persona}'. Must be one of: {valid_personas}"
        }
    
    # Convert incoming data to a DataFrame
    df = pd.DataFrame(student_data.dict(), index=[0])

    # Calculate Trend Features
    df['CGPA_Trend'] = df['Current_CGPA'] - df['Previous_CGPA']
    df['Grade_Trend'] = df['Semester_Score'] - df['Previous_Score']
    df['Backlog_Trend'] = df['Total_Backlogs'] - df['Previous_Backlogs']

    # Encode the 'persona' feature using the loaded encoder
    try:
        df['persona'] = le_persona.transform(df['persona'])
    except ValueError as e:
        return {"error": f"Persona encoding error: {str(e)}"}
    
    # Ensure DataFrame columns match the model's training order
    df_final = df.reindex(columns=training_columns, fill_value=0)

    # --- b. Make Prediction ---
    # Get the probability for class 1 (dropout)
    probability = model.predict_proba(df_final)[0][1]

    # --- c. Assign RGY Flag ---
    RED_THRESHOLD = 0.70
    YELLOW_THRESHOLD = 0.35

    if probability > RED_THRESHOLD:
        flag = 'Red'
    elif probability > YELLOW_THRESHOLD:
        flag = 'Yellow'
    else:
        flag = 'Green'

    # --- d. Return the Final Result ---
    return {
        'studentID': student_data.studentID,
        'dropout_risk_probability': f"{probability:.2f}",
        'risk_flag': flag
    }

# --- 3. Helper Endpoints ---
@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "message": "Dropout Risk Detector API",
        "version": "1.0",
        "endpoints": {
            "/predict": "POST - Make dropout risk prediction",
            "/persona-options": "GET - Get valid persona values",
            "/docs": "GET - API documentation"
        }
    }

@app.get("/persona-options")
def get_persona_options():
    """Get the valid persona options for the model."""
    return {
        "valid_personas": ['Average', 'Fast learners', 'Good', 'Slow learners'],
        "description": "Use one of these persona values when making predictions"
    }

# To run this app, save it as main.py and run: uvicorn main:app --reload