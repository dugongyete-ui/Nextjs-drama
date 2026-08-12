#!/bin/bash
# Custom dev script for Z.ai sandbox
# Called by /start.sh during sandbox boot.
# Starts Next.js standalone server with env vars + watchdog in background.

echo "[DEV] Starting Next.js server..."
cd /home/z/my-project

# Load environment variables from .env.local
if [ -f ".env.local" ]; then
  echo "[DEV] Loading .env.local..."
  set -a
  source .env.local
  set +a
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "[DEV] Installing dependencies..."
  bun install 2>/dev/null || npm install
fi

# Build if standalone server doesn't exist
if [ ! -f ".next/standalone/server.js" ]; then
  echo "[DEV] Building Next.js..."
  npx next build
fi

# Export env vars needed by the server
export PORT=3000
export HOSTNAME=0.0.0.0

# Start server using double-fork daemon pattern for persistence
# (Simple nohup/background doesn't survive tini process reaping)
echo "[DEV] Launching server daemon..."
python3 -c "
import os, sys, time

# Load .env.local
env_overrides = {}
try:
    with open('/home/z/my-project/.env.local') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                env_overrides[key.strip()] = value.strip()
except: pass

# Double-fork daemon
pid = os.fork()
if pid > 0: sys.exit(0)
os.setsid()
pid2 = os.fork()
if pid2 > 0: sys.exit(0)

with open('/home/z/my-project/server.pid', 'w') as f:
    f.write(str(os.getpid()))

os.chdir('/home/z/my-project')
for k, v in env_overrides.items():
    os.environ[k] = v
os.environ['PORT'] = '3000'
os.environ['HOSTNAME'] = '0.0.0.0'

with open('/home/z/my-project/server.log', 'a') as f:
    f.write(f'[{time.strftime(\"%Y-%m-%d %H:%M:%S\")}] Server daemon started with env: {list(env_overrides.keys())}\n')

os.execvp('node', ['node', '.next/standalone/server.js'])
"

# Wait for server to be ready
echo "[DEV] Waiting for server to start..."
for i in $(seq 1 30); do
  if ss -tlnp | grep -q ":3000 "; then
    echo "[DEV] Server is listening on port 3000"
    break
  fi
  sleep 1
done

# Start watchdog daemon
echo "[DEV] Starting watchdog daemon..."
python3 -c "
import os, sys, time

env_overrides = {}
try:
    with open('/home/z/my-project/.env.local') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                env_overrides[key.strip()] = value.strip()
except: pass

pid = os.fork()
if pid > 0: sys.exit(0)
os.setsid()
pid2 = os.fork()
if pid2 > 0: sys.exit(0)

LOG = '/home/z/my-project/watchdog.log'
with open('/home/z/my-project/watchdog.pid', 'w') as f:
    f.write(str(os.getpid()))

def log(msg):
    with open(LOG, 'a') as f:
        f.write(f'[{time.strftime(\"%Y-%m-%d %H:%M:%S\")}] {msg}\n')

log('Watchdog started')

while True:
    time.sleep(10)
    try:
        with open('/home/z/my-project/server.pid', 'r') as f:
            spid = int(f.read().strip())
        os.kill(spid, 0)
    except:
        log('Server dead, restarting...')
        pid = os.fork()
        if pid == 0:
            os.setsid()
            pid2 = os.fork()
            if pid2 == 0:
                os.chdir('/home/z/my-project')
                for k, v in env_overrides.items():
                    os.environ[k] = v
                os.environ['PORT'] = '3000'
                os.environ['HOSTNAME'] = '0.0.0.0'
                os.execvp('node', ['node', '.next/standalone/server.js'])
            else:
                with open('/home/z/my-project/server.pid', 'w') as f:
                    f.write(str(pid2))
                os._exit(0)
        else:
            os.waitpid(pid, 0)
            log('Server restart initiated')
" &

echo "[DEV] Dev script completed (server + watchdog running in background)"
