import pytest
import numpy as np
from app.math_engine.solver import CookingSolver

def test_solver_initialization():
    """
    Checks that solver initializes spatial grids and calculates cooker-specific stall budgets.
    """
    # Kamado cooker (beta = 1.2)
    solver_kamado = CookingSolver(
        thickness_mm=90.0,
        weight_kg=3.0,
        cooker_type="kamado",
        target_temp_c=93.0
    )
    assert solver_kamado.L == 45.0
    assert solver_kamado.dx == 4.5
    assert solver_kamado.dt == 20.0
    # Budget: alpha (12.0) * thickness (90) * weight (3.0) * beta (1.2) = 3888.0
    assert solver_kamado.t_stall_budget == 3888.0

    # Oven cooker (beta = 0.8)
    solver_oven = CookingSolver(
        thickness_mm=90.0,
        weight_kg=3.0,
        cooker_type="oven",
        target_temp_c=93.0
    )
    assert solver_oven.t_stall_budget == 2592.0

def test_initialize_profile():
    """
    Verifies that the parabolic temperature profile is bounded by core and ambient temperatures.
    """
    solver = CookingSolver(
        thickness_mm=80.0,
        weight_kg=2.0,
        cooker_type="pellet",
        target_temp_c=93.0
    )
    
    # Rising cook setup
    profile = solver.initialize_profile(
        current_core=50.0,
        current_ambient=110.0,
        heating_rate_c_per_sec=0.005
    )
    
    assert len(profile) == solver.N + 1
    assert profile[0] == 50.0  # Core matches initial
    assert profile[-1] > 50.0   # Surface is hotter
    assert profile[-1] <= 110.0 # Surface capped at ambient
    
    # Verify parabolic curvature (profile is monotonic and increasing)
    diffs = np.diff(profile)
    assert np.all(diffs >= 0.0)

def test_simulate_cook_basic():
    """
    Verifies standard cook simulations, including basic checks and parameter scaling.
    """
    # Thin steak/cut
    solver = CookingSolver(
        thickness_mm=30.0,
        weight_kg=0.5,
        cooker_type="pellet",
        target_temp_c=55.0
    )
    
    eta, carryover = solver.simulate_cook(
        initial_core=15.0,
        ambient_temp=120.0,
        heating_rate_c_per_sec=0.01
    )
    
    assert eta > 0
    assert carryover > 0.0
    
    # If initial core is already above target
    eta_done, carryover_done = solver.simulate_cook(
        initial_core=56.0,
        ambient_temp=120.0,
        heating_rate_c_per_sec=0.0
    )
    assert eta_done == 0
    assert carryover_done == 0.0
    
    # If ambient is below target
    eta_cold, carryover_cold = solver.simulate_cook(
        initial_core=15.0,
        ambient_temp=50.0,
        heating_rate_c_per_sec=0.01
    )
    assert eta_cold == -1
    assert carryover_cold == 0.0

def test_simulate_cook_stall_comparison():
    """
    Verifies that a thicker cut has a longer cook duration due to the evaporative stall.
    """
    # Small pork shoulder
    solver_small = CookingSolver(
        thickness_mm=50.0,
        weight_kg=1.0,
        cooker_type="kamado",
        target_temp_c=93.0
    )
    
    # Large pork shoulder (twice thickness, twice weight)
    solver_large = CookingSolver(
        thickness_mm=100.0,
        weight_kg=2.0,
        cooker_type="kamado",
        target_temp_c=93.0
    )
    
    eta_small, _ = solver_small.simulate_cook(
        initial_core=50.0,
        ambient_temp=110.0,
        heating_rate_c_per_sec=0.005
    )
    
    eta_large, _ = solver_large.simulate_cook(
        initial_core=50.0,
        ambient_temp=110.0,
        heating_rate_c_per_sec=0.005
    )
    
    # Large shoulder should take significantly longer to cook than the small one
    assert eta_large > eta_small
