#!/usr/bin/env python3
"""
Database connectivity test for Virtual Tutor Application
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os

def test_postgresql_connection():
    """Test PostgreSQL database connection and pgvector extension"""
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            dbname=os.environ.get('POSTGRES_DB', 'virtual_tutor'),
            user=os.environ.get('POSTGRES_USER', 'postgres'),
            password=os.environ.get('POSTGRES_PASSWORD', 'postgres'),
            host=os.environ.get('POSTGRES_HOST', 'localhost'),
            port=os.environ.get('POSTGRES_PORT', '5432')
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Test basic connection
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"✅ PostgreSQL Connection: {version['version']}")
        
        # Test pgvector extension
        cur.execute("SELECT * FROM pg_extension WHERE extname = 'vector';")
        vector_ext = cur.fetchone()
        if vector_ext:
            print(f"✅ pgvector Extension: Installed (version {vector_ext['extversion']})")
        else:
            print("❌ pgvector Extension: Not found")
        
        # Test tables exist
        tables = ['textbooks', 'chapters', 'text_chunks', 'students', 'knowledge_state', 'learning_progress', 'chat_history']
        cur.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = ANY(%s)
        """, (tables,))
        
        existing_tables = [row['table_name'] for row in cur.fetchall()]
        
        for table in tables:
            if table in existing_tables:
                print(f"✅ Table '{table}': Exists")
            else:
                print(f"❌ Table '{table}': Missing")
        
        # Test vector index
        cur.execute("""
            SELECT indexname FROM pg_indexes 
            WHERE tablename = 'text_chunks' AND indexname = 'text_chunks_embedding_idx'
        """)
        
        vector_index = cur.fetchone()
        if vector_index:
            print("✅ Vector Index: text_chunks_embedding_idx exists")
        else:
            print("❌ Vector Index: text_chunks_embedding_idx missing")
        
        cur.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Database Connection Failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("POSTGRESQL DATABASE CONNECTIVITY TEST")
    print("=" * 50)
    test_postgresql_connection()