#!/usr/bin/env python3
"""
Comprehensive CSV Data Generator for EduPulse Test Data
Generates all CSV files with student IDs starting from 10000
"""

import csv
import random
import os
from datetime import datetime, timedelta
from faker import Faker
import pandas as pd

# Initialize Faker
fake = Faker('en_IN')  # Indian locale for realistic Indian names and addresses

# Create test directory if it doesn't exist
TEST_DIR = 'test'
if not os.path.exists(TEST_DIR):
    os.makedirs(TEST_DIR)

# Configuration
STUDENT_ID_START = 10000
NUM_STUDENTS = 50
NUM_TEACHERS = 50

# Department and course configurations
DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'DS', 'AI']
SEMESTERS = list(range(1, 9))
BATCHES = ['A', 'B', 'C']

# Course configurations by department
COURSES = {
    'CSE': ['CSE101', 'CSE201', 'CSE301', 'CSE401', 'MATH101', 'PHY101'],
    'ECE': ['ECE101', 'ECE201', 'ECE301', 'ECE401', 'MATH101', 'PHY101'],
    'ME': ['ME101', 'ME201', 'ME301', 'ME401', 'MATH101', 'PHY101'],
    'CE': ['CE101', 'CE201', 'CE301', 'CE401', 'MATH101', 'PHY101'],
    'EEE': ['EEE101', 'EEE201', 'EEE301', 'EEE401', 'MATH101', 'PHY101'],
    'IT': ['IT101', 'IT201', 'IT301', 'IT401', 'MATH101', 'PHY101'],
    'DS': ['DS101', 'DS201', 'DS301', 'DS401', 'MATH101', 'STAT101'],
    'AI': ['AI101', 'AI201', 'AI301', 'AI401', 'MATH101', 'CS101']
}

# Test types
TEST_TYPES = ['Quiz_1', 'Quiz_2', 'Quiz_3', 'Midterm', 'Final', 'Assignment']

# Project titles and descriptions
PROJECT_TITLES = [
    'AI-Based Healthcare System',
    'Blockchain Supply Chain Management',
    'IoT Smart Home Automation',
    'Machine Learning Stock Predictor',
    'Web-based Learning Management System',
    'Mobile Banking Application',
    'Computer Vision Traffic Monitor',
    'Natural Language Processing Chatbot',
    'Data Analytics Dashboard',
    'Cybersecurity Threat Detection',
    'Cloud-based File Storage',
    'Augmented Reality Education Tool',
    'Smart Agriculture Monitoring',
    'E-commerce Recommendation Engine',
    'Social Media Analytics Platform'
]

PROJECT_DESCRIPTIONS = [
    'Advanced healthcare management system using artificial intelligence',
    'Secure supply chain tracking using blockchain technology',
    'Automated home control system with IoT sensors',
    'Predictive stock market analysis using machine learning',
    'Comprehensive online learning platform with interactive features',
    'Secure mobile banking application with biometric authentication',
    'Real-time traffic monitoring using computer vision',
    'Intelligent chatbot using natural language processing',
    'Interactive data visualization and analytics dashboard',
    'Advanced cybersecurity system for threat detection',
    'Scalable cloud storage solution with encryption',
    'Educational tool using augmented reality technology',
    'Smart farming system with sensor monitoring',
    'Personalized product recommendation system',
    'Social media data analysis and insights platform'
]

# Research areas
RESEARCH_AREAS = [
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Blockchain',
    'IoT',
    'Cybersecurity',
    'Cloud Computing',
    'Computer Vision',
    'Natural Language Processing',
    'Database Systems',
    'Network Security',
    'Software Engineering'
]

# Fellowship types
FELLOWSHIP_TYPES = ['Full Time', 'Part Time', 'Research', 'Teaching Assistant']

# Status options
PROJECT_STATUS = ['Active', 'Completed', 'On Hold', 'Cancelled']
PHD_STATUS = ['Ongoing', 'Completed', 'Discontinued']
FELLOWSHIP_STATUS = ['Active', 'Completed', 'Terminated', 'Suspended']
FEE_STATUS = ['Paid', 'Pending', 'Overdue']

# Mental Health configurations
MENTAL_HEALTH_CATEGORIES = ['Academic', 'Personal', 'Financial', 'Health', 'Other']
PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical']
SUPPORT_STATUS = ['Open', 'In Progress', 'Resolved', 'Closed']
APPOINTMENT_TYPES = ['Individual', 'Group', 'Crisis']
APPOINTMENT_STATUS = ['Scheduled', 'Completed', 'Cancelled', 'No-Show']
CHALLENGE_TYPES = ['Mindfulness', 'Exercise', 'Sleep', 'Social', 'Academic']
CHALLENGE_STATUS = ['Active', 'Completed', 'Abandoned']
COUNSELOR_NAMES = ['Dr. Priya Sharma', 'Dr. Rajesh Kumar', 'Dr. Anita Patel', 'Dr. Suresh Reddy', 'Dr. Meera Singh']

def generate_student_id(index):
    """Generate student ID starting from 10000"""
    return f"E{STUDENT_ID_START + index}"

def generate_teacher_id(index):
    """Generate teacher ID"""
    return f"T{2000 + index}"

def generate_batch_id(dept, year, section):
    """Generate batch ID"""
    return f"{dept}{year}{section}"

def generate_students_csv():
    """Generate students CSV file"""
    print("Generating students CSV...")
    
    students = []
    for i in range(NUM_STUDENTS):
        student_id = generate_student_id(i)
        dept = random.choice(DEPARTMENTS)
        semester = random.choice(SEMESTERS)
        year = 2024 - (semester // 2)  # Calculate year based on semester
        section = random.choice(BATCHES)
        batch_id = generate_batch_id(dept, year, section)
        
        # Generate realistic Indian data
        first_name = fake.first_name()
        last_name = fake.last_name()
        name = f"{first_name} {last_name}"
        
        student = {
            'studentId': student_id,
            'name': name,
            'email': f"{student_id.lower()}@university.edu",
            'dob': fake.date_between(start_date='-25y', end_date='-18y').strftime('%Y-%m-%d'),
            'currentSemester': semester,
            'department': dept,
            'phone': fake.phone_number()[:10],  # 10 digit phone number
            'batchId': batch_id,
            'parentName': fake.name(),
            'parentEmail': fake.email(),
            'parentPhone': fake.phone_number()[:10],
            'address': fake.address().replace('\n', ', ')
        }
        students.append(student)
    
    # Write to CSV
    with open(f'{TEST_DIR}/students_comprehensive_reduced_stratified.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=students[0].keys())
        writer.writeheader()
        writer.writerows(students)
    
    return students

def generate_attendance_csv(students):
    """Generate attendance CSV file"""
    print("Generating attendance CSV...")
    
    attendance_records = []
    months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
              '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12']
    
    for student in students:
        dept = student['department']
        courses = COURSES[dept]
        
        # Generate attendance for random courses and months
        for course in random.sample(courses, random.randint(2, 4)):
            for month in random.sample(months, random.randint(3, 8)):
                attendance = {
                    'studentId': student['studentId'],
                    'courseId': course,
                    'month': month,
                    'attendancePercent': round(random.uniform(45.0, 98.0), 1)
                }
                attendance_records.append(attendance)
    
    # Write to CSV
    with open(f'{TEST_DIR}/attendance_comprehensive_reduced_stratified.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['studentId', 'courseId', 'month', 'attendancePercent'])
        writer.writeheader()
        writer.writerows(attendance_records)

def generate_test_scores_csv(students):
    """Generate test scores CSV file"""
    print("Generating test scores CSV...")
    
    test_records = []
    
    for student in students:
        dept = student['department']
        courses = COURSES[dept]
        
        # Generate test scores for random courses
        for course in random.sample(courses, random.randint(2, 4)):
            for test_type in random.sample(TEST_TYPES, random.randint(2, 5)):
                test_date = fake.date_between(start_date='-1y', end_date='today')
                score = round(random.uniform(15.0, 95.0), 1)
                
                test_record = {
                    'studentId': student['studentId'],
                    'courseId': course,
                    'testType': test_type,
                    'testDate': test_date.strftime('%Y-%m-%d'),
                    'score': score
                }
                test_records.append(test_record)
    
    # Write to CSV
    with open(f'{TEST_DIR}/test_scores_comprehensive_reduced_stratified.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['studentId', 'courseId', 'testType', 'testDate', 'score'])
        writer.writeheader()
        writer.writerows(test_records)

def generate_backlogs_csv(students):
    """Generate backlogs CSV file"""
    print("Generating backlogs CSV...")
    
    backlog_records = []
    
    # Only some students have backlogs
    students_with_backlogs = random.sample(students, NUM_STUDENTS // 4)
    
    for student in students_with_backlogs:
        dept = student['department']
        courses = COURSES[dept]
        
        # Generate backlogs for 1-3 courses
        for course in random.sample(courses, random.randint(1, 3)):
            backlog = {
                'studentId': student['studentId'],
                'courseId': course,
                'attempts': random.randint(1, 4),
                'cleared': random.choice([True, False])
            }
            backlog_records.append(backlog)
    
    # Write to CSV
    with open(f'{TEST_DIR}/backlogs_comprehensive_reduced_stratified.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['studentId', 'courseId', 'attempts', 'cleared'])
        writer.writeheader()
        writer.writerows(backlog_records)

def generate_fee_payments_csv(students):
    """Generate fee payments CSV file"""
    print("Generating fee payments CSV...")
    
    fee_records = []
    
    for student in students:
        # Generate 2-5 fee payment records per student
        for _ in range(random.randint(2, 5)):
            due_date = fake.date_between(start_date='-2y', end_date='+6m')
            
            # Determine if payment is made and when
            if random.random() < 0.85:  # 85% payments are made
                paid_date = due_date + timedelta(days=random.randint(-5, 30))
                status = 'Paid'
                due_months = max(0, (datetime.now().date() - due_date).days // 30) if paid_date > due_date else 0
            else:
                paid_date = None
                status = random.choice(['Pending', 'Overdue'])
                due_months = max(0, (datetime.now().date() - due_date).days // 30)
            
            fee_record = {
                'studentId': student['studentId'],
                'dueDate': due_date.strftime('%Y-%m-%d'),
                'paidDate': paid_date.strftime('%Y-%m-%d') if paid_date else '',
                'status': status,
                'dueMonths': due_months,
                'amount': random.choice([25000, 50000, 75000, 100000, 125000])
            }
            fee_records.append(fee_record)
    
    # Write to CSV
    with open(f'{TEST_DIR}/fee_payments_comprehensive_reduced_stratified.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['studentId', 'dueDate', 'paidDate', 'status', 'dueMonths', 'amount'])
        writer.writeheader()
        writer.writerows(fee_records)

def generate_projects_csv(students):
    """Generate projects CSV file"""
    print("Generating projects CSV...")
    
    project_records = []
    
    # About 60% of students have projects
    students_with_projects = random.sample(students, int(NUM_STUDENTS * 0.6))
    
    for student in students_with_projects:
        # Some students have multiple projects
        num_projects = random.choices([1, 2, 3], weights=[70, 25, 5])[0]
        
        for _ in range(num_projects):
            title = random.choice(PROJECT_TITLES)
            description = random.choice(PROJECT_DESCRIPTIONS)
            start_date = fake.date_between(start_date='-2y', end_date='today')
            supervisor_id = generate_teacher_id(random.randint(0, NUM_TEACHERS-1))
            
            project = {
                'studentId': student['studentId'],
                'title': title,
                'description': description,
                'startDate': start_date.strftime('%Y-%m-%d'),
                'status': random.choice(PROJECT_STATUS),
                'supervisorId': supervisor_id
            }
            project_records.append(project)
    
    # Write to CSV
    with open(f'{TEST_DIR}/projects_comprehensive_reduced_stratified.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['studentId', 'title', 'description', 'startDate', 'status', 'supervisorId'])
        writer.writeheader()
        writer.writerows(project_records)

def generate_phd_supervision_csv(students):
    """Generate PhD supervision CSV file"""
    print("Generating PhD supervision CSV...")
    
    phd_records = []
    
    # Only about 5% of students are PhD students
    phd_students = random.sample(students, int(NUM_STUDENTS * 0.05))
    
    for student in phd_students:
        research_area = random.choice(RESEARCH_AREAS)
        start_date = fake.date_between(start_date='-5y', end_date='-1y')
        expected_end = start_date + timedelta(days=random.randint(1095, 2190))  # 3-6 years
        supervisor_id = generate_teacher_id(random.randint(0, NUM_TEACHERS-1))
        
        phd_record = {
            'studentId': student['studentId'],
            'title': f"Research in {research_area}",
            'researchArea': research_area,
            'startDate': start_date.strftime('%Y-%m-%d'),
            'expectedEnd': expected_end.strftime('%Y-%m-%d'),
            'supervisorId': supervisor_id,
            'status': random.choice(PHD_STATUS)
        }
        phd_records.append(phd_record)
    
    # Write to CSV
    with open(f'{TEST_DIR}/phd_supervision_comprehensive_reduced_stratified.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['studentId', 'title', 'researchArea', 'startDate', 'expectedEnd', 'supervisorId', 'status'])
        writer.writeheader()
        writer.writerows(phd_records)

def generate_fellowships_csv(students):
    """Generate fellowships CSV file"""
    print("Generating fellowships CSV...")
    
    fellowship_records = []
    
    # About 15% of students have fellowships
    fellowship_students = random.sample(students, int(NUM_STUDENTS * 0.15))
    
    for student in fellowship_students:
        fellowship_type = random.choice(FELLOWSHIP_TYPES)
        duration = random.choice([6, 12, 18, 24])  # months
        start_date = fake.date_between(start_date='-2y', end_date='today')
        
        # Amount varies by type
        if fellowship_type == 'Full Time':
            amount = random.randint(25000, 40000)
        elif fellowship_type == 'Part Time':
            amount = random.randint(12000, 20000)
        elif fellowship_type == 'Research':
            amount = random.randint(15000, 25000)
        else:  # Teaching Assistant
            amount = random.randint(18000, 28000)
        
        fellowship = {
            'studentId': student['studentId'],
            'type': fellowship_type,
            'amount': amount,
            'duration': duration,
            'startDate': start_date.strftime('%Y-%m-%d'),
            'status': random.choice(FELLOWSHIP_STATUS)
        }
        fellowship_records.append(fellowship)
    
    # Write to CSV
    with open(f'{TEST_DIR}/fellowships_comprehensive_reduced_stratified.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['studentId', 'type', 'amount', 'duration', 'startDate', 'status'])
        writer.writeheader()
        writer.writerows(fellowship_records)

def generate_mental_health_assessments_csv(students):
    """Generate mental health assessments CSV file"""
    print("Generating mental health assessments CSV...")
    
    assessment_records = []
    
    # About 70% of students have at least one assessment
    students_with_assessments = random.sample(students, int(NUM_STUDENTS * 0.7))
    
    for student in students_with_assessments:
        # Generate 1-5 assessments per student over time
        num_assessments = random.choices([1, 2, 3, 4, 5], weights=[30, 25, 20, 15, 10])[0]
        
        for i in range(num_assessments):
            assessment_date = fake.date_between(start_date='-1y', end_date='today')
            
            # Generate realistic mental health scores (1-10 scale)
            # Some correlation between stress/anxiety/depression
            base_stress = random.randint(1, 10)
            stress_level = base_stress
            anxiety_level = max(1, min(10, base_stress + random.randint(-2, 2)))
            depression_level = max(1, min(10, base_stress + random.randint(-3, 1)))
            
            # Sleep and wellness often inversely related to stress
            sleep_quality = max(1, min(10, 11 - base_stress + random.randint(-2, 3)))
            overall_wellness = max(1, min(10, 11 - base_stress + random.randint(-1, 2)))
            
            # Academic pressure and social support
            academic_pressure = random.randint(3, 10)
            social_support = random.randint(2, 9)
            
            # Calculate risk score
            risk_score = (stress_level + anxiety_level + depression_level) / 3
            
            assessment = {
                'studentId': student['studentId'],
                'assessmentDate': assessment_date.strftime('%Y-%m-%d'),
                'stressLevel': stress_level,
                'anxietyLevel': anxiety_level,
                'depressionLevel': depression_level,
                'sleepQuality': sleep_quality,
                'academicPressure': academic_pressure,
                'socialSupport': social_support,
                'overallWellness': overall_wellness,
                'notes': fake.sentence() if random.random() < 0.3 else '',
                'riskScore': round(risk_score, 2)
            }
            assessment_records.append(assessment)
    
    # Write to CSV
    with open(f'{TEST_DIR}/mental_health_assessments.csv', 'w', newline='', encoding='utf-8') as file:
        fieldnames = ['studentId', 'assessmentDate', 'stressLevel', 'anxietyLevel', 'depressionLevel', 
                     'sleepQuality', 'academicPressure', 'socialSupport', 'overallWellness', 'notes', 'riskScore']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(assessment_records)

def generate_counseling_appointments_csv(students):
    """Generate counseling appointments CSV file"""
    print("Generating counseling appointments CSV...")
    
    appointment_records = []
    
    # About 40% of students have counseling appointments
    students_with_appointments = random.sample(students, int(NUM_STUDENTS * 0.4))
    
    for student in students_with_appointments:
        # Generate 1-8 appointments per student
        num_appointments = random.choices([1, 2, 3, 4, 5, 6, 7, 8], weights=[25, 20, 15, 15, 10, 8, 4, 3])[0]
        
        for i in range(num_appointments):
            appointment_date = fake.date_between(start_date='-1y', end_date='+3m')
            counselor = random.choice(COUNSELOR_NAMES)
            appointment_type = random.choice(APPOINTMENT_TYPES)
            duration = random.choice([30, 45, 60, 90])  # minutes
            status = random.choice(APPOINTMENT_STATUS)
            follow_up = random.choice([True, False]) if status == 'Completed' else False
            
            appointment = {
                'studentId': student['studentId'],
                'counselorName': counselor,
                'appointmentDate': appointment_date.strftime('%Y-%m-%d %H:%M:%S'),
                'duration': duration,
                'type': appointment_type,
                'status': status,
                'notes': fake.sentence() if random.random() < 0.4 else '',
                'followUpNeeded': follow_up
            }
            appointment_records.append(appointment)
    
    # Write to CSV
    with open(f'{TEST_DIR}/counseling_appointments.csv', 'w', newline='', encoding='utf-8') as file:
        fieldnames = ['studentId', 'counselorName', 'appointmentDate', 'duration', 'type', 'status', 'notes', 'followUpNeeded']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(appointment_records)

def generate_wellness_challenges_csv(students):
    """Generate wellness challenges CSV file"""
    print("Generating wellness challenges CSV...")
    
    challenge_records = []
    
    # About 50% of students participate in wellness challenges
    students_with_challenges = random.sample(students, int(NUM_STUDENTS * 0.5))
    
    challenge_titles = {
        'Mindfulness': ['Daily Meditation', '10-Minute Mindfulness', 'Breathing Exercises', 'Gratitude Journal'],
        'Exercise': ['30-Day Fitness', 'Daily Walk Challenge', 'Yoga Practice', 'Sports Activity'],
        'Sleep': ['Sleep Schedule', 'Digital Detox Before Bed', '8-Hour Sleep Challenge', 'Relaxation Routine'],
        'Social': ['Connect with Friends', 'Join Study Groups', 'Community Service', 'Social Activities'],
        'Academic': ['Study Schedule', 'Time Management', 'Goal Setting', 'Skill Development']
    }
    
    for student in students_with_challenges:
        # Generate 1-4 challenges per student
        num_challenges = random.choices([1, 2, 3, 4], weights=[40, 30, 20, 10])[0]
        
        for i in range(num_challenges):
            challenge_type = random.choice(CHALLENGE_TYPES)
            title = random.choice(challenge_titles[challenge_type])
            description = f"{challenge_type} challenge: {title}"
            
            start_date = fake.date_between(start_date='-6m', end_date='today')
            duration_days = random.choice([7, 14, 21, 30])
            end_date = start_date + timedelta(days=duration_days)
            
            target_value = duration_days  # Target days to complete
            current_progress = random.randint(0, target_value)
            
            # Determine status based on progress and dates
            if current_progress >= target_value:
                status = 'Completed'
            elif datetime.now().date() > end_date:
                status = 'Abandoned' if current_progress < target_value * 0.5 else 'Completed'
            else:
                status = 'Active'
            
            points = current_progress * 10  # 10 points per day completed
            
            challenge = {
                'studentId': student['studentId'],
                'challengeType': challenge_type,
                'title': title,
                'description': description,
                'targetValue': target_value,
                'currentProgress': current_progress,
                'startDate': start_date.strftime('%Y-%m-%d'),
                'endDate': end_date.strftime('%Y-%m-%d'),
                'status': status,
                'points': points
            }
            challenge_records.append(challenge)
    
    # Write to CSV
    with open(f'{TEST_DIR}/wellness_challenges.csv', 'w', newline='', encoding='utf-8') as file:
        fieldnames = ['studentId', 'challengeType', 'title', 'description', 'targetValue', 
                     'currentProgress', 'startDate', 'endDate', 'status', 'points']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(challenge_records)

def generate_support_tickets_csv(students):
    """Generate support tickets CSV file"""
    print("Generating support tickets CSV...")
    
    ticket_records = []
    
    # About 30% of students submit support tickets
    students_with_tickets = random.sample(students, int(NUM_STUDENTS * 0.3))
    
    ticket_subjects = {
        'Academic': ['Course Registration Issues', 'Grade Concerns', 'Assignment Help', 'Exam Anxiety'],
        'Personal': ['Stress Management', 'Relationship Issues', 'Family Problems', 'Self-Esteem'],
        'Financial': ['Fee Payment Issues', 'Scholarship Questions', 'Financial Aid', 'Emergency Funds'],
        'Health': ['Medical Leave', 'Disability Support', 'Mental Health Resources', 'Health Insurance'],
        'Other': ['Housing Issues', 'Transportation', 'Technology Problems', 'General Inquiry']
    }
    
    for student in students_with_tickets:
        # Generate 1-3 tickets per student
        num_tickets = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
        
        for i in range(num_tickets):
            category = random.choice(MENTAL_HEALTH_CATEGORIES)
            subject = random.choice(ticket_subjects[category])
            priority = random.choice(PRIORITY_LEVELS)
            status = random.choice(SUPPORT_STATUS)
            is_anonymous = random.choice([True, False])
            
            created_date = fake.date_between(start_date='-1y', end_date='today')
            
            # Determine resolved date based on status
            resolved_date = None
            if status in ['Resolved', 'Closed']:
                resolved_date = created_date + timedelta(days=random.randint(1, 30))
            
            ticket = {
                'studentId': student['studentId'],
                'category': category,
                'priority': priority,
                'subject': subject,
                'description': fake.paragraph(),
                'status': status,
                'isAnonymous': is_anonymous,
                'createdAt': created_date.strftime('%Y-%m-%d %H:%M:%S'),
                'resolvedAt': resolved_date.strftime('%Y-%m-%d %H:%M:%S') if resolved_date else '',
                'assignedTo': random.choice(COUNSELOR_NAMES) if status != 'Open' else '',
                'response': fake.sentence() if status in ['Resolved', 'Closed'] else ''
            }
            ticket_records.append(ticket)
    
    # Write to CSV
    with open(f'{TEST_DIR}/support_tickets.csv', 'w', newline='', encoding='utf-8') as file:
        fieldnames = ['studentId', 'category', 'priority', 'subject', 'description', 'status', 
                     'isAnonymous', 'createdAt', 'resolvedAt', 'assignedTo', 'response']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(ticket_records)

def main():
    """Main function to generate all CSV files"""
    print("Starting CSV data generation...")
    print(f"Generating data for {NUM_STUDENTS} students with IDs starting from E{STUDENT_ID_START}")
    print(f"Output directory: {TEST_DIR}/")
    print("-" * 50)
    
    # Generate students first (needed for other files)
    students = generate_students_csv()
    
    # Generate all other CSV files
    generate_attendance_csv(students)
    generate_test_scores_csv(students)
    generate_backlogs_csv(students)
    generate_fee_payments_csv(students)
    generate_projects_csv(students)
    generate_phd_supervision_csv(students)
    generate_fellowships_csv(students)
    
    # Generate mental health CSV files
    generate_mental_health_assessments_csv(students)
    generate_counseling_appointments_csv(students)
    generate_wellness_challenges_csv(students)
    generate_support_tickets_csv(students)
    
    print("-" * 50)
    print("CSV data generation completed successfully!")
    print(f"Generated files in '{TEST_DIR}/' directory:")
    
    # List generated files
    for filename in os.listdir(TEST_DIR):
        if filename.endswith('.csv'):
            filepath = os.path.join(TEST_DIR, filename)
            size = os.path.getsize(filepath)
            print(f"  - {filename} ({size:,} bytes)")

if __name__ == "__main__":
    main()
