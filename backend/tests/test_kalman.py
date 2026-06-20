import pytest
from app.math_engine.kalman import CookingKalmanFilter

def test_kalman_initialization():
    """
    Checks that the filter initializes to the first measurement and returns 0 rate.
    """
    kf = CookingKalmanFilter()
    temp, rate = kf.update(54.0, 20.0)
    assert temp == 54.0
    assert rate == 0.0
    assert kf.initialized is True

def test_kalman_smoothing_on_steps():
    """
    Verifies that the Kalman Filter successfully smooths stepped discretization noise
    and extracts a stable, positive heating rate.
    """
    kf = CookingKalmanFilter(R=1.0, Q_temp=0.001, Q_rate=0.0001)
    
    # Generate a stepped staircase profile rising from 50C to 53C over 15 steps
    # Staircase pattern: 5 steps at 50, 5 steps at 51, 5 steps at 52, 5 steps at 53
    raw_temps = [50.0] * 5 + [51.0] * 5 + [52.0] * 5 + [53.0] * 5
    dt = 20.0  # 20 second sample intervals
    
    filtered_temps = []
    rates = []
    
    for temp in raw_temps:
        f_temp, rate = kf.update(temp, dt)
        filtered_temps.append(f_temp)
        rates.append(rate)
        
    # Assertions:
    # 1. The filtered temperature should be smooth (continuous floats, not integers)
    # Check that it doesn't just equal the raw integers
    diffs_from_raw = [abs(f - r) for f, r in zip(filtered_temps[5:], raw_temps[5:])]
    assert any(d > 0.01 for d in diffs_from_raw)
    
    # 2. Check the rate of change (dT/dt) behaviour:
    # Under raw data: rate would spike to 0.05 C/s when transitioning, and be 0.0 C/s elsewhere.
    # Under Kalman: rate should smooth out and settle to a stable positive value during the rise.
    
    # Instantaneous raw rate transition at step 5 is 1C / 20s = 0.05 C/sec
    # The Kalman filtered rate should remain stable and avoid extreme spikes
    for rate in rates[5:]:
        # Filtered rate should be positive (as the cook temperature is rising)
        assert rate >= 0.0
        # It should be well below the raw spike of 0.05 C/sec
        assert rate < 0.03
        
    # Filtered temperature at the end should be close to the final raw temperature
    assert abs(filtered_temps[-1] - 53.0) < 0.5
