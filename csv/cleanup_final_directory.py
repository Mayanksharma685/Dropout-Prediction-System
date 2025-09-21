#!/usr/bin/env python3
"""
Script to clean up the final directory and keep only the stratified reduced files
that contain students in the range E0008 to E4976.
"""

import os
import shutil
from pathlib import Path

def cleanup_final_directory():
    """Remove all files except the stratified reduced files."""
    
    print("=" * 60)
    print("CLEANUP FINAL DIRECTORY")
    print("Keeping only files with student range E0008 to E4976")
    print("=" * 60)
    
    # Define the directory
    final_dir = Path("/home/aditya/SIH/edu-pulse/csv/final")
    
    if not final_dir.exists():
        print(f"Error: Directory not found: {final_dir}")
        return
    
    # Files to keep (stratified reduced files)
    files_to_keep = [
        "students_comprehensive_reduced_stratified.csv",
        "attendance_comprehensive_reduced_stratified.csv", 
        "backlogs_comprehensive_reduced_stratified.csv",
        "fee_payments_comprehensive_reduced_stratified.csv",
        "fellowships_comprehensive_reduced_stratified.csv",
        "phd_supervision_comprehensive_reduced_stratified.csv",
        "projects_comprehensive_reduced_stratified.csv",
        "test_scores_comprehensive_reduced_stratified.csv",
        "sample_student_structure.json"  # Keep this as it might be useful
    ]
    
    # Get all files in the directory
    all_files = [f for f in final_dir.iterdir() if f.is_file()]
    
    print(f"Found {len(all_files)} files in directory")
    print(f"Will keep {len(files_to_keep)} files")
    
    # Create a backup directory for deleted files (just in case)
    backup_dir = final_dir / "deleted_backup"
    backup_dir.mkdir(exist_ok=True)
    
    files_deleted = 0
    files_kept = 0
    
    for file_path in all_files:
        if file_path.name in files_to_keep:
            print(f"✅ KEEPING: {file_path.name}")
            files_kept += 1
        else:
            # Move to backup directory instead of deleting
            backup_path = backup_dir / file_path.name
            try:
                shutil.move(str(file_path), str(backup_path))
                print(f"🗑️  MOVED TO BACKUP: {file_path.name}")
                files_deleted += 1
            except Exception as e:
                print(f"❌ ERROR moving {file_path.name}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("CLEANUP SUMMARY")
    print("=" * 60)
    print(f"Files kept in main directory: {files_kept}")
    print(f"Files moved to backup: {files_deleted}")
    print(f"Backup location: {backup_dir}")
    
    print(f"\nRemaining files in {final_dir}:")
    remaining_files = [f for f in final_dir.iterdir() if f.is_file()]
    for file_path in remaining_files:
        file_size = file_path.stat().st_size
        print(f"  📄 {file_path.name} ({file_size:,} bytes)")
    
    print(f"\nStudent range in kept files: E0008 to E4976")
    print("✅ Cleanup completed successfully!")

def restore_from_backup():
    """Restore files from backup if needed."""
    final_dir = Path("/home/aditya/SIH/edu-pulse/csv/final")
    backup_dir = final_dir / "deleted_backup"
    
    if not backup_dir.exists():
        print("No backup directory found.")
        return
    
    print("Files in backup:")
    backup_files = list(backup_dir.iterdir())
    for i, file_path in enumerate(backup_files, 1):
        print(f"  {i}. {file_path.name}")
    
    if backup_files:
        restore = input(f"\nRestore all {len(backup_files)} files? (y/N): ").strip().lower()
        if restore == 'y':
            for file_path in backup_files:
                restore_path = final_dir / file_path.name
                shutil.move(str(file_path), str(restore_path))
                print(f"Restored: {file_path.name}")
            
            # Remove empty backup directory
            backup_dir.rmdir()
            print("✅ All files restored successfully!")

def main():
    """Main function."""
    print("Choose an option:")
    print("1. Clean up directory (keep only stratified files)")
    print("2. Restore from backup")
    print("3. Show current directory contents")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        confirm = input("\nThis will move files to backup. Continue? (y/N): ").strip().lower()
        if confirm == 'y':
            cleanup_final_directory()
        else:
            print("Operation cancelled.")
    
    elif choice == "2":
        restore_from_backup()
    
    elif choice == "3":
        final_dir = Path("/home/aditya/SIH/edu-pulse/csv/final")
        if final_dir.exists():
            files = list(final_dir.iterdir())
            print(f"\nCurrent files in {final_dir} ({len(files)} files):")
            for file_path in sorted(files):
                if file_path.is_file():
                    size = file_path.stat().st_size
                    print(f"  📄 {file_path.name} ({size:,} bytes)")
                else:
                    print(f"  📁 {file_path.name}/")
    
    else:
        print("Invalid choice.")

if __name__ == "__main__":
    main()
