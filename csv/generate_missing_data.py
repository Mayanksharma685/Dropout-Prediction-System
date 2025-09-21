#!/usr/bin/env python3
"""
Script to generate and add missing data fields to CSV files for comprehensive student data.
This script will create realistic random data for all missing fields to match the target JSON format.
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os
import json
from faker import Faker

# Initialize Faker for generating realistic data
fake = Faker('en_IN')  # Using Indian locale for realistic Indian data

def generate_student_basic_info(student_ids):
    """Generate basic student information"""
    students = []
    departments = ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AI', 'DS']
    current_year = datetime.now().year
    
    for student_id in student_ids:
        # Extract numeric part from student ID (e.g., E0001 -> 1)
        numeric_id = int(student_id[1:]) if student_id.startswith('E') else random.randint(1, 9999)
        
        # Generate consistent data based on student ID
        random.seed(numeric_id)
        np.random.seed(numeric_id)
        
        dept = random.choice(departments)
        admission_year = random.choice([2020, 2021, 2022, 2023, 2024])
        current_semester = min(8, (current_year - admission_year) * 2 + random.choice([1, 2]))
        
        student = {
            'studentId': student_id,
            'name': fake.name(),
            'email': f"{student_id.lower()}@university.edu",
            'dob': fake.date_of_birth(minimum_age=18, maximum_age=25).strftime('%Y-%m-%d'),
            'currentSemester': current_semester,
            'department': dept,
            'phone': fake.phone_number()[:10],  # Ensure 10 digits
            'batchId': f"{dept}{admission_year}{random.choice(['A', 'B', 'C'])}",
            'parentName': fake.name(),
            'parentEmail': fake.email(),
            'parentPhone': fake.phone_number()[:10],
            'address': fake.address().replace('\n', ', ')
        }
        students.append(student)
    
    return students

def generate_attendance_data(student_ids, course_ids):
    """Generate monthly attendance data"""
    attendance_data = []
    months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
              '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12']
    
    for student_id in student_ids:
        numeric_id = int(student_id[1:]) if student_id.startswith('E') else random.randint(1, 9999)
        random.seed(numeric_id)
        
        # Each student has attendance for 3-4 courses
        student_courses = random.sample(course_ids, random.randint(3, min(4, len(course_ids))))
        
        for course_id in student_courses:
            for month in random.sample(months, random.randint(6, 10)):  # 6-10 months of data
                attendance_percent = round(random.uniform(60, 100), 1)
                attendance_data.append({
                    'studentId': student_id,
                    'courseId': course_id,
                    'month': month,
                    'attendancePercent': attendance_percent
                })
    
    return attendance_data

def generate_test_scores(student_ids, course_ids):
    """Generate test score data"""
    test_data = []
    test_types = ['Quiz_1', 'Quiz_2', 'Quiz_3', 'Midterm', 'Final']
    
    for student_id in student_ids:
        numeric_id = int(student_id[1:]) if student_id.startswith('E') else random.randint(1, 9999)
        random.seed(numeric_id)
        
        student_courses = random.sample(course_ids, random.randint(3, min(4, len(course_ids))))
        
        for course_id in student_courses:
            for test_type in test_types:
                test_date = fake.date_between(start_date='-1y', end_date='today').strftime('%Y-%m-%d')
                score = round(random.uniform(20, 100), 1)
                test_data.append({
                    'studentId': student_id,
                    'courseId': course_id,
                    'testType': test_type,
                    'testDate': test_date,
                    'score': score
                })
    
    return test_data

def generate_backlogs(student_ids, course_ids):
    """Generate backlog data"""
    backlog_data = []
    
    for student_id in student_ids:
        numeric_id = int(student_id[1:]) if student_id.startswith('E') else random.randint(1, 9999)
        random.seed(numeric_id)
        
        # 30% chance of having backlogs
        if random.random() < 0.3:
            num_backlogs = random.randint(1, 3)
            backlog_courses = random.sample(course_ids, min(num_backlogs, len(course_ids)))
            
            for course_id in backlog_courses:
                attempts = random.randint(1, 4)
                cleared = random.choice([True, False]) if attempts > 1 else False
                backlog_data.append({
                    'studentId': student_id,
                    'courseId': course_id,
                    'attempts': attempts,
                    'cleared': cleared
                })
    
    return backlog_data

def generate_fee_payments(student_ids):
    """Generate fee payment data"""
    fee_data = []
    
    for student_id in student_ids:
        numeric_id = int(student_id[1:]) if student_id.startswith('E') else random.randint(1, 9999)
        random.seed(numeric_id)
        
        # Generate 4-8 fee payments (semester fees)
        for i in range(random.randint(4, 8)):
            due_date = fake.date_between(start_date='-2y', end_date='+6m')
            
            # 80% chance of being paid
            if random.random() < 0.8:
                paid_date = due_date + timedelta(days=random.randint(-5, 30))
                status = 'Paid'
                due_months = max(0, (paid_date - due_date).days // 30)
            else:
                paid_date = None
                status = 'Pending'
                due_months = max(1, (datetime.now().date() - due_date).days // 30)
            
            fee_data.append({
                'studentId': student_id,
                'dueDate': due_date.strftime('%Y-%m-%d'),
                'paidDate': paid_date.strftime('%Y-%m-%d') if paid_date else '',
                'status': status,
                'dueMonths': due_months,
                'amount': random.choice([50000, 75000, 100000, 125000])  # Semester fee amounts
            })
    
    return fee_data

def generate_projects(student_ids):
    """Generate project data"""
    project_data = []
    project_titles = [
        'AI-Based Recommendation System', 'IoT Smart Home Automation', 'Blockchain Voting System',
        'Machine Learning Price Predictor', 'Web Application Development', 'Mobile App Development',
        'Data Analytics Dashboard', 'Computer Vision Project', 'Natural Language Processing',
        'Cybersecurity Framework', 'Cloud Computing Solution', 'Big Data Analysis'
    ]
    
    for student_id in student_ids:
        numeric_id = int(student_id[1:]) if student_id.startswith('E') else random.randint(1, 9999)
        random.seed(numeric_id)
        
        # 70% chance of having projects
        if random.random() < 0.7:
            num_projects = random.randint(1, 3)
            
            for i in range(num_projects):
                title = random.choice(project_titles)
                start_date = fake.date_between(start_date='-1y', end_date='today')
                status = random.choice(['Active', 'Completed', 'On Hold'])
                
                project_data.append({
                    'studentId': student_id,
                    'title': title,
                    'description': f"Comprehensive {title.lower()} implementation with modern technologies",
                    'startDate': start_date.strftime('%Y-%m-%d'),
                    'status': status,
                    'supervisorId': f"T{random.randint(1001, 1050)}"  # Teacher ID
                })
    
    return project_data

def generate_phd_supervision(student_ids):
    """Generate PhD supervision data (for PhD students only)"""
    phd_data = []
    research_areas = [
        'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Computer Vision',
        'Natural Language Processing', 'Cybersecurity', 'IoT', 'Blockchain',
        'Cloud Computing', 'Software Engineering', 'Database Systems', 'Network Security'
    ]
    
    for student_id in student_ids:
        numeric_id = int(student_id[1:]) if student_id.startswith('E') else random.randint(1, 9999)
        random.seed(numeric_id)
        
        # Only 5% chance of being PhD student
        if random.random() < 0.05:
            start_date = fake.date_between(start_date='-3y', end_date='-1y')
            expected_end = start_date + timedelta(days=random.randint(1095, 1825))  # 3-5 years
            
            phd_data.append({
                'studentId': student_id,
                'title': f"Research in {random.choice(research_areas)}",
                'researchArea': random.choice(research_areas),
                'startDate': start_date.strftime('%Y-%m-%d'),
                'expectedEnd': expected_end.strftime('%Y-%m-%d'),
                'supervisorId': f"T{random.randint(1001, 1020)}",  # Senior faculty
                'status': random.choice(['Ongoing', 'Completed', 'Discontinued'])
            })
    
    return phd_data

def generate_fellowships(student_ids):
    """Generate fellowship data"""
    fellowship_data = []
    fellowship_types = ['Full Time', 'Part Time', 'Research', 'Teaching Assistant']
    
    for student_id in student_ids:
        numeric_id = int(student_id[1:]) if student_id.startswith('E') else random.randint(1, 9999)
        random.seed(numeric_id)
        
        # 15% chance of having fellowship
        if random.random() < 0.15:
            fellowship_type = random.choice(fellowship_types)
            
            # Amount based on type
            if fellowship_type == 'Full Time':
                amount = random.randint(25000, 35000)
            elif fellowship_type == 'Part Time':
                amount = random.randint(12000, 18000)
            else:
                amount = random.randint(15000, 25000)
            
            start_date = fake.date_between(start_date='-1y', end_date='today')
            duration = random.choice([6, 12, 18, 24])  # months
            
            fellowship_data.append({
                'studentId': student_id,
                'type': fellowship_type,
                'amount': amount,
                'duration': duration,
                'startDate': start_date.strftime('%Y-%m-%d'),
                'status': random.choice(['Active', 'Completed', 'Terminated'])
            })
    
    return fellowship_data

def create_comprehensive_csv_files():
    """Main function to create all CSV files with comprehensive data"""
    
    print("🚀 Starting comprehensive data generation...")
    
    # Read existing student IDs from any existing file
    student_ids = []
    
    # Try to read from existing files to get student IDs
    try:
        if os.path.exists('student_personas.csv'):
            df = pd.read_csv('student_personas.csv')
            student_ids = df['studentID'].tolist() if 'studentID' in df.columns else df.iloc[:, 0].tolist()
        elif os.path.exists('grade_final.csv'):
            df = pd.read_csv('grade_final.csv')
            student_ids = df['studentID'].unique().tolist() if 'studentID' in df.columns else []
        
        if not student_ids:
            # Generate default student IDs
            student_ids = [f"E{str(i).zfill(4)}" for i in range(1, 1001)]
            
    except Exception as e:
        print(f"⚠️  Could not read existing files: {e}")
        student_ids = [f"E{str(i).zfill(4)}" for i in range(1, 1001)]
    
    print(f"📊 Generating data for {len(student_ids)} students...")
    
    # Define course IDs
    course_ids = ['CSET243', 'CSET240', 'CSET211', 'CSET201', 'MATH201', 'PHY101', 'CHEM101', 'ENG101']
    
    # Generate all data
    print("👤 Generating student basic information...")
    students_data = generate_student_basic_info(student_ids)
    students_df = pd.DataFrame(students_data)
    students_df.to_csv('students_comprehensive.csv', index=False)
    
    print("📅 Generating attendance data...")
    attendance_data = generate_attendance_data(student_ids, course_ids)
    attendance_df = pd.DataFrame(attendance_data)
    attendance_df.to_csv('attendance_comprehensive.csv', index=False)
    
    print("📝 Generating test scores...")
    test_data = generate_test_scores(student_ids, course_ids)
    test_df = pd.DataFrame(test_data)
    test_df.to_csv('test_scores_comprehensive.csv', index=False)
    
    print("📚 Generating backlogs data...")
    backlog_data = generate_backlogs(student_ids, course_ids)
    if backlog_data:
        backlog_df = pd.DataFrame(backlog_data)
        backlog_df.to_csv('backlogs_comprehensive.csv', index=False)
    
    print("💰 Generating fee payments...")
    fee_data = generate_fee_payments(student_ids)
    fee_df = pd.DataFrame(fee_data)
    fee_df.to_csv('fee_payments_comprehensive.csv', index=False)
    
    print("🔬 Generating projects data...")
    project_data = generate_projects(student_ids)
    if project_data:
        project_df = pd.DataFrame(project_data)
        project_df.to_csv('projects_comprehensive.csv', index=False)
    
    print("🎓 Generating PhD supervision data...")
    phd_data = generate_phd_supervision(student_ids)
    if phd_data:
        phd_df = pd.DataFrame(phd_data)
        phd_df.to_csv('phd_supervision_comprehensive.csv', index=False)
    
    print("💼 Generating fellowships data...")
    fellowship_data = generate_fellowships(student_ids)
    if fellowship_data:
        fellowship_df = pd.DataFrame(fellowship_data)
        fellowship_df.to_csv('fellowships_comprehensive.csv', index=False)
    
    # Create a sample JSON structure
    print("📋 Creating sample JSON structure...")
    sample_student = students_data[0] if students_data else {}
    sample_json = {
        **sample_student,
        "attendance": [att for att in attendance_data if att['studentId'] == sample_student.get('studentId', '')][:3],
        "testScores": [test for test in test_data if test['studentId'] == sample_student.get('studentId', '')][:3],
        "backlogs": [bl for bl in backlog_data if bl['studentId'] == sample_student.get('studentId', '')][:2],
        "feePayments": [fee for fee in fee_data if fee['studentId'] == sample_student.get('studentId', '')][:3],
        "projects": [proj for proj in project_data if proj['studentId'] == sample_student.get('studentId', '')][:2],
        "phdSupervision": [phd for phd in phd_data if phd['studentId'] == sample_student.get('studentId', '')][:1],
        "fellowships": [fel for fel in fellowship_data if fel['studentId'] == sample_student.get('studentId', '')][:1]
    }
    
    with open('sample_student_structure.json', 'w') as f:
        json.dump(sample_json, f, indent=2)
    
    # Generate summary report
    print("\n" + "="*60)
    print("📊 DATA GENERATION SUMMARY")
    print("="*60)
    print(f"✅ Students: {len(students_data)}")
    print(f"✅ Attendance Records: {len(attendance_data)}")
    print(f"✅ Test Scores: {len(test_data)}")
    print(f"✅ Backlogs: {len(backlog_data)}")
    print(f"✅ Fee Payments: {len(fee_data)}")
    print(f"✅ Projects: {len(project_data)}")
    print(f"✅ PhD Supervisions: {len(phd_data)}")
    print(f"✅ Fellowships: {len(fellowship_data)}")
    print("="*60)
    print("🎉 All comprehensive CSV files generated successfully!")
    print("\nFiles created:")
    print("- students_comprehensive.csv")
    print("- attendance_comprehensive.csv") 
    print("- test_scores_comprehensive.csv")
    print("- backlogs_comprehensive.csv")
    print("- fee_payments_comprehensive.csv")
    print("- projects_comprehensive.csv")
    print("- phd_supervision_comprehensive.csv")
    print("- fellowships_comprehensive.csv")
    print("- sample_student_structure.json")

if __name__ == "__main__":
    create_comprehensive_csv_files()
