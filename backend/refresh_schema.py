import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()
cur.execute("SELECT pg_notify('pgrst', 'reload schema')")
conn.commit()
cur.close()
conn.close()
print("Schema reload OK")
