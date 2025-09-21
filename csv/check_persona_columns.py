#!/usr/bin/env python3
"""
Script to check which CSV files contain 'persona' column without modifying them.
Run this first to see what will be affected.
"""

import pandas as pd
import os
import glob

def check_persona_in_csv(file_path):
    """
    Check if a CSV file contains a 'persona' column.
    
    Args:
        file_path (str): Path to the CSV file
    
    Returns:
        dict: Information about the file and persona column
    """
    try:
        # Read just the header to check columns
        df = pd.read_csv(file_path, nrows=0)  # Read only header
        
        has_persona = 'persona' in df.columns
        
        if has_persona:
            # Get full file info
            df_full = pd.read_csv(file_path)
            return {
                'file': file_path,
                'has_persona': True,
                'total_columns': len(df_full.columns),
                'total_rows': len(df_full),
                'columns': list(df_full.columns),
                'persona_values': df_full['persona'].value_counts().to_dict() if 'persona' in df_full.columns else {}
            }
        else:
            return {
                'file': file_path,
                'has_persona': False,
                'total_columns': len(df.columns),
                'columns': list(df.columns)
            }
            
    except Exception as e:
        return {
            'file': file_path,
            'has_persona': False,
            'error': str(e)
        }

def main():
    """Main function to check all CSV files."""
    
    current_dir = os.getcwd()
    print(f"Checking CSV files in: {current_dir}")
    print("=" * 80)
    
    # Find all CSV files (excluding backup files)
    csv_files = glob.glob("*.csv")
    csv_files = [f for f in csv_files if not f.endswith('.bak')]
    
    if not csv_files:
        print("No CSV files found in the current directory.")
        return
    
    files_with_persona = []
    files_without_persona = []
    files_with_errors = []
    
    for csv_file in csv_files:
        result = check_persona_in_csv(csv_file)
        
        if 'error' in result:
            files_with_errors.append(result)
        elif result['has_persona']:
            files_with_persona.append(result)
        else:
            files_without_persona.append(result)
    
    # Display results
    print(f"ANALYSIS RESULTS:")
    print(f"Total CSV files found: {len(csv_files)}")
    print(f"Files WITH 'persona' column: {len(files_with_persona)}")
    print(f"Files WITHOUT 'persona' column: {len(files_without_persona)}")
    print(f"Files with errors: {len(files_with_errors)}")
    print("=" * 80)
    
    # Show files WITH persona column
    if files_with_persona:
        print("\n📋 FILES WITH 'PERSONA' COLUMN (will be modified):")
        print("-" * 60)
        for file_info in files_with_persona:
            print(f"📄 {file_info['file']}")
            print(f"   Rows: {file_info['total_rows']:,}")
            print(f"   Columns: {file_info['total_columns']} -> {file_info['total_columns']-1} (after removing persona)")
            print(f"   All columns: {', '.join(file_info['columns'])}")
            if file_info['persona_values']:
                print(f"   Persona values: {file_info['persona_values']}")
            print()
    
    # Show files WITHOUT persona column
    if files_without_persona:
        print("\n✅ FILES WITHOUT 'PERSONA' COLUMN (will be unchanged):")
        print("-" * 60)
        for file_info in files_without_persona:
            print(f"📄 {file_info['file']}")
            print(f"   Columns ({file_info['total_columns']}): {', '.join(file_info['columns'])}")
            print()
    
    # Show files with errors
    if files_with_errors:
        print("\n❌ FILES WITH ERRORS:")
        print("-" * 60)
        for file_info in files_with_errors:
            print(f"📄 {file_info['file']}")
            print(f"   Error: {file_info['error']}")
            print()
    
    print("=" * 80)
    if files_with_persona:
        print(f"✨ Ready to remove 'persona' column from {len(files_with_persona)} files")
        print("💡 Run 'python remove_persona_column.py' to proceed with the changes")
    else:
        print("✨ No files need modification - no 'persona' columns found!")

if __name__ == "__main__":
    main()
