"""
Modal Cloud Scheduled Runner for Peek & Perch Birdfy Scraper
Runs Playwright in a serverless Debian container on a recurring schedule.
Uploads newly captured bird visit videos to Cloudflare R2 and syncs detections to Cloudflare D1.

Usage:
  1. Test run once in cloud:
     modal run modal_scraper.py
  
  2. Deploy recurring schedule:
     modal deploy modal_scraper.py
"""

import modal
import subprocess
import os

app = modal.App("peekandperch-scraper")

# Build a container image with Node.js 20 and Chromium dependencies
scraper_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("curl", "git", "ca-certificates")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
        "apt-get install -y nodejs",
    )
    .add_local_file("package.json", remote_path="/app/package.json", copy=True)
    .add_local_file("package-lock.json", remote_path="/app/package-lock.json", copy=True)
    .add_local_file("tsconfig.json", remote_path="/app/tsconfig.json", copy=True)
    .workdir("/app")
    .run_commands(
        "npm ci",
        "npx playwright install --with-deps chromium",
    )
    .add_local_dir("scripts", remote_path="/app/scripts", copy=True)
    .add_local_dir("src", remote_path="/app/src", copy=True)
    .add_local_dir("public", remote_path="/app/public", copy=True)
)

# Runs every 30 minutes from 6:00 AM to 8:30 PM Central Time (active bird feeder hours)
# Change to modal.Cron("*/30 * * * *") if you want 24/7 coverage.
@app.function(
    image=scraper_image,
    schedule=modal.Cron("*/30 6-20 * * *", timezone="America/Chicago"),
    secrets=[modal.Secret.from_dotenv()],
    timeout=600,
)
def run_scraper():
    print("🚀 [Modal] Starting autonomous Birdfy scraper...")
    
    # Run the Playwright scraper
    res = subprocess.run(
        ["npx", "tsx", "scripts/scrape-birdfy-agent.ts"],
        cwd="/app",
        env={**os.environ},
    )
    
    if res.returncode != 0:
        raise RuntimeError(f"Scraper agent failed with exit code: {res.returncode}")
    
    print("🎉 [Modal] Birdfy scraper run finished successfully!")

@app.local_entrypoint()
def main():
    """Manual trigger entrypoint: 'modal run modal_scraper.py'"""
    print("⚡ Triggering remote scraper run on Modal...")
    run_scraper.remote()

