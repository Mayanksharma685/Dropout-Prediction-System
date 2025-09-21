#!/usr/bin/env python3
"""
Script to reduce the database size to 200 students across all CSV files.
This script maintains referential integrity by selecting the first 200 students
and filtering all related data accordingly.
"""

import pandas as pd
import os
import shutil
from pathlib import Path

def backup_files(csv_dir):
    """Create backups of all CSV files before modification."""
    print("Creating backups of original files...")
    
    for file_path in csv_dir.glob("*.csv"):
        backup_path = file_path.with_suffix('.csv.backup')
        if not backup_path.exists():
            shutil.copy2(file_path, backup_path)
            print(f"  Backed up: {file_path.name}")

def get_student_sample(students_file, sample_size=200):
    """Get a sample of students and return their IDs."""
    print(f"Reading students file: {students_file}")
    
    # Read students CSV
    df_students = pd.read_csv(students_file)
    print(f"  Total students in original file: {len(df_students)}")
    
    # Take first 200 students (or all if less than 200)
    sample_students = df_students.head(sample_size).copy()
    student_ids = set(sample_students['studentId'].tolist())
    
    print(f"  Selected {len(student_ids)} students for sample")
    
    # Save reduced students file
    output_path = students_file.parent / f"students_comprehensive_reduced.csv"
    sample_students.to_csv(output_path, index=False)
    print(f"  Saved reduced students file: {output_path}")
    
    return student_ids, sample_students

def reduce_csv_file(file_path, student_ids, student_id_column='studentId'):
    """Reduce a CSV file to only include data for selected students."""
    print(f"Processing: {file_path.name}")
    
    try:
        # Read the CSV file
        df = pd.read_csv(file_path)
        original_size = len(df)
        
        # Check if the student ID column exists
        if student_id_column not in df.columns:
            print(f"  Warning: {student_id_column} column not found in {file_path.name}")
            print(f"  Available columns: {list(df.columns)}")
            return
        
        # Filter data for selected students only
        df_filtered = df[df[student_id_column].isin(student_ids)].copy()
        reduced_size = len(df_filtered)
        
        # Save the reduced file
        output_path = file_path.parent / f"{file_path.stem}_reduced.csv"
        df_filtered.to_csv(output_path, index=False)
        
        print(f"  Original size: {original_size:,} rows")
        print(f"  Reduced size: {reduced_size:,} rows")
        print(f"  Reduction: {((original_size - reduced_size) / original_size * 100):.1f}%")
        print(f"  Saved: {output_path}")
        
    except Exception as e:
        print(f"  Error processing {file_path.name}: {str(e)}")

def main():
    """Main function to reduce database size."""
    print("=" * 60)
    print("DATABASE SIZE REDUCTION SCRIPT")
    print("Reducing to 200 students across all CSV files")
    print("=" * 60)
    
    # Define paths
    csv_dir = Path("/home/aditya/SIH/edu-pulse/csv/final")
    
    if not csv_dir.exists():
        print(f"Error: Directory not found: {csv_dir}")
        return
    
    # Create backups
    backup_files(csv_dir)
    
    # Get student sample from students file
    students_file = csv_dir / "students_comprehensive.csv"
    if not students_file.exists():
        print(f"Error: Students file not found: {students_file}")
        return
    
    student_ids, sample_students = get_student_sample(students_file, sample_size=200)
    
    # Define file mappings (filename -> student_id_column)
    file_mappings = {
        "attendance_comprehensive.csv": "studentId",
        "backlogs_comprehensive.csv": "studentId", 
        "fee_payments_comprehensive.csv": "studentId",
        "test_scores_comprehensive.csv": "studentId",
        "projects_comprehensive.csv": "studentId",
        "phd_supervision_comprehensive.csv": "studentId",
        "fellowships_comprehensive.csv": "studentId"
    }
    
    print(f"\nProcessing related CSV files...")
    print("-" * 40)
    
    # Process each related CSV file
    for filename, student_col in file_mappings.items():
        file_path = csv_dir / filename
        if file_path.exists():
            reduce_csv_file(file_path, student_ids, student_col)
        else:
            print(f"Warning: File not found: {filename}")
    
    # Generate summary report
    print("\n" + "=" * 60)
    print("REDUCTION SUMMARY")
    print("=" * 60)
    
    print(f"Selected students: {len(student_ids)}")
    print(f"Student ID range: {min(student_ids)} to {max(student_ids)}")
    
    # Show department distribution
    dept_counts = sample_students['department'].value_counts()
    print(f"\nDepartment distribution in sample:")
    for dept, count in dept_counts.items():
        print(f"  {dept}: {count} students")
    
    # Show semester distribution  
    sem_counts = sample_students['currentSemester'].value_counts().sort_index()
    print(f"\nSemester distribution in sample:")
    for sem, count in sem_counts.items():
        print(f"  Semester {sem}: {count} students")
    
    print(f"\nAll reduced files saved with '_reduced' suffix")
    print(f"Original files backed up with '.backup' extension")
    print(f"Files location: {csv_dir}")
    
    print("\n" + "=" * 60)
    print("REDUCTION COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
