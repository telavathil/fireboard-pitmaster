import pytest
import numpy as np
from app.math_engine.kalman import CookingKalmanFilter
from app.math_engine.solver import CookingSolver

def generate_physical_cook_curve(
    thickness_mm: float,
    weight_kg: float,
    cooker_type: str,
    target_temp_c: float,
    ambient_temp: float,
    meat_type: str = "beef",
    start_temp: float = 4.0
):
    """
    Generates a temperature profile by running the Crank-Nicolson solver
    forward step-by-step from a uniform starting temperature.
    """
    solver = CookingSolver(
        thickness_mm=thickness_mm,
        weight_kg=weight_kg,
        cooker_type=cooker_type,
        target_temp_c=target_temp_c,
        meat_type=meat_type
    )
    
    # Uniform start temperature profile
    profile = np.ones(solver.N + 1) * start_temp
    
    sigma = (solver.D * solver.dt) / (2.0 * (solver.dx ** 2))
    gamma = (solver.h * solver.dx) / solver.k
    
    times = [0.0]
    temps = [start_temp]
    
    current_time = 0.0
    remaining_stall = solver.t_stall_budget
    T_stall = 70.0
    
    while profile[0] < target_temp_c and current_time < 72000.0:  # Cap at 20 hours
        # Check uncapped step
        next_profile = solver._step_crank_nicolson(profile, ambient_temp, sigma, gamma, capped=False)
        
        if remaining_stall > 0.0 and next_profile[solver.N] > T_stall:
            # Cap surface at stall temperature
            next_profile = solver._step_crank_nicolson(profile, T_stall, sigma, gamma, capped=True)
            remaining_stall = max(0.0, remaining_stall - solver.dt)
            
        profile = next_profile
        current_time += solver.dt
        times.append(current_time)
        temps.append(profile[0])
        
    return times, temps

def run_cook_accuracy_validation(
    thickness_mm: float,
    weight_kg: float,
    cooker_type: str,
    target_temp_c: float,
    ambient_temp: float,
    meat_type: str = "beef"
):
    """
    Simulates a cook using the Kalman Filter and CookingSolver, and checks
    if the predicted remaining cook time (ETA) satisfies our staged tolerance levels.
    """
    times, temps = generate_physical_cook_curve(
        thickness_mm=thickness_mm,
        weight_kg=weight_kg,
        cooker_type=cooker_type,
        target_temp_c=target_temp_c,
        ambient_temp=ambient_temp,
        meat_type=meat_type
    )
    
    total_duration = times[-1]
    kf = CookingKalmanFilter()
    solver = CookingSolver(
        thickness_mm=thickness_mm,
        weight_kg=weight_kg,
        cooker_type=cooker_type,
        target_temp_c=target_temp_c,
        meat_type=meat_type
    )
    
    last_ts = 0.0
    errors = []
    
    # Warmup filter for 8 minutes
    warmup_duration = 480.0
    
    for i, t in enumerate(times):
        temp_val = temps[i]
        dt = t - last_ts
        
        # Update Kalman Filter
        core_filtered, heating_rate_c_per_sec = kf.update(temp_val, dt)
        last_ts = t
        
        if t < warmup_duration:
            continue
            
        # Simulate predictions using the current filtered values
        eta_pred, _ = solver.simulate_cook(
            initial_core=core_filtered,
            ambient_temp=ambient_temp,
            heating_rate_c_per_sec=heating_rate_c_per_sec
        )
        
        if eta_pred == -1:
            errors.append((t, float('inf'), "fail"))
            continue
            
        eta_actual = total_duration - t
        error_seconds = abs(eta_pred - eta_actual)
        
        # Percentage error
        pct_error = error_seconds / eta_actual if eta_actual > 0 else 0.0
        
        # Determine cook stage based on core temperature ranges (physical cook phases)
        if core_filtered < 65.0:
            stage = "pre-stall (early)"
            passed = pct_error <= 0.35
        elif core_filtered < 75.0:
            stage = "stall (middle)"
            passed = pct_error <= 0.15
        else:
            stage = "post-stall (late)"
            passed = (pct_error <= 0.05) or (error_seconds <= 600.0)
            
        errors.append((t, pct_error, error_seconds, stage, passed))
        
    return errors

def test_model_accuracy_pellet_standard_cook():
    """
    Validates model ETA accuracy for a standard pellet cooker session
    (e.g., pork butt: 80mm thickness, 2.5kg weight, 93C target, pork profile).
    """
    errors = run_cook_accuracy_validation(
        thickness_mm=80.0,
        weight_kg=2.5,
        cooker_type="pellet",
        target_temp_c=93.0,
        ambient_temp=110.0,
        meat_type="pork"
    )
    
    failed_steps = [item for item in errors if not item[-1]]
    if failed_steps:
        msg = f"Failed steps count: {len(failed_steps)} out of {len(errors)}\n"
        for item in failed_steps[:5]:
            msg += f"Time: {item[0]}s, Pct Error: {item[1]:.2%}, Abs Error: {item[2]}s, Stage: {item[3]}\n"
        assert False, msg

def test_model_accuracy_kamado_thick_cook():
    """
    Validates model ETA accuracy for a thick cut on a kamado cooker (beef profile).
    """
    errors = run_cook_accuracy_validation(
        thickness_mm=100.0,
        weight_kg=3.5,
        cooker_type="kamado",
        target_temp_c=95.0,
        ambient_temp=115.0,
        meat_type="beef"
    )
    
    failed_steps = [item for item in errors if not item[-1]]
    if failed_steps:
        msg = f"Failed steps count: {len(failed_steps)} out of {len(errors)}\n"
        for item in failed_steps[:5]:
            msg += f"Time: {item[0]}s, Pct Error: {item[1]:.2%}, Abs Error: {item[2]}s, Stage: {item[3]}\n"
        assert False, msg
