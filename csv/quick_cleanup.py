#!/usr/bin/env python3
"""
Quick cleanup script to keep only the stratified reduced files (E0008 to E4976 range).
"""

import os
import shutil
from pathlib import Path

def quick_cleanup():
    """Keep only the stratified reduced files and move others to backup."""
    
    final_dir = Path("/home/aditya/SIH/edu-pulse/csv/final")
    
    # Files to keep (the ones with student range E0008 to E4976)
    keep_files = {
        "students_comprehensive_reduced_stratified.csv",
        "attendance_comprehensive_reduced_stratified.csv", 
        "backlogs_comprehensive_reduced_stratified.csv",
        "fee_payments_comprehensive_reduced_stratified.csv",
        "fellowships_comprehensive_reduced_stratified.csv",
        "phd_supervision_comprehensive_reduced_stratified.csv",
        "projects_comprehensive_reduced_stratified.csv",
        "test_scores_comprehensive_reduced_stratified.csv",
        "sample_student_structure.json"
    }
    
    # Create backup directory
    backup_dir = final_dir / "cleanup_backup"
    backup_dir.mkdir(exist_ok=True)
    
    moved_count = 0
    kept_count = 0
    
    print("🧹 Starting cleanup...")
    
    for file_path in final_dir.iterdir():
        if file_path.is_file() and file_path.name not in keep_files:
            # Move to backup
            backup_path = backup_dir / file_path.name
            shutil.move(str(file_path), str(backup_path))
            moved_count += 1
            print(f"📦 Moved: {file_path.name}")
        elif file_path.is_file():
            kept_count += 1
            print(f"✅ Kept: {file_path.name}")
    
    print(f"\n✅ Cleanup complete!")
    print(f"   📄 Files kept: {kept_count}")
    print(f"   📦 Files moved to backup: {moved_count}")
    print(f"   📁 Backup location: {backup_dir}")
    print(f"   🎯 Student range: E0008 to E4976")

if __name__ == "__main__":
    quick_cleanup()
