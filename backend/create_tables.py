from database import Base, engine
from models import RequirementRecord


Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")