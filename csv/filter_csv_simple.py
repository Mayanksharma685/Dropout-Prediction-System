#!/usr/bin/env python3
"""
Simple CSV Data Filter Script for EduPulse
Uses relative paths for better WSL compatibility
"""

import pandas as pd
import os
from pathlib import Path

def main():
    """Main function to process all CSV files"""
    
    print("🚀 Starting CSV filtering process...")
    
    # Use relative paths
    input_dir = Path("final")
    output_dir = Path("new_csv")
    
    print(f"Input directory: {input_dir.absolute()}")
    print(f"Output directory: {output_dir.absolute()}")
    
    # Check if input directory exists
    if not input_dir.exists():
        print(f"✗ Input directory does not exist: {input_dir.absolute()}")
        print("📁 Current directory contents:")
        for item in Path(".").iterdir():
            print(f"  - {item.name}")
        return
    
    # Create output directory
    output_dir.mkdir(exist_ok=True)
    print(f"✓ Created/verified directory: {output_dir.absolute()}")
    
    # Get list of CSV files
    csv_files = list(input_dir.glob("*.csv"))
    
    if not csv_files:
        print("✗ No CSV files found in the input directory!")
        print("📁 Contents of input directory:")
        for item in input_dir.iterdir():
            print(f"  - {item.name}")
        return
    
    print(f"📁 Found {len(csv_files)} CSV files to process")
    
    # Find the students file to get unique student IDs
    students_file = None
    for csv_file in csv_files:
        if 'student' in csv_file.name.lower():
            students_file = csv_file
            break
    
    if not students_file:
        print("✗ No students file found!")
        return
    
    # Get 5 unique student IDs
    try:
        df_students = pd.read_csv(students_file)
        if 'studentId' not in df_students.columns:
            print(f"✗ studentId column not found in {students_file.name}")
            print(f"Available columns: {list(df_students.columns)}")
            return
        
        student_ids = df_students['studentId'].unique()[:5].tolist()
        print(f"✓ Selected {len(student_ids)} students: {student_ids}")
        
    except Exception as e:
        print(f"✗ Error reading students file: {e}")
        return
    
    print("\n" + "=" * 60)
    
    # Process each CSV file
    for csv_file in csv_files:
        output_file = output_dir / csv_file.name
        
        print(f"\n📄 Processing: {csv_file.name}")
        
        try:
            # Read the CSV file
            df = pd.read_csv(csv_file)
            original_rows = len(df)
            
            # Check if studentId column exists
            if 'studentId' not in df.columns:
                print(f"⚠ Warning: studentId column not found, copying file as-is")
                print(f"  Available columns: {list(df.columns)}")
                # Copy file as-is
                df.to_csv(output_file, index=False)
                print(f"✓ Copied {csv_file.name} (no filtering applied)")
                continue
            
            # Filter data for selected students
            filtered_df = df[df['studentId'].isin(student_ids)]
            filtered_rows = len(filtered_df)
            
            # Save filtered data
            filtered_df.to_csv(output_file, index=False)
            
            print(f"✓ Filtered {csv_file.name}")
            print(f"  Original rows: {original_rows}, Filtered rows: {filtered_rows}")
            
            # Show student distribution
            if filtered_rows > 0:
                student_counts = filtered_df['studentId'].value_counts()
                print(f"  Student distribution: {dict(student_counts)}")
            
        except Exception as e:
            print(f"✗ Error processing {csv_file.name}: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 CSV filtering completed!")
    print(f"📂 Filtered files saved to: {output_dir.absolute()}")
    
    # Show summary
    output_files = list(output_dir.glob("*.csv"))
    print(f"\n📊 Summary:")
    print(f"  • Selected {len(student_ids)} students")
    print(f"  • Processed {len(csv_files)} CSV files")
    print(f"  • Created {len(output_files)} output files")
    
    print(f"\n📁 Output files:")
    for file in output_files:
        size_kb = file.stat().st_size / 1024
        print(f"  • {file.name} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
