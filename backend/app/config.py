from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql://postgres:secure_inventory_pass@db:5432/inventory_db",
        validation_alias="DATABASE_URL"
    )
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:80,http://127.0.0.1:5173",
        validation_alias="CORS_ORIGINS"
    )
    SECRET_KEY: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        validation_alias="SECRET_KEY"
    )
    ALGORITHM: str = Field(
        default="HS256",
        validation_alias="ALGORITHM"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=1440,
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    GOOGLE_CLIENT_ID: str = Field(
        default="",
        validation_alias="GOOGLE_CLIENT_ID"
    )
    SMTP_HOST: str = Field(
        default="smtp.gmail.com",
        validation_alias="SMTP_HOST"
    )
    SMTP_PORT: int = Field(
        default=587,
        validation_alias="SMTP_PORT"
    )
    SMTP_USERNAME: str = Field(
        default="",
        validation_alias="SMTP_USERNAME"
    )
    SMTP_PASSWORD: str = Field(
        default="",
        validation_alias="SMTP_PASSWORD"
    )
    SMTP_FROM_EMAIL: str = Field(
        default="noreply@etharastock.com",
        validation_alias="SMTP_FROM_EMAIL"
    )
    SMTP_FROM_NAME: str = Field(
        default="Ethara Stock Manager",
        validation_alias="SMTP_FROM_NAME"
    )
    SMTP_TLS: bool = Field(
        default=True,
        validation_alias="SMTP_TLS"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
