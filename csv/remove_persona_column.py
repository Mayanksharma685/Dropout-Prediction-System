#!/usr/bin/env python3
"""
Script to remove 'persona' column from all CSV files in the current directory.
This script will:
1. Scan all CSV files in the directory
2. Check if they contain a 'persona' column
3. Remove the 'persona' column from those files
4. Save the updated files (creates backup with .bak extension)
"""

import pandas as pd
import os
import glob
from pathlib import Path

def remove_persona_from_csv(file_path):
    """
    Remove persona column from a CSV file if it exists.
    
    Args:
        file_path (str): Path to the CSV file
    
    Returns:
        bool: True if persona column was found and removed, False otherwise
    """
    try:
        # Read the CSV file
        print(f"Processing: {file_path}")
        df = pd.read_csv(file_path)
        
        # Check if 'persona' column exists
        if 'persona' in df.columns:
            print(f"  ✓ Found 'persona' column with {len(df)} rows")
            
            # Create backup
            backup_path = file_path + '.bak'
            df.to_csv(backup_path, index=False)
            print(f"  ✓ Created backup: {backup_path}")
            
            # Remove persona column
            df_cleaned = df.drop('persona', axis=1)
            
            # Save the cleaned file
            df_cleaned.to_csv(file_path, index=False)
            print(f"  ✓ Removed 'persona' column. New shape: {df_cleaned.shape}")
            print(f"  ✓ Saved cleaned file: {file_path}")
            
            return True
        else:
            print(f"  - No 'persona' column found")
            return False
            
    except Exception as e:
        print(f"  ✗ Error processing {file_path}: {str(e)}")
        return False

def main():
    """Main function to process all CSV files in the current directory."""
    
    # Get current directory
    current_dir = os.getcwd()
    print(f"Scanning CSV files in: {current_dir}")
    print("=" * 60)
    
    # Find all CSV files (excluding backup files)
    csv_files = glob.glob("*.csv")
    csv_files = [f for f in csv_files if not f.endswith('.bak')]
    
    if not csv_files:
        print("No CSV files found in the current directory.")
        return
    
    print(f"Found {len(csv_files)} CSV files:")
    for file in csv_files:
        print(f"  - {file}")
    print("=" * 60)
    
    # Process each CSV file
    processed_count = 0
    modified_count = 0
    
    for csv_file in csv_files:
        processed_count += 1
        if remove_persona_from_csv(csv_file):
            modified_count += 1
        print()  # Empty line for readability
    
    # Summary
    print("=" * 60)
    print("SUMMARY:")
    print(f"Total files processed: {processed_count}")
    print(f"Files with 'persona' column removed: {modified_count}")
    print(f"Files unchanged: {processed_count - modified_count}")
    
    if modified_count > 0:
        print("\nBackup files created with .bak extension")
        print("You can delete the .bak files once you verify the results")

if __name__ == "__main__":
    main()
