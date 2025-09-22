#!/usr/bin/env python3
"""
Generate Complement Data for EduPulse CSV Files
Creates new synthetic data that doesn't exist in the original dataset
"""

import pandas as pd
import random
import string
from datetime import datetime, timedelta
from pathlib import Path
import json

class ComplementDataGenerator:
    def __init__(self, original_dir, filtered_dir, output_dir):
        self.original_dir = Path(original_dir)
        self.filtered_dir = Path(filtered_dir)
        self.output_dir = Path(output_dir)
        self.new_students = []
        self.departments = ['CS', 'IT', 'ECE', 'ME', 'CE', 'EE', 'AI', 'DS']
        self.courses = ['PHY101', 'MATH201', 'CS301', 'IT401', 'ECE501', 'ME601', 'CSET240', 'CSET243']
        
    def generate_student_id(self, existing_ids):
        """Generate a new unique student ID"""
        while True:
            new_id = f"E{random.randint(5000, 9999)}"
            if new_id not in existing_ids:
                return new_id
    
    def generate_email(self, student_id):
        """Generate email from student ID"""
        return f"{student_id.lower()}@university.edu"
    
    def generate_phone(self):
        """Generate random phone number"""
        return str(random.randint(1000000000, 9999999999))
    
    def generate_date(self, start_year=2000, end_year=2005):
        """Generate random date"""
        start_date = datetime(start_year, 1, 1)
        end_date = datetime(end_year, 12, 31)
        time_between = end_date - start_date
        days_between = time_between.days
        random_days = random.randrange(days_between)
        return (start_date + timedelta(days=random_days)).strftime('%Y-%m-%d')
    
    def generate_name(self):
        """Generate random Indian names"""
        first_names = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anita', 'Rohan', 'Kavya', 
                      'Amit', 'Neha', 'Sanjay', 'Pooja', 'Rajesh', 'Meera', 'Kiran', 'Divya']
        last_names = ['Sharma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Agarwal', 'Jain', 'Reddy',
                     'Iyer', 'Nair', 'Chopra', 'Malhotra', 'Verma', 'Yadav', 'Mishra', 'Tiwari']
        return f"{random.choice(first_names)} {random.choice(last_names)}"
    
    def generate_address(self):
        """Generate random Indian address"""
        cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Ahmedabad']
        streets = ['MG Road', 'Park Street', 'Brigade Road', 'Commercial Street', 'Mall Road']
        return f"{random.randint(1, 999)}, {random.choice(streets)}, {random.choice(cities)}-{random.randint(100000, 999999)}"
    
    def get_existing_student_ids(self):
        """Get all existing student IDs from original data"""
        existing_ids = set()
        
        # Check original students file
        original_students = self.original_dir / "students_comprehensive_reduced_stratified.csv"
        if original_students.exists():
            df = pd.read_csv(original_students)
            existing_ids.update(df['studentId'].tolist())
        
        # Check filtered students file
        filtered_students = self.filtered_dir / "students_comprehensive_reduced_stratified.csv"
        if filtered_students.exists():
            df = pd.read_csv(filtered_students)
            existing_ids.update(df['studentId'].tolist())
        
        return existing_ids
    
    def generate_students_data(self, num_students=10):
        """Generate new students data"""
        existing_ids = self.get_existing_student_ids()
        students_data = []
        
        print(f"📝 Generating {num_students} new students...")
        
        for i in range(num_students):
            student_id = self.generate_student_id(existing_ids)
            existing_ids.add(student_id)
            self.new_students.append(student_id)
            
            student = {
                'studentId': student_id,
                'name': self.generate_name(),
                'email': self.generate_email(student_id),
                'dob': self.generate_date(),
                'currentSemester': random.randint(1, 8),
                'department': random.choice(self.departments),
                'phone': self.generate_phone(),
                'batchId': f"{random.choice(self.departments)}{random.randint(2020, 2024)}{random.choice(['A', 'B', 'C'])}",
                'parentName': self.generate_name(),
                'parentEmail': f"parent{random.randint(1000, 9999)}@example.com",
                'parentPhone': self.generate_phone(),
                'address': self.generate_address()
            }
            students_data.append(student)
        
        return pd.DataFrame(students_data)
    
    def generate_attendance_data(self):
        """Generate attendance data for new students"""
        attendance_data = []
        
        print("📊 Generating attendance data...")
        
        for student_id in self.new_students:
            # Generate attendance for multiple courses and months
            for course in random.sample(self.courses, random.randint(3, 6)):
                for month in range(1, 13):
                    if random.random() > 0.3:  # 70% chance of having attendance record
                        attendance_data.append({
                            'studentId': student_id,
                            'courseId': course,
                            'month': f"2024-{month:02d}",
                            'attendancePercent': round(random.uniform(50, 95), 1)
                        })
        
        return pd.DataFrame(attendance_data)
    
    def generate_test_scores_data(self):
        """Generate test scores data for new students"""
        test_data = []
        test_types = ['Quiz_1', 'Quiz_2', 'Quiz_3', 'Midterm', 'Final', 'Assignment']
        
        print("📝 Generating test scores data...")
        
        for student_id in self.new_students:
            for course in random.sample(self.courses, random.randint(3, 6)):
                for test_type in random.sample(test_types, random.randint(3, 5)):
                    test_data.append({
                        'studentId': student_id,
                        'courseId': course,
                        'testType': test_type,
                        'testDate': self.generate_date(2024, 2025),
                        'score': round(random.uniform(20, 95), 1)
                    })
        
        return pd.DataFrame(test_data)
    
    def generate_fee_payments_data(self):
        """Generate fee payments data for new students"""
        fee_data = []
        
        print("💰 Generating fee payments data...")
        
        for student_id in self.new_students:
            # Generate 2-4 fee payments per student
            for i in range(random.randint(2, 4)):
                fee_data.append({
                    'studentId': student_id,
                    'feeType': random.choice(['Tuition', 'Hostel', 'Library', 'Lab', 'Exam']),
                    'amount': random.randint(5000, 50000),
                    'dueDate': self.generate_date(2024, 2025),
                    'paidDate': self.generate_date(2024, 2025) if random.random() > 0.2 else '',
                    'status': random.choice(['Paid', 'Pending', 'Overdue'])
                })
        
        return pd.DataFrame(fee_data)
    
    def generate_backlogs_data(self):
        """Generate backlogs data for new students"""
        backlog_data = []
        
        print("⚠️ Generating backlogs data...")
        
        for student_id in self.new_students:
            # 30% chance of having backlogs
            if random.random() < 0.3:
                for i in range(random.randint(1, 3)):
                    backlog_data.append({
                        'studentId': student_id,
                        'courseId': random.choice(self.courses),
                        'semester': random.randint(1, 6),
                        'attempts': random.randint(1, 3),
                        'cleared': random.choice([True, False])
                    })
        
        return pd.DataFrame(backlog_data)
    
    def generate_projects_data(self):
        """Generate projects data for new students"""
        project_data = []
        project_titles = [
            'AI-Based Recommendation System',
            'IoT Smart Home Automation',
            'Blockchain Voting System',
            'Machine Learning Stock Predictor',
            'Web-based Learning Platform',
            'Mobile App for Healthcare',
            'Data Analytics Dashboard',
            'Cybersecurity Framework'
        ]
        
        print("🚀 Generating projects data...")
        
        for student_id in self.new_students:
            # 60% chance of having a project
            if random.random() < 0.6:
                project_data.append({
                    'studentId': student_id,
                    'projectTitle': random.choice(project_titles),
                    'supervisorId': f"T{random.randint(1000, 9999)}",
                    'startDate': self.generate_date(2023, 2024),
                    'endDate': self.generate_date(2024, 2025),
                    'status': random.choice(['Active', 'Completed', 'Suspended'])
                })
        
        return pd.DataFrame(project_data)
    
    def generate_phd_supervision_data(self):
        """Generate PhD supervision data"""
        phd_data = []
        research_areas = [
            'Machine Learning',
            'Computer Vision',
            'Natural Language Processing',
            'Cybersecurity',
            'Data Mining',
            'Software Engineering'
        ]
        
        print("🎓 Generating PhD supervision data...")
        
        # Only 10% of students might be PhD candidates
        phd_students = random.sample(self.new_students, max(1, len(self.new_students) // 10))
        
        for student_id in phd_students:
            phd_data.append({
                'studentId': student_id,
                'researchTitle': f"Advanced Study in {random.choice(research_areas)}",
                'supervisorId': f"T{random.randint(1000, 9999)}",
                'researchArea': random.choice(research_areas),
                'startDate': self.generate_date(2022, 2023),
                'expectedCompletion': self.generate_date(2025, 2027),
                'status': random.choice(['Ongoing', 'Completed', 'Discontinued'])
            })
        
        return pd.DataFrame(phd_data)
    
    def generate_fellowships_data(self):
        """Generate fellowships data"""
        fellowship_data = []
        
        print("💼 Generating fellowships data...")
        
        # Only 15% of students might have fellowships
        fellowship_students = random.sample(self.new_students, max(1, len(self.new_students) // 7))
        
        for student_id in fellowship_students:
            fellowship_data.append({
                'studentId': student_id,
                'fellowshipType': random.choice(['Full Time', 'Part Time']),
                'amount': random.randint(15000, 35000),
                'startDate': self.generate_date(2023, 2024),
                'endDate': self.generate_date(2024, 2025),
                'status': random.choice(['Active', 'Completed', 'Terminated'])
            })
        
        return pd.DataFrame(fellowship_data)
    
    def run(self, num_students=10):
        """Generate all complement data"""
        print("🚀 Starting complement data generation...")
        
        # Create output directory
        self.output_dir.mkdir(exist_ok=True)
        print(f"✓ Created output directory: {self.output_dir}")
        
        # Generate all data types
        data_generators = {
            'students_comprehensive_reduced_stratified.csv': self.generate_students_data,
            'attendance_comprehensive_reduced_stratified.csv': self.generate_attendance_data,
            'test_scores_comprehensive_reduced_stratified.csv': self.generate_test_scores_data,
            'fee_payments_comprehensive_reduced_stratified.csv': self.generate_fee_payments_data,
            'backlogs_comprehensive_reduced_stratified.csv': self.generate_backlogs_data,
            'projects_comprehensive_reduced_stratified.csv': self.generate_projects_data,
            'phd_supervision_comprehensive_reduced_stratified.csv': self.generate_phd_supervision_data,
            'fellowships_comprehensive_reduced_stratified.csv': self.generate_fellowships_data
        }
        
        # Generate students first
        students_df = self.generate_students_data(num_students)
        students_file = self.output_dir / 'students_comprehensive_reduced_stratified.csv'
        students_df.to_csv(students_file, index=False)
        print(f"✓ Generated {students_file.name} with {len(students_df)} records")
        
        # Generate other data types
        for filename, generator_func in data_generators.items():
            if filename != 'students_comprehensive_reduced_stratified.csv':
                df = generator_func()
                output_file = self.output_dir / filename
                df.to_csv(output_file, index=False)
                print(f"✓ Generated {filename} with {len(df)} records")
        
        # Generate summary
        summary = {
            'generation_timestamp': datetime.now().isoformat(),
            'num_new_students': len(self.new_students),
            'new_student_ids': self.new_students,
            'output_directory': str(self.output_dir),
            'files_generated': list(data_generators.keys())
        }
        
        summary_file = self.output_dir / 'generation_summary.json'
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n🎉 Complement data generation completed!")
        print(f"📂 Generated files in: {self.output_dir}")
        print(f"👥 Created {len(self.new_students)} new students")
        print(f"📄 Summary saved to: {summary_file}")

def main():
    """Main function"""
    # Configuration
    original_dir = "/home/aditya/SIH/edu-pulse/csv/final"
    filtered_dir = "/home/aditya/SIH/edu-pulse/csv/new_csv"
    output_dir = "/home/aditya/SIH/edu-pulse/csv/complement_data"
    num_students = 10
    
    # Generate complement data
    generator = ComplementDataGenerator(original_dir, filtered_dir, output_dir)
    generator.run(num_students)

if __name__ == "__main__":
    main()
