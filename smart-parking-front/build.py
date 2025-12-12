#!/usr/bin/env python3
import os
import subprocess
import sys
import json
from pathlib import Path

def run_command(cmd, env=None):
    """Run a command and return output"""
    full_env = os.environ.copy()
    if env:
        full_env.update(env)
    
    print(f"\n{'='*60}")
    print(f"Running: {cmd}")
    print(f"{'='*60}")
    
    result = subprocess.run(cmd, shell=True, env=full_env, cwd=Path(__file__).parent)
    return result.returncode == 0

def check_output_dir():
    """Check if static export was created"""
    out_dir = Path(__file__).parent / "out"
    index_html = out_dir / "index.html"
    
    print(f"\n{'='*60}")
    print("Checking output directory...")
    print(f"{'='*60}")
    
    if not out_dir.exists():
        print(f"❌ {out_dir} does not exist")
        return False
    
    print(f"✓ {out_dir} exists")
    
    files = list(out_dir.glob("**/*"))[:20]
    if files:
        print(f"  Found {len(list(out_dir.glob('**/*')))} items in out/")
        for f in files:
            rel_path = f.relative_to(out_dir)
            size = f.stat().st_size if f.is_file() else "dir"
            print(f"    - {rel_path} ({size})")
    else:
        print(f"❌ out/ directory is empty!")
        return False
    
    if index_html.exists():
        print(f"\n✓ {index_html.name} found ({index_html.stat().st_size} bytes)")
        return True
    else:
        print(f"\n❌ {index_html.name} not found")
        return False

if __name__ == "__main__":
    os.chdir(Path(__file__).parent)
    
    # Step 1: Clean
    print("\nStep 0: Cleaning...")
    for dir_to_clean in ["out", ".next"]:
        path = Path(dir_to_clean)
        if path.exists():
            import shutil
            shutil.rmtree(path)
            print(f"  Cleaned {dir_to_clean}/")
    
    # Step 2: Prebuild
    if not run_command("node scripts/prebuild-tauri.js"):
        print("❌ Prebuild failed")
        sys.exit(1)
    
    # Step 3: Build
    env = {"NEXT_PUBLIC_TAURI_BUILD": "true"}
    if not run_command("npm run build", env):
        print("❌ Build failed")
        sys.exit(1)
    
    # Step 4: Check
    if check_output_dir():
        print("\n" + "="*60)
        print("✅ Build successful! Ready for Tauri packaging.")
        print("="*60)
        sys.exit(0)
    else:
        print("\n" + "="*60)
        print("❌ Build incomplete - no static export found")
        print("="*60)
        sys.exit(1)
