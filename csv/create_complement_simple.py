#!/usr/bin/env python3
"""
Simple Complement Data Generator
Creates new data that complements the existing filtered data
"""

import pandas as pd
import random
from datetime import datetime, timedelta
from pathlib import Path

def generate_student_ids(existing_ids, count=8):
    """Generate new unique student IDs"""
    new_ids = []
    while len(new_ids) < count:
        new_id = f"E{random.randint(5000, 9999)}"
        if new_id not in existing_ids and new_id not in new_ids:
            new_ids.append(new_id)
    return new_ids

def generate_indian_name():
    """Generate random Indian names"""
    first_names = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anita', 'Rohan', 'Kavya', 
                  'Amit', 'Neha', 'Sanjay', 'Pooja', 'Rajesh', 'Meera', 'Kiran', 'Divya',
                  'Aarav', 'Isha', 'Dev', 'Riya', 'Aryan', 'Tara', 'Vihan', 'Nisha']
    last_names = ['Sharma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Agarwal', 'Jain', 'Reddy',
                 'Iyer', 'Nair', 'Chopra', 'Malhotra', 'Verma', 'Yadav', 'Mishra', 'Tiwari',
                 'Shah', 'Mehta', 'Bansal', 'Saxena', 'Pandey', 'Srivastava']
    return f"{random.choice(first_names)} {random.choice(last_names)}"

def generate_date(start_year=2000, end_year=2005):
    """Generate random date"""
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return (start_date + timedelta(days=random_days)).strftime('%Y-%m-%d')

def main():
    """Generate complement data"""
    print("🚀 Creating complement data...")
    
    # Paths
    filtered_dir = Path("new_csv")
    output_dir = Path("complement_data")
    
    # Create output directory
    output_dir.mkdir(exist_ok=True)
    print(f"✓ Created directory: {output_dir}")
    
    # Read existing student IDs from filtered data
    existing_students_file = filtered_dir / "students_comprehensive_reduced_stratified.csv"
    if not existing_students_file.exists():
        print("✗ Filtered students file not found!")
        return
    
    existing_df = pd.read_csv(existing_students_file)
    existing_ids = set(existing_df['studentId'].tolist())
    print(f"📋 Found {len(existing_ids)} existing students: {list(existing_ids)}")
    
    # Generate new student IDs
    new_student_ids = generate_student_ids(existing_ids, count=8)
    print(f"✨ Generated {len(new_student_ids)} new students: {new_student_ids}")
    
    # 1. Generate Students Data
    print("\n👥 Generating students data...")
    departments = ['CS', 'IT', 'ECE', 'ME', 'CE', 'EE', 'AI', 'DS']
    students_data = []
    
    for student_id in new_student_ids:
        dept = random.choice(departments)
        students_data.append({
            'studentId': student_id,
            'name': generate_indian_name(),
            'email': f"{student_id.lower()}@university.edu",
            'dob': generate_date(2001, 2004),
            'currentSemester': random.randint(1, 8),
            'department': dept,
            'phone': str(random.randint(7000000000, 9999999999)),
            'batchId': f"{dept}{random.randint(2020, 2024)}{random.choice(['A', 'B', 'C'])}",
            'parentName': generate_indian_name(),
            'parentEmail': f"parent{random.randint(1000, 9999)}@example.com",
            'parentPhone': str(random.randint(7000000000, 9999999999)),
            'address': f"{random.randint(1, 999)}, {random.choice(['MG Road', 'Park Street', 'Mall Road'])}, {random.choice(['Mumbai', 'Delhi', 'Bangalore', 'Chennai'])}-{random.randint(100000, 999999)}"
        })
    
    students_df = pd.DataFrame(students_data)
    students_df.to_csv(output_dir / "students_comprehensive_reduced_stratified.csv", index=False)
    print(f"✓ Created students file with {len(students_df)} records")
    
    # 2. Generate Attendance Data
    print("📊 Generating attendance data...")
    courses = ['PHY101', 'MATH201', 'CS301', 'IT401', 'ECE501', 'CSET240', 'CSET243']
    attendance_data = []
    
    for student_id in new_student_ids:
        for course in random.sample(courses, random.randint(3, 5)):
            for month in range(1, 13):
                if random.random() > 0.25:  # 75% chance of attendance record
                    attendance_data.append({
                        'studentId': student_id,
                        'courseId': course,
                        'month': f"2024-{month:02d}",
                        'attendancePercent': round(random.uniform(55, 95), 1)
                    })
    
    attendance_df = pd.DataFrame(attendance_data)
    attendance_df.to_csv(output_dir / "attendance_comprehensive_reduced_stratified.csv", index=False)
    print(f"✓ Created attendance file with {len(attendance_df)} records")
    
    # 3. Generate Test Scores Data
    print("📝 Generating test scores data...")
    test_types = ['Quiz_1', 'Quiz_2', 'Quiz_3', 'Midterm', 'Final']
    test_data = []
    
    for student_id in new_student_ids:
        for course in random.sample(courses, random.randint(3, 5)):
            for test_type in random.sample(test_types, random.randint(3, 4)):
                test_data.append({
                    'studentId': student_id,
                    'courseId': course,
                    'testType': test_type,
                    'testDate': generate_date(2024, 2025),
                    'score': round(random.uniform(25, 95), 1)
                })
    
    test_df = pd.DataFrame(test_data)
    test_df.to_csv(output_dir / "test_scores_comprehensive_reduced_stratified.csv", index=False)
    print(f"✓ Created test scores file with {len(test_df)} records")
    
    # 4. Generate Fee Payments Data
    print("💰 Generating fee payments data...")
    fee_data = []
    
    for student_id in new_student_ids:
        for i in range(random.randint(2, 4)):
            fee_data.append({
                'studentId': student_id,
                'feeType': random.choice(['Tuition', 'Hostel', 'Library', 'Lab']),
                'amount': random.randint(10000, 50000),
                'dueDate': generate_date(2024, 2025),
                'paidDate': generate_date(2024, 2025) if random.random() > 0.2 else '',
                'status': random.choice(['Paid', 'Pending'])
            })
    
    fee_df = pd.DataFrame(fee_data)
    fee_df.to_csv(output_dir / "fee_payments_comprehensive_reduced_stratified.csv", index=False)
    print(f"✓ Created fee payments file with {len(fee_df)} records")
    
    # 5. Generate Backlogs Data (fewer records)
    print("⚠️ Generating backlogs data...")
    backlog_data = []
    
    for student_id in random.sample(new_student_ids, 3):  # Only 3 students have backlogs
        backlog_data.append({
            'studentId': student_id,
            'courseId': random.choice(courses),
            'semester': random.randint(1, 6),
            'attempts': random.randint(1, 2),
            'cleared': random.choice([True, False])
        })
    
    backlog_df = pd.DataFrame(backlog_data)
    backlog_df.to_csv(output_dir / "backlogs_comprehensive_reduced_stratified.csv", index=False)
    print(f"✓ Created backlogs file with {len(backlog_df)} records")
    
    # 6. Generate Projects Data
    print("🚀 Generating projects data...")
    project_titles = [
        'AI Chatbot Development',
        'Smart Traffic Management',
        'E-commerce Platform',
        'Mobile Banking App',
        'IoT Weather Station',
        'Blockchain Voting'
    ]
    project_data = []
    
    for student_id in random.sample(new_student_ids, 5):  # 5 students have projects
        project_data.append({
            'studentId': student_id,
            'projectTitle': random.choice(project_titles),
            'supervisorId': f"T{random.randint(1000, 9999)}",
            'startDate': generate_date(2023, 2024),
            'endDate': generate_date(2024, 2025),
            'status': random.choice(['Active', 'Completed'])
        })
    
    project_df = pd.DataFrame(project_data)
    project_df.to_csv(output_dir / "projects_comprehensive_reduced_stratified.csv", index=False)
    print(f"✓ Created projects file with {len(project_df)} records")
    
    # 7. Generate PhD Supervision Data (minimal)
    print("🎓 Generating PhD supervision data...")
    phd_data = []
    
    for student_id in random.sample(new_student_ids, 1):  # Only 1 PhD student
        phd_data.append({
            'studentId': student_id,
            'researchTitle': 'Advanced Machine Learning Applications',
            'supervisorId': f"T{random.randint(1000, 9999)}",
            'researchArea': 'Machine Learning',
            'startDate': generate_date(2022, 2023),
            'expectedCompletion': generate_date(2025, 2026),
            'status': 'Ongoing'
        })
    
    phd_df = pd.DataFrame(phd_data)
    phd_df.to_csv(output_dir / "phd_supervision_comprehensive_reduced_stratified.csv", index=False)
    print(f"✓ Created PhD supervision file with {len(phd_df)} records")
    
    # 8. Generate Fellowships Data (minimal)
    print("💼 Generating fellowships data...")
    fellowship_data = []
    
    for student_id in random.sample(new_student_ids, 2):  # Only 2 fellowship students
        fellowship_data.append({
            'studentId': student_id,
            'fellowshipType': random.choice(['Full Time', 'Part Time']),
            'amount': random.randint(20000, 30000),
            'startDate': generate_date(2023, 2024),
            'endDate': generate_date(2024, 2025),
            'status': random.choice(['Active', 'Completed'])
        })
    
    fellowship_df = pd.DataFrame(fellowship_data)
    fellowship_df.to_csv(output_dir / "fellowships_comprehensive_reduced_stratified.csv", index=False)
    print(f"✓ Created fellowships file with {len(fellowship_df)} records")
    
    print("\n" + "=" * 60)
    print("🎉 Complement data generation completed!")
    print(f"📂 Output directory: {output_dir.absolute()}")
    print(f"👥 Generated data for {len(new_student_ids)} new students")
    print(f"🆔 New student IDs: {new_student_ids}")
    
    # Show file sizes
    print(f"\n📁 Generated files:")
    for file in output_dir.glob("*.csv"):
        size_kb = file.stat().st_size / 1024
        df = pd.read_csv(file)
        print(f"  • {file.name}: {len(df)} rows ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
