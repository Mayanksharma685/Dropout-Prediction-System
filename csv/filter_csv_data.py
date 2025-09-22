#!/usr/bin/env python3
"""
CSV Data Filter Script for EduPulse
Filters all CSV files to contain data for only 5 unique students
"""

import pandas as pd
import os
import shutil
from pathlib import Path

def create_directory(path):
    """Create directory if it doesn't exist"""
    os.makedirs(path, exist_ok=True)
    print(f"✓ Created/verified directory: {path}")

def get_unique_students_from_main_file(students_file, num_students=5):
    """Get list of unique student IDs from the main students file"""
    try:
        df = pd.read_csv(students_file)
        unique_students = df['studentId'].unique()[:num_students]
        print(f"✓ Selected {len(unique_students)} students: {list(unique_students)}")
        return list(unique_students)
    except Exception as e:
        print(f"✗ Error reading students file: {e}")
        return []

def filter_csv_file(input_file, output_file, student_ids, student_column='studentId'):
    """Filter a CSV file to only include data for specified students"""
    try:
        # Read the CSV file
        df = pd.read_csv(input_file)
        
        # Check if the student column exists
        if student_column not in df.columns:
            print(f"⚠ Warning: Column '{student_column}' not found in {input_file}")
            print(f"  Available columns: {list(df.columns)}")
            # Copy the file as-is if no student column found
            shutil.copy2(input_file, output_file)
            return
        
        # Filter data for selected students
        filtered_df = df[df[student_column].isin(student_ids)]
        
        # Save filtered data
        filtered_df.to_csv(output_file, index=False)
        
        print(f"✓ Filtered {input_file}")
        print(f"  Original rows: {len(df)}, Filtered rows: {len(filtered_df)}")
        
    except Exception as e:
        print(f"✗ Error processing {input_file}: {e}")

def main():
    """Main function to process all CSV files"""
    
    # Define paths - use Unix paths for WSL
    base_path = Path("/home/aditya/SIH/edu-pulse/csv")
    input_dir = base_path / "final"
    output_dir = base_path / "new_csv"
    
    print("🚀 Starting CSV filtering process...")
    print(f"Input directory: {input_dir}")
    print(f"Output directory: {output_dir}")
    
    # Create output directory
    create_directory(output_dir)
    
    # Get list of CSV files
    csv_files = list(input_dir.glob("*.csv"))
    
    if not csv_files:
        print("✗ No CSV files found in the input directory!")
        return
    
    print(f"📁 Found {len(csv_files)} CSV files to process")
    
    # Find the students file to get unique student IDs
    students_file = input_dir / "students_comprehensive_reduced_stratified.csv"
    
    if not students_file.exists():
        print("✗ Students file not found! Looking for any file with 'student' in name...")
        student_files = [f for f in csv_files if 'student' in f.name.lower()]
        if student_files:
            students_file = student_files[0]
            print(f"✓ Using {students_file.name} as students file")
        else:
            print("✗ No students file found! Cannot determine student IDs.")
            return
    
    # Get unique student IDs
    student_ids = get_unique_students_from_main_file(students_file, num_students=5)
    
    if not student_ids:
        print("✗ No student IDs found! Exiting...")
        return
    
    print(f"\n📋 Processing files for students: {student_ids}")
    print("=" * 60)
    
    # Process each CSV file
    for csv_file in csv_files:
        output_file = output_dir / csv_file.name
        
        print(f"\n📄 Processing: {csv_file.name}")
        
        # Different files may have different column names for student ID
        student_column_mapping = {
            'students': 'studentId',
            'attendance': 'studentId', 
            'test_scores': 'studentId',
            'backlogs': 'studentId',
            'fee_payments': 'studentId',
            'projects': 'studentId',
            'phd_supervision': 'studentId',
            'fellowships': 'studentId'
        }
        
        # Determine the student column name
        student_column = 'studentId'  # default
        for key, col in student_column_mapping.items():
            if key in csv_file.name.lower():
                student_column = col
                break
        
        # Filter the file
        filter_csv_file(csv_file, output_file, student_ids, student_column)
    
    print("\n" + "=" * 60)
    print("🎉 CSV filtering completed successfully!")
    print(f"📂 Filtered files saved to: {output_dir}")
    
    # Summary
    print(f"\n📊 Summary:")
    print(f"  • Selected {len(student_ids)} students")
    print(f"  • Processed {len(csv_files)} CSV files")
    print(f"  • Output directory: {output_dir}")
    
    # List output files
    output_files = list(output_dir.glob("*.csv"))
    print(f"\n📁 Output files ({len(output_files)}):")
    for file in output_files:
        size_kb = file.stat().st_size / 1024
        print(f"  • {file.name} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
