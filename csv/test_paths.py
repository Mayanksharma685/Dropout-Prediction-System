#!/usr/bin/env python3
"""
Test script to verify paths and file access
"""

import os
from pathlib import Path

def test_paths():
    """Test different path formats"""
    
    print("🔍 Testing path access...")
    
    # Test different path formats
    paths_to_test = [
        "/home/aditya/SIH/edu-pulse/csv/final",
        "./final",
        "final"
    ]
    
    for path in paths_to_test:
        print(f"\nTesting path: {path}")
        path_obj = Path(path)
        
        if path_obj.exists():
            print(f"✓ Path exists: {path_obj.absolute()}")
            
            # List CSV files
            csv_files = list(path_obj.glob("*.csv"))
            print(f"✓ Found {len(csv_files)} CSV files:")
            for csv_file in csv_files[:3]:  # Show first 3
                print(f"  - {csv_file.name}")
            if len(csv_files) > 3:
                print(f"  ... and {len(csv_files) - 3} more")
            break
        else:
            print(f"✗ Path does not exist")
    
    # Test current working directory
    print(f"\n📁 Current working directory: {os.getcwd()}")
    
    # List files in current directory
    current_files = list(Path(".").glob("*"))
    print(f"📄 Files in current directory:")
    for file in current_files[:5]:
        print(f"  - {file.name}")

if __name__ == "__main__":
    test_paths()
