from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

import socket
import logging

logger = logging.getLogger("inventory_system")

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}

# Check if we are running outside Docker and pointing to the default docker host 'db'
if "db" in db_url:
    try:
        # Check if 'db' is resolvable (it is only resolvable inside the docker network)
        socket.gethostbyname("db")
    except socket.gaierror:
        # Fall back to SQLite for local development outside Docker
        logger.info("Host 'db' is not resolvable. Falling back to local SQLite database (local_inventory.db).")
        db_url = "sqlite:///./local_inventory.db"
        connect_args = {"check_same_thread": False}

# Create engine
engine = create_engine(
    db_url,
    connect_args=connect_args
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative Base class
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
