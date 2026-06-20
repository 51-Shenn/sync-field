import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS shift_approvals (
        id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        shift_id      TEXT NOT NULL,
        action        TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
        user_id       BIGINT NOT NULL,
        user_name     TEXT,
        responded_at  TIMESTAMPTZ DEFAULT now()
    )
""")
conn.commit()

cur.execute("ALTER TABLE shift_approvals ENABLE ROW LEVEL SECURITY")
conn.commit()

cur.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shift_approvals') THEN
            CREATE POLICY service_role_all ON shift_approvals
                FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;
    END
    $$;
""")
conn.commit()

# Insert a test record
cur.execute("""
    INSERT INTO shift_approvals (shift_id, action, user_id, user_name)
    VALUES ('test', 'approve', 123, 'test')
""")
conn.commit()

# Refresh PostgREST schema
cur.execute("SELECT pg_notify('pgrst', 'reload schema')")
conn.commit()

cur.close()
conn.close()
print("Done")
