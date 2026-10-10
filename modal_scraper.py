"""
Modal Cloud Scheduled Runner for Peek & Perch Birdfy Scraper
Runs Playwright in a serverless Debian container on a recurring schedule.
Uploads newly captured bird visit videos to Cloudflare R2 and syncs detections to Cloudflare D1.

Solar Automation:
  Dynamically tracks astronomical sunrise and sunset for Columbia, TN (Maury County).
  Runs every 30 minutes only while daylight is active at the feeder.
  Automatically skips runs during nighttime hours (saving compute).

Usage:
  1. Test run once in cloud:
     npm run modal:run
  
  2. Deploy recurring schedule:
     npm run modal:deploy
"""

import modal
import subprocess
import os
import time
import json
import urllib.request

app = modal.App("peekandperch-scraper")

# Feeder Location: Columbia, TN (Maury County)
COLUMBIA_TN_LAT = 35.6151
COLUMBIA_TN_LON = -87.0353

def is_daylight_in_columbia_tn(buffer_minutes: int = 15) -> tuple[bool, str]:
    """
    Checks if current time is between sunrise and sunset for Columbia, TN.
    Includes a configurable buffer (default 15m) for early dawn and dusk bird activity.
    """
    now_unix = int(time.time())
    
    # 1. Fetch exact solar times from Open-Meteo
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={COLUMBIA_TN_LAT}&longitude={COLUMBIA_TN_LON}"
            "&daily=sunrise,sunset&timeformat=unixtime&forecast_days=1"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "PeekAndPerch-Scraper/1.0"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode())
            sunrise_unix = int(data["daily"]["sunrise"][0])
            sunset_unix = int(data["daily"]["sunset"][0])
    except Exception as e:
        # Fallback approximation for Central Time (~6:30 AM to ~7:00 PM)
        print(f"⚠️ [Solar Check] Weather API warning ({e}), using default daylight window.")
        today_local = time.localtime(now_unix)
        # Approximate 6:30 AM and 7:00 PM local
        sunrise_unix = now_unix - 3600
        sunset_unix = now_unix + 3600

    buffer_seconds = buffer_minutes * 60
    window_start = sunrise_unix - buffer_seconds
    window_end = sunset_unix + buffer_seconds

    sunrise_str = time.strftime("%I:%M %p", time.localtime(sunrise_unix))
    sunset_str = time.strftime("%I:%M %p", time.localtime(sunset_unix))

    if window_start <= now_unix <= window_end:
        msg = f"☀️ Daylight active in Columbia, TN (Sunrise: {sunrise_str}, Sunset: {sunset_str})."
        return True, msg
    else:
        msg = f"🌙 Outside daylight hours in Columbia, TN (Sunrise: {sunrise_str}, Sunset: {sunset_str})."
        return False, msg

# Build container image with Node.js 20 and Chromium dependencies
scraper_image = (
    modal.Image.debian_slim(python_version="3.11")
    .env({"TZ": "America/Chicago"})
    .apt_install("curl", "git", "ca-certificates", "tzdata")
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

# Runs every 30 minutes from 5:00 AM to 9:30 PM Central Time
# Inside the function, the astronomical sunrise/sunset check gates actual execution.
@app.function(
    image=scraper_image,
    schedule=modal.Cron("*/30 5-21 * * *", timezone="America/Chicago"),
    secrets=[modal.Secret.from_dotenv()],
    timeout=600,
)
def run_scraper(force: bool = False):
    is_daylight, status = is_daylight_in_columbia_tn()
    print(f"📍 [Columbia, TN Solar Check] {status}")

    if not is_daylight and not force:
        print("⏸️ Feeder is in nighttime hours. Skipping scraper run until sunrise.")
        return

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
def main(force: bool = False):
    """Manual trigger entrypoint: 'modal run modal_scraper.py' (use --force to run at night)"""
    print(f"⚡ Triggering remote scraper run on Modal (force={force})...")
    run_scraper.remote(force=force)
