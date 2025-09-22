#!/usr/bin/env python3
"""
Advanced CSV Data Filter Script for EduPulse
Filters all CSV files to contain data for only 5 unique students with advanced features
"""

import pandas as pd
import os
import json
from pathlib import Path
from datetime import datetime

class CSVFilter:
    def __init__(self, input_dir, output_dir, num_students=5):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.num_students = num_students
        self.student_ids = []
        self.processing_log = []
        
    def log(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        print(log_entry)
        self.processing_log.append(log_entry)
    
    def create_output_directory(self):
        """Create output directory and subdirectories"""
        try:
            os.makedirs(self.output_dir, exist_ok=True)
            self.log(f"Created/verified output directory: {self.output_dir}")
            return True
        except Exception as e:
            self.log(f"Error creating output directory: {e}", "ERROR")
            return False
    
    def get_student_ids(self):
        """Extract student IDs from the students file"""
        # Look for students file
        students_files = [
            "students_comprehensive_reduced_stratified.csv",
            "students.csv"
        ]
        
        students_file = None
        for filename in students_files:
            potential_file = self.input_dir / filename
            if potential_file.exists():
                students_file = potential_file
                break
        
        if not students_file:
            # Look for any file with 'student' in the name
            student_files = list(self.input_dir.glob("*student*.csv"))
            if student_files:
                students_file = student_files[0]
        
        if not students_file:
            self.log("No students file found!", "ERROR")
            return False
        
        try:
            df = pd.read_csv(students_file)
            if 'studentId' not in df.columns:
                self.log(f"studentId column not found in {students_file.name}", "ERROR")
                self.log(f"Available columns: {list(df.columns)}", "INFO")
                return False
            
            self.student_ids = df['studentId'].unique()[:self.num_students].tolist()
            self.log(f"Selected {len(self.student_ids)} students from {students_file.name}")
            self.log(f"Student IDs: {self.student_ids}")
            return True
            
        except Exception as e:
            self.log(f"Error reading students file: {e}", "ERROR")
            return False
    
    def analyze_csv_structure(self, csv_file):
        """Analyze CSV file structure to determine student column"""
        try:
            # Read just the first few rows to check structure
            df_sample = pd.read_csv(csv_file, nrows=5)
            columns = df_sample.columns.tolist()
            
            # Common student ID column names
            student_columns = ['studentId', 'student_id', 'StudentID', 'id']
            
            for col in student_columns:
                if col in columns:
                    return col, columns
            
            # If no standard column found, return None
            return None, columns
            
        except Exception as e:
            self.log(f"Error analyzing {csv_file.name}: {e}", "ERROR")
            return None, []
    
    def filter_csv_file(self, csv_file):
        """Filter a single CSV file"""
        output_file = self.output_dir / csv_file.name
        
        try:
            # Analyze file structure
            student_column, all_columns = self.analyze_csv_structure(csv_file)
            
            if student_column is None:
                self.log(f"No student column found in {csv_file.name}, copying as-is", "WARNING")
                self.log(f"Available columns: {all_columns}", "INFO")
                # Copy file as-is
                import shutil
                shutil.copy2(csv_file, output_file)
                return True
            
            # Read and filter the file
            df = pd.read_csv(csv_file)
            original_rows = len(df)
            
            # Filter for selected students
            filtered_df = df[df[student_column].isin(self.student_ids)]
            filtered_rows = len(filtered_df)
            
            # Save filtered data
            filtered_df.to_csv(output_file, index=False)
            
            self.log(f"Processed {csv_file.name}: {original_rows} → {filtered_rows} rows")
            
            # Log student distribution
            if filtered_rows > 0:
                student_counts = filtered_df[student_column].value_counts()
                self.log(f"Student distribution: {dict(student_counts)}")
            
            return True
            
        except Exception as e:
            self.log(f"Error processing {csv_file.name}: {e}", "ERROR")
            return False
    
    def generate_summary_report(self):
        """Generate a summary report of the filtering process"""
        summary = {
            "processing_timestamp": datetime.now().isoformat(),
            "input_directory": str(self.input_dir),
            "output_directory": str(self.output_dir),
            "selected_students": self.student_ids,
            "num_students": len(self.student_ids),
            "files_processed": [],
            "processing_log": self.processing_log
        }
        
        # Get file information
        output_files = list(self.output_dir.glob("*.csv"))
        for file in output_files:
            try:
                df = pd.read_csv(file)
                file_info = {
                    "filename": file.name,
                    "rows": len(df),
                    "columns": list(df.columns),
                    "size_kb": round(file.stat().st_size / 1024, 1)
                }
                summary["files_processed"].append(file_info)
            except:
                pass
        
        # Save summary report
        summary_file = self.output_dir / "filtering_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        self.log(f"Summary report saved to: {summary_file}")
        return summary
    
    def run(self):
        """Run the complete filtering process"""
        self.log("🚀 Starting advanced CSV filtering process")
        
        # Step 1: Create output directory
        if not self.create_output_directory():
            return False
        
        # Step 2: Get student IDs
        if not self.get_student_ids():
            return False
        
        # Step 3: Get list of CSV files
        csv_files = list(self.input_dir.glob("*.csv"))
        if not csv_files:
            self.log("No CSV files found in input directory!", "ERROR")
            return False
        
        self.log(f"Found {len(csv_files)} CSV files to process")
        
        # Step 4: Process each file
        success_count = 0
        for csv_file in csv_files:
            self.log(f"Processing: {csv_file.name}")
            if self.filter_csv_file(csv_file):
                success_count += 1
        
        # Step 5: Generate summary
        summary = self.generate_summary_report()
        
        # Final log
        self.log("=" * 60)
        self.log(f"🎉 Filtering completed!")
        self.log(f"Successfully processed: {success_count}/{len(csv_files)} files")
        self.log(f"Selected students: {len(self.student_ids)}")
        self.log(f"Output directory: {self.output_dir}")
        
        return True

def main():
    """Main function"""
    # Configuration - use Unix paths for WSL
    base_path = "/home/aditya/SIH/edu-pulse/csv"
    input_dir = f"{base_path}/final"
    output_dir = f"{base_path}/new_csv"
    num_students = 5
    
    # Create and run filter
    csv_filter = CSVFilter(input_dir, output_dir, num_students)
    success = csv_filter.run()
    
    if success:
        print("\n✅ Process completed successfully!")
        print(f"📂 Check the output directory: {output_dir}")
        print(f"📄 See filtering_summary.json for detailed report")
    else:
        print("\n❌ Process failed! Check the error messages above.")

if __name__ == "__main__":
    main()
