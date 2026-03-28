import multiprocessing

# Network Binding
bind = "0.0.0.0:8000"

# Adjust worker threads relative to underlying hardware
# workers = multiprocessing.cpu_count() * 2 + 1
workers = 4 # Hardcoded for safety in production generic configs
worker_class = "uvicorn.workers.UvicornWorker"

# Timeout
timeout = 120
keepalive = 5

# Logging handling (output directed to docker logstreams natively)
loglevel = "info"
accesslog = "-"
errorlog = "-"
