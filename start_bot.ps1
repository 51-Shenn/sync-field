$env:PYTHONPATH = "D:\Projects\imagine-hack;D:\Projects\imagine-hack\backend"
Set-Location "D:\Projects\imagine-hack\backend"
python -u -m integrations.telegram.bot > "D:\Projects\imagine-hack\bot_out.log" 2>&1
