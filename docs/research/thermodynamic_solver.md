# Thermodynamic Solver: 1D Crank-Nicolson Heat Equation & Evaporative Stall Physics

This document explains the mathematical physics, numerical discretization, and physical modeling strategy implemented in the FireBoard Pitmaster thermodynamic prediction engine.

---

## 1. Physical Context: Heat Transfer in Meat

Cooking meat is a transient heat transfer process. When meat is placed in a cooker (oven, smoker, or grill), heat is transferred from the hot air to the meat's surface via convection, and then diffuses from the surface toward the core (center) via conduction.

Mathematically, the temperature profile $T(x, t)$ within the meat is governed by the 1D transient heat conduction equation:

$$\frac{\partial T}{\partial t} = D \frac{\partial^2 T}{\partial x^2}$$

Where:
* $T$ is the temperature (°C) as a function of depth $x$ and time $t$.
* $D$ is the thermal diffusivity ($\text{mm}^2/\text{s}$). For lean meat, $D \approx 0.14 \text{ mm}^2/\text{s}$, which is dominated by its high water content.

---

## 2. Crank-Nicolson Discretization

To solve the heat equation numerically, we discretize the spatial domain $[0, L]$ (where $x = 0$ is the center core and $x = L$ is the surface, with $L = \text{thickness} / 2$) into $N$ intervals, creating $N+1$ grid nodes spaced by $\Delta x = L / N$. The time is discretized into steps of $\Delta t$.

The Crank-Nicolson method is an implicit finite difference scheme. It approximates the spatial second derivative by averaging its central difference values at the current time step $n$ and the next time step $n+1$:

$$\frac{T_i^{n+1} - T_i^n}{\Delta t} = \frac{D}{2 \Delta x^2} \left[ (T_{i-1}^n - 2T_i^n + T_{i+1}^n) + (T_{i-1}^{n+1} - 2T_i^{n+1} + T_{i+1}^{n+1}) \right]$$

Letting the dimensionless Fourier mesh parameter be $\sigma = \frac{D \Delta t}{2 \Delta x^2}$, we group the unknown future temperatures on the left and known current temperatures on the right:

$$-\sigma T_{i-1}^{n+1} + (1 + 2\sigma) T_i^{n+1} - \sigma T_{i+1}^{n+1} = \sigma T_{i-1}^n + (1 - 2\sigma) T_i^n + \sigma T_{i+1}^n$$

This equation holds for all internal nodes $i = 1, \dots, N-1$.

---

## 3. Boundary Conditions

The system is closed by specifying physical boundary conditions at the center core ($i = 0$) and the surface ($i = N$).

### A. Center Core Boundary (Symmetry at $x = 0$)
Since heat enters symmetrically from both sides of the meat, there is no heat flux across the center line:
$$\left. \frac{\partial T}{\partial x} \right|_{x=0} = 0$$

Using a central difference approximation with a virtual node $T_{-1}$, we have:
$$\frac{T_1 - T_{-1}}{2 \Delta x} = 0 \implies T_{-1} = T_1$$

Substituting $T_{-1} = T_1$ into the Crank-Nicolson equation for $i = 0$:

$$(1 + 2\sigma) T_0^{n+1} - 2\sigma T_1^{n+1} = (1 - 2\sigma) T_0^n + 2\sigma T_1^n$$

### B. Surface Boundary (Convection at $x = L$)
The surface node exchanges heat with the cooker's ambient air $T_{\text{ambient}}$ via convection:
$$-k \left. \frac{\partial T}{\partial x} \right|_{x=L} = h (T_N - T_{\text{ambient}})$$

Where:
* $k$ is the thermal conductivity of the meat ($\approx 0.5 \text{ W}/(\text{m}\cdot\text{K})$).
* $h$ is the convective heat transfer coefficient ($\approx 10 - 20 \text{ W}/(\text{m}^2\cdot\text{K})$).

Using a virtual node $T_{N+1}$ and defining the Biot parameter $\gamma = \frac{h \Delta x}{k}$:
$$\frac{T_{N+1} - T_{N-1}}{2 \Delta x} = -\frac{h}{k}(T_N - T_{\text{ambient}}) \implies T_{N+1} = T_{N-1} - 2\gamma (T_N - T_{\text{ambient}})$$

Substituting this into the Crank-Nicolson equation for $i = N$ yields:

$$-2\sigma T_{N-1}^{n+1} + (1 + 2\sigma(1+\gamma)) T_N^{n+1} = 2\sigma T_{N-1}^n + (1 - 2\sigma(1+\gamma)) T_N^n + 2\sigma\gamma (T_{\text{ambient}}^n + T_{\text{ambient}}^{n+1})$$

---

## 4. The Tridiagonal Matrix System

Gathering the equations for all nodes $i = 0, \dots, N$ yields a linear system of the form:

$$\mathbf{A} \underline{T}^{n+1} = \mathbf{B} \underline{T}^n + \underline{C}^n$$

Because the equations only couple adjacent nodes, the coefficient matrices $\mathbf{A}$ and $\mathbf{B}$ are **tridiagonal**:

$$\mathbf{A} = \begin{bmatrix} 
1+2\sigma & -2\sigma & 0 & \cdots & 0 \\
-\sigma & 1+2\sigma & -\sigma & \cdots & 0 \\
0 & -\sigma & 1+2\sigma & \cdots & 0 \\
\vdots & \vdots & \ddots & \ddots & \vdots \\
0 & 0 & \cdots & -2\sigma & 1+2\sigma(1+\gamma)
\end{bmatrix}$$

We solve this tridiagonal system at each time step in $O(N)$ operations using the **Thomas Algorithm** (a specialized, division-by-zero safe Gaussian elimination), making forward simulations extremely fast.

---

## 5. Evaporative Stall Modeling

Low-and-slow cooking of large cuts of meat exhibits a **stall plateau** (where the internal core temperature hangs between $65^\circ\text{C}$ and $75^\circ\text{C}$ for hours). This is caused by moisture migrating to the surface and evaporating, which balances the heat entering from the smoker.

To model this without solving highly complex coupled mass-transfer partial differential equations, we employ a hybrid boundary cap model:

1. **Surface Temperature Cap**: While moisture is present, the surface temperature node $T_N$ is capped at the wet-bulb temperature of the cooker, $T_{\text{stall}} \approx 70^\circ\text{C}$:
   $$T_N^{n+1} = \min(T_N^{n+1}, T_{\text{stall}})$$
2. **Moisture Budget**: The length of the stall is proportional to the total water volume. We define a total "stall duration budget" $t_{\text{stall}}$ (seconds):
   $$t_{\text{stall}} = \alpha \cdot \text{thickness\_mm} \cdot \text{weight\_kg} \cdot \beta_{\text{cooker}}$$
3. **Dry-out (Bark Formation)**: Once the simulation has accumulated $t_{\text{stall}}$ seconds in the capped state, the surface moisture is fully depleted. The temperature cap is removed, allowing the surface node $T_N$ to rise toward $T_{\text{ambient}}$ normally, causing the core temperature to break out of the stall.

---

## 6. Carryover Cooking & Resting

When meat is removed from a cooker, the core temperature does not immediately decrease. Because the outer layers of the meat are much hotter than the core (forming a steep temperature gradient), heat continues to flow inward after removal, causing the core temperature to rise by several degrees (carryover rise).

To predict this carryover:
1. **Resting Boundary Conditions**: Once the simulated core temperature reaches the removal threshold ($T_{\text{target}} - \Delta T_{\text{carryover}}$), we change the boundary conditions to represent resting:
   * Ambient temperature $T_{\text{ambient}}$ is dropped to room temperature ($\approx 20^\circ\text{C}$).
   * Convective heat coefficient $h$ is reduced (representing resting in still room air, e.g., $h_{\text{rest}} \approx 5.0$).
2. **Peak Tracking**: We run the simulation forward under resting conditions. The core temperature rises to a peak $T_{\text{core, max}}$ and then begins to cool.
3. **Carryover Prediction**: The projected carryover rise is:
   $$\Delta T_{\text{carryover}} = T_{\text{core, max}} - T_{\text{core, removal}}$$
   
Our predictor uses this feedback loop to tell the user the exact temperature at which they should remove the meat from the cooker to land perfectly at their final target doneness.
