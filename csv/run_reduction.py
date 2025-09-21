#!/usr/bin/env python3
"""
Simple script to run database reduction with different options.
"""

import subprocess
import sys
from pathlib import Path

def run_basic_reduction():
    """Run basic reduction to 200 students (sequential)."""
    print("Running basic reduction (200 students, sequential sampling)...")
    script_path = Path(__file__).parent / "reduce_database_size.py"
    subprocess.run([sys.executable, str(script_path)])

def run_advanced_reduction():
    """Run advanced reduction with user choices."""
    print("\nAdvanced Database Reduction Options:")
    print("1. Sequential sampling (first N students)")
    print("2. Random sampling")
    print("3. Stratified sampling (proportional by department)")
    
    choice = input("\nSelect sampling method (1-3): ").strip()
    
    size = input("Enter number of students to keep (default 200): ").strip()
    if not size:
        size = "200"
    
    script_path = Path(__file__).parent / "reduce_database_advanced.py"
    
    if choice == "1":
        cmd = [sys.executable, str(script_path), "--size", size, "--strategy", "sequential"]
    elif choice == "2":
        seed = input("Enter random seed (default 42): ").strip()
        if not seed:
            seed = "42"
        cmd = [sys.executable, str(script_path), "--size", size, "--strategy", "random", "--seed", seed]
    elif choice == "3":
        seed = input("Enter random seed (default 42): ").strip()
        if not seed:
            seed = "42"
        cmd = [sys.executable, str(script_path), "--size", size, "--strategy", "stratified", "--seed", seed]
    else:
        print("Invalid choice!")
        return
    
    subprocess.run(cmd)

def main():
    print("=" * 60)
    print("DATABASE SIZE REDUCTION TOOL")
    print("=" * 60)
    
    print("Choose reduction method:")
    print("1. Basic reduction (200 students, sequential)")
    print("2. Advanced reduction (custom options)")
    
    choice = input("\nEnter your choice (1-2): ").strip()
    
    if choice == "1":
        run_basic_reduction()
    elif choice == "2":
        run_advanced_reduction()
    else:
        print("Invalid choice!")

if __name__ == "__main__":
    main()
