import numpy as np

class CookingSolver:
    def __init__(
        self,
        thickness_mm: float,
        weight_kg: float,
        cooker_type: str,
        target_temp_c: float,
        meat_type: str = "beef",
        D: float = 0.14,  # Thermal diffusivity of meat (mm^2/s)
        k: float = 0.5,   # Thermal conductivity of meat (W/m*K)
        h: float = 15.0,  # Convective heat transfer coefficient (W/m^2*K)
    ):
        """
        Initializes the 1D Crank-Nicolson solver for meat thermodynamics.
        
        Args:
            thickness_mm: Total thickness of the meat cut in mm.
            weight_kg: Total weight of the meat cut in kg.
            cooker_type: Smoker/cooker type (e.g. "kamado", "pellet", "oven").
            target_temp_c: Target core temperature for completion.
            meat_type: Meat type string (e.g. "beef", "pork", "poultry", "fish").
            D: Thermal diffusivity (mm^2/sec).
            k: Thermal conductivity (W/m*K).
            h: Convective heat transfer coefficient (W/m^2*K).
        """
        self.L = thickness_mm / 2.0  # Heat penetrates from both sides
        self.weight_kg = weight_kg
        self.cooker_type = cooker_type.lower()
        self.target_temp_c = target_temp_c
        self.meat_type = meat_type.strip().lower() if meat_type else "beef"
        
        # Meat thermal profiles based on scientific tables (e.g. Douglas Baldwin, etc.)
        MEAT_THERMAL_PROFILES = {
            "beef":    {"D": 0.138, "k": 0.49, "alpha": 12.0},
            "pork":    {"D": 0.142, "k": 0.51, "alpha": 11.5},
            "poultry": {"D": 0.150, "k": 0.53, "alpha": 10.0},
            "chicken": {"D": 0.150, "k": 0.53, "alpha": 10.0},
            "turkey":  {"D": 0.150, "k": 0.53, "alpha": 10.0},
            "fish":    {"D": 0.160, "k": 0.56, "alpha": 6.0},
            "seafood": {"D": 0.160, "k": 0.56, "alpha": 6.0},
        }
        
        profile = MEAT_THERMAL_PROFILES.get(self.meat_type, MEAT_THERMAL_PROFILES["beef"])
        
        # Use profile values if parameters are at their default placeholders
        self.D = D if D != 0.14 else profile["D"]
        self.k = k if k != 0.5 else profile["k"]
        self.h = h
        
        # Grid parameters
        self.N = 10  # Number of spatial slices
        self.dx = self.L / self.N
        self.dt = 20.0  # Time step in seconds (matches 20s poller resolution)
        
        # Calculate stall budget (seconds)
        # Larger/thicker cuts have more moisture and stall longer
        cooker_lower = self.cooker_type
        if "kamado" in cooker_lower:
            beta = 1.2
        elif "pellet" in cooker_lower:
            beta = 1.0
        elif "oven" in cooker_lower:
            beta = 0.8
        else:
            beta = 1.0
            
        alpha = profile["alpha"]
        self.t_stall_budget = alpha * thickness_mm * weight_kg * beta

    def initialize_profile(self, current_core: float, current_ambient: float, heating_rate_c_per_sec: float) -> np.ndarray:
        """
        Initializes a parabolic temperature profile from core to surface
        based on the observed heating rate.
        """
        # Avoid zero or negative rate calculations causing incorrect gradients
        rate = max(heating_rate_c_per_sec, 0.0)
        
        # Steady-heating analytical gradient: T_surface = T_core + (rate * L^2) / (2 * D)
        delta_t = (rate * (self.L ** 2)) / (2.0 * self.D)
        
        surface_temp = current_core + delta_t
        
        # During the evaporative stall phase (core between 65C and 75C), the surface
        # has already reached the wet-bulb limit temperature of 70C.
        if 65.0 <= current_core < 75.0:
            surface_temp = max(surface_temp, 70.0)
            
        # Cap surface temp logically between core and ambient cooker temperature
        surface_temp = max(current_core, min(surface_temp, current_ambient))
        
        # Interpolate a parabolic distribution
        profile = np.zeros(self.N + 1)
        for i in range(self.N + 1):
            fraction = i / self.N
            profile[i] = current_core + (surface_temp - current_core) * (fraction ** 2)
            
        return profile

    def _solve_thomas(self, a: np.ndarray, b: np.ndarray, c: np.ndarray, d: np.ndarray) -> np.ndarray:
        """
        Solves a tridiagonal system Ax = d in O(M) time using the Thomas Algorithm.
        """
        M = len(d)
        cp = np.zeros(M)
        dp = np.zeros(M)
        
        # Forward sweep
        cp[0] = c[0] / b[0]
        dp[0] = d[0] / b[0]
        
        for i in range(1, M):
            denom = b[i] - a[i] * cp[i-1]
            if abs(denom) < 1e-12:
                denom = 1e-12
            if i < M - 1:
                cp[i] = c[i] / denom
            dp[i] = (d[i] - a[i] * dp[i-1]) / denom
            
        # Back substitution
        x = np.zeros(M)
        x[M-1] = dp[M-1]
        for i in range(M-2, -1, -1):
            x[i] = dp[i] - cp[i] * x[i+1]
            
        return x

    def _step_crank_nicolson(
        self,
        T: np.ndarray,
        T_amb: float,
        sigma: float,
        gamma: float,
        capped: bool
    ) -> np.ndarray:
        """
        Advances the temperature profile by one step (dt) using Crank-Nicolson.
        """
        if capped:
            # Dirichlet boundary at surface: Node N is locked to T_amb (T_stall)
            # We solve for N nodes (0 to N-1)
            M = self.N
            a = np.zeros(M)
            b = np.zeros(M)
            c = np.zeros(M)
            d = np.zeros(M)
            
            # Node 0: Symmetry boundary (core)
            b[0] = 1.0 + 2.0 * sigma
            c[0] = -2.0 * sigma
            d[0] = (1.0 - 2.0 * sigma) * T[0] + 2.0 * sigma * T[1]
            
            # Internal nodes 1 to N-2
            for i in range(1, M - 1):
                a[i] = -sigma
                b[i] = 1.0 + 2.0 * sigma
                c[i] = -sigma
                d[i] = sigma * T[i-1] + (1.0 - 2.0 * sigma) * T[i] + sigma * T[i+1]
                
            # Node N-1: Boundary-adjacent
            a[M-1] = -sigma
            b[M-1] = 1.0 + 2.0 * sigma
            c[M-1] = 0.0
            d[M-1] = sigma * T[M-2] + (1.0 - 2.0 * sigma) * T[M-1] + sigma * T[M] + sigma * T_amb
            
            T_new = self._solve_thomas(a, b, c, d)
            
            # Construct final profile
            profile = np.zeros(self.N + 1)
            profile[:self.N] = T_new
            profile[self.N] = T_amb
            return profile
        else:
            # Convective boundary at surface: Node N exchanges heat with T_amb
            # We solve for N+1 nodes (0 to N)
            M = self.N + 1
            a = np.zeros(M)
            b = np.zeros(M)
            c = np.zeros(M)
            d = np.zeros(M)
            
            # Node 0: Symmetry boundary (core)
            b[0] = 1.0 + 2.0 * sigma
            c[0] = -2.0 * sigma
            d[0] = (1.0 - 2.0 * sigma) * T[0] + 2.0 * sigma * T[1]
            
            # Internal nodes 1 to N-1
            for i in range(1, M - 1):
                a[i] = -sigma
                b[i] = 1.0 + 2.0 * sigma
                c[i] = -sigma
                d[i] = sigma * T[i-1] + (1.0 - 2.0 * sigma) * T[i] + sigma * T[i+1]
                
            # Node N: Convective boundary
            a[M-1] = -2.0 * sigma
            b[M-1] = 1.0 + 2.0 * sigma * (1.0 + gamma)
            c[M-1] = 0.0
            d[M-1] = 2.0 * sigma * T[M-2] + (1.0 - 2.0 * sigma * (1.0 + gamma)) * T[M-1] + 4.0 * sigma * gamma * T_amb
            
            return self._solve_thomas(a, b, c, d)

    def simulate_rest(self, initial_profile: np.ndarray) -> float:
        """
        Simulates the resting phase in room temp (20C) with reduced convective coefficient.
        Returns the maximum core temperature reached.
        """
        profile = initial_profile.copy()
        T_room = 20.0
        h_rest = 5.0  # Reduced convective coefficient in still room air
        
        sigma = (self.D * self.dt) / (2.0 * (self.dx ** 2))
        gamma_rest = (h_rest * self.dx) / self.k
        
        max_core = profile[0]
        # Simulate up to 45 minutes (135 steps of 20s)
        steps = int(2700 / self.dt)
        
        for _ in range(steps):
            profile = self._step_crank_nicolson(profile, T_room, sigma, gamma_rest, capped=False)
            if profile[0] > max_core:
                max_core = profile[0]
            elif profile[0] < max_core - 0.1:
                # Stop early if core temp has peaked and starts dropping
                break
                
        return max_core

    def simulate_cook(
        self,
        initial_core: float,
        ambient_temp: float,
        heating_rate_c_per_sec: float
    ) -> tuple[int, float]:
        """
        Simulates the cook forward in time until the core reaches target_temp_c.
        Returns:
            A tuple of (eta_seconds, carryover_rise_c)
        """
        if initial_core >= self.target_temp_c:
            return 0, 0.0
            
        if ambient_temp <= self.target_temp_c:
            return -1, 0.0
            
        # Determine remaining stall budget based on current core progress
        if initial_core < 65.0:
            remaining_stall = self.t_stall_budget
        elif initial_core >= 75.0:
            remaining_stall = 0.0
        else:
            fraction_done = (initial_core - 65.0) / 10.0
            remaining_stall = self.t_stall_budget * (1.0 - fraction_done)
            
        # If the core is already heating rapidly, the stall is physically over
        # (rate > 0.2C/min = 0.00333C/s)
        if heating_rate_c_per_sec > 0.00333:
            remaining_stall = 0.0
            
        # Initialize temperature profile in the meat
        profile = self.initialize_profile(initial_core, ambient_temp, heating_rate_c_per_sec)
        
        sigma = (self.D * self.dt) / (2.0 * (self.dx ** 2))
        gamma = (self.h * self.dx) / self.k
        
        sim_time = 0
        max_sim_steps = 1800  # Cap simulation at 10 hours (1800 steps of 20s)
        T_stall = 70.0
        
        while profile[0] < self.target_temp_c and sim_time < max_sim_steps * self.dt:
            # Advance step uncapped first to see if it tries to break T_stall
            next_profile = self._step_crank_nicolson(profile, ambient_temp, sigma, gamma, capped=False)
            
            if remaining_stall > 0.0 and next_profile[self.N] > T_stall:
                # Recalculate step with surface temperature capped at wet-bulb stall temp
                next_profile = self._step_crank_nicolson(profile, T_stall, sigma, gamma, capped=True)
                remaining_stall = max(0.0, remaining_stall - self.dt)
                
            profile = next_profile
            sim_time += int(self.dt)
            
        if sim_time >= max_sim_steps * self.dt:
            return -1, 0.0
            
        # Simulate carryover resting using the final cook profile
        max_core = self.simulate_rest(profile)
        carryover_rise = max(0.0, max_core - profile[0])
        
        return sim_time, carryover_rise
