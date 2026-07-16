import psycopg2
import sys

try:
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        dbname='postgres',
        user='postgres',
        password='123456789'
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname='benigan'")
    if not cur.fetchone():
        cur.execute('CREATE DATABASE benigan')
        print('[OK] Base de datos benigan creada')
    else:
        print('[OK] Base de datos benigan ya existe')
    conn.close()
except Exception as e:
    print(f'[ERROR] {e}')
    print('Verifique que PostgreSQL este corriendo y las credenciales sean correctas.')
    sys.exit(1)

print('[OK] PostgreSQL conectado correctamente')
