from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from config import settings

# echo=False keeps logs clean — flip to True if you want to see every SQL query being fired
engine = create_async_engine(settings.database_url, echo=False)

# session factory — call this to get a new db session
# expire_on_commit=False means model fields are still readable after a commit without re-querying
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# all models inherit from Base so SQLAlchemy knows about their tables
class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    # used as a FastAPI dependency via Depends(get_db)
    # opens a session, hands it to the route handler, then closes it when the request is done
    # the "async with" handles cleanup even if something throws an error
    async with AsyncSessionLocal() as session:
        yield session


async def create_tables():
    # creates tables on startup, use Alembic migrations in prod instead
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
