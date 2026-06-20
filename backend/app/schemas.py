from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# FireBoard Configuration Integration
class FireBoardCredentials(BaseModel):
    username: str
    password: str

# Cook Session Configuration
class CookSessionBase(BaseModel):
    device_id: str = Field(..., description="FireBoard physical device ID")
    device_name: Optional[str] = Field(None, description="FireBoard device name")
    meat_type: str = Field(..., description="Type of protein: beef, pork, poultry, fish, lamb")
    cut_type: str = Field(..., description="Meat cut: e.g. Ribeye, Brisket, Pork Shoulder")
    cooker_type: str = Field(..., description="Cooker equipment type: e.g. Kamado, Pellet Smoker, Oven")
    status: str = Field("bare", description="Cook state status: e.g. bare, wrapped")
    weight_kg: float = Field(..., description="Meat starting weight in kilograms", gt=0)
    thickness_mm: float = Field(..., description="Meat thickness in millimeters", gt=0)
    target_temp_c: float = Field(..., description="Target completion internal temperature in Celsius", gt=0)

class CookSessionCreate(CookSessionBase):
    pass

class CookSessionResponse(CookSessionBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Telemetry Updates
class ChannelMapping(BaseModel):
    core_channel: int = Field(..., description="Channel number designated for meat internal core temperature")
    ambient_channel: int = Field(..., description="Channel number designated for smoker ambient temperature")

class TelemetryPayload(BaseModel):
    channel: int
    core_temp_raw: float
    core_temp_filtered: Optional[float] = None
    ambient_temp: Optional[float] = None
    heating_rate: Optional[float] = None
    stall_detected: bool = False
    eta_seconds: Optional[int] = None
    confidence: str = "low"
    timestamp: datetime
