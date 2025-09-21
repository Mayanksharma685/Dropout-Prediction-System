#!/usr/bin/env python3
"""
Advanced script to reduce database size with multiple sampling strategies.
Provides options for random sampling, stratified sampling, and sequential sampling.
"""

import pandas as pd
import numpy as np
import os
import shutil
from pathlib import Path
import argparse

def backup_files(csv_dir):
    """Create backups of all CSV files before modification."""
    print("Creating backups of original files...")
    
    for file_path in csv_dir.glob("*.csv"):
        backup_path = file_path.with_suffix('.csv.backup')
        if not backup_path.exists():
            shutil.copy2(file_path, backup_path)
            print(f"  Backed up: {file_path.name}")

def get_student_sample_sequential(df_students, sample_size=200):
    """Get first N students sequentially."""
    return df_students.head(sample_size).copy()

def get_student_sample_random(df_students, sample_size=200, seed=42):
    """Get random sample of students."""
    np.random.seed(seed)
    if len(df_students) <= sample_size:
        return df_students.copy()
    return df_students.sample(n=sample_size, random_state=seed).copy()

def get_student_sample_stratified(df_students, sample_size=200, seed=42):
    """Get stratified sample based on department and semester."""
    np.random.seed(seed)
    
    # Calculate proportional sampling by department
    dept_counts = df_students['department'].value_counts()
    dept_proportions = dept_counts / len(df_students)
    
    sampled_students = []
    
    for dept, proportion in dept_proportions.items():
        dept_students = df_students[df_students['department'] == dept]
        dept_sample_size = max(1, int(sample_size * proportion))
        
        # Don't sample more than available
        dept_sample_size = min(dept_sample_size, len(dept_students))
        
        if len(dept_students) <= dept_sample_size:
            dept_sample = dept_students.copy()
        else:
            dept_sample = dept_students.sample(n=dept_sample_size, random_state=seed)
        
        sampled_students.append(dept_sample)
    
    result = pd.concat(sampled_students, ignore_index=True)
    
    # If we have more than needed, randomly sample down
    if len(result) > sample_size:
        result = result.sample(n=sample_size, random_state=seed)
    
    return result

def get_student_sample(students_file, sample_size=200, strategy='sequential', seed=42):
    """Get a sample of students using specified strategy."""
    print(f"Reading students file: {students_file}")
    
    # Read students CSV
    df_students = pd.read_csv(students_file)
    print(f"  Total students in original file: {len(df_students)}")
    
    # Apply sampling strategy
    if strategy == 'sequential':
        sample_students = get_student_sample_sequential(df_students, sample_size)
        print(f"  Using sequential sampling (first {sample_size} students)")
    elif strategy == 'random':
        sample_students = get_student_sample_random(df_students, sample_size, seed)
        print(f"  Using random sampling (seed: {seed})")
    elif strategy == 'stratified':
        sample_students = get_student_sample_stratified(df_students, sample_size, seed)
        print(f"  Using stratified sampling by department (seed: {seed})")
    else:
        raise ValueError(f"Unknown strategy: {strategy}")
    
    student_ids = set(sample_students['studentId'].tolist())
    print(f"  Selected {len(student_ids)} students for sample")
    
    # Save reduced students file
    output_path = students_file.parent / f"students_comprehensive_reduced_{strategy}.csv"
    sample_students.to_csv(output_path, index=False)
    print(f"  Saved reduced students file: {output_path}")
    
    return student_ids, sample_students

def reduce_csv_file(file_path, student_ids, student_id_column='studentId', strategy='sequential'):
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
        output_path = file_path.parent / f"{file_path.stem}_reduced_{strategy}.csv"
        df_filtered.to_csv(output_path, index=False)
        
        print(f"  Original size: {original_size:,} rows")
        print(f"  Reduced size: {reduced_size:,} rows")
        print(f"  Reduction: {((original_size - reduced_size) / original_size * 100):.1f}%")
        print(f"  Saved: {output_path}")
        
    except Exception as e:
        print(f"  Error processing {file_path.name}: {str(e)}")

def analyze_sample_distribution(sample_students):
    """Analyze and display the distribution of the sample."""
    print("\nSAMPLE ANALYSIS")
    print("-" * 40)
    
    # Department distribution
    dept_counts = sample_students['department'].value_counts()
    print(f"Department distribution:")
    for dept, count in dept_counts.items():
        percentage = (count / len(sample_students)) * 100
        print(f"  {dept}: {count} students ({percentage:.1f}%)")
    
    # Semester distribution  
    sem_counts = sample_students['currentSemester'].value_counts().sort_index()
    print(f"\nSemester distribution:")
    for sem, count in sem_counts.items():
        percentage = (count / len(sample_students)) * 100
        print(f"  Semester {sem}: {count} students ({percentage:.1f}%)")
    
    # Batch distribution
    if 'batchId' in sample_students.columns:
        batch_counts = sample_students['batchId'].value_counts().head(10)
        print(f"\nTop 10 Batch distribution:")
        for batch, count in batch_counts.items():
            print(f"  {batch}: {count} students")

def main():
    """Main function to reduce database size."""
    parser = argparse.ArgumentParser(description='Reduce database size to specified number of students')
    parser.add_argument('--size', type=int, default=200, help='Number of students to keep (default: 200)')
    parser.add_argument('--strategy', choices=['sequential', 'random', 'stratified'], 
                       default='sequential', help='Sampling strategy (default: sequential)')
    parser.add_argument('--seed', type=int, default=42, help='Random seed for reproducibility (default: 42)')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("ADVANCED DATABASE SIZE REDUCTION SCRIPT")
    print(f"Reducing to {args.size} students using {args.strategy} sampling")
    if args.strategy in ['random', 'stratified']:
        print(f"Random seed: {args.seed}")
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
    
    student_ids, sample_students = get_student_sample(
        students_file, 
        sample_size=args.size, 
        strategy=args.strategy, 
        seed=args.seed
    )
    
    # Analyze sample distribution
    analyze_sample_distribution(sample_students)
    
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
            reduce_csv_file(file_path, student_ids, student_col, args.strategy)
        else:
            print(f"Warning: File not found: {filename}")
    
    # Generate summary report
    print("\n" + "=" * 60)
    print("REDUCTION SUMMARY")
    print("=" * 60)
    
    print(f"Sampling strategy: {args.strategy}")
    print(f"Selected students: {len(student_ids)}")
    print(f"Student ID range: {min(student_ids)} to {max(student_ids)}")
    
    print(f"\nAll reduced files saved with '_reduced_{args.strategy}' suffix")
    print(f"Original files backed up with '.backup' extension")
    print(f"Files location: {csv_dir}")
    
    print("\n" + "=" * 60)
    print("REDUCTION COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
