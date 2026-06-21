# Research Record: Douglas Baldwin's Thermal Properties & Pasteurization Mathematics

This document compiles the scientific baseline, empirical constants, and mathematical models developed by Douglas Baldwin (specifically from *A Practical Guide to Sous Vide Cooking*), serving as the physical reference for our thermodynamic solver's coefficients.

---

## 1. Physical Foundation: Thermal Properties of Meat

Heat transfer through meat during cooking depends on the physical structure of the food. In thermodynamic modeling, this is governed by three material properties:
1. **Thermal Conductivity ($k$, $\text{W}/\text{m}\cdot\text{K}$)**: The rate at which heat flows through the material.
2. **Specific Heat ($C_p$, $\text{J}/\text{kg}\cdot\text{K}$)**: The energy required to raise the temperature of a unit mass of the food by one degree.
3. **Density ($\rho$, $\text{kg}/\text{m}^3$)**: The mass per unit volume.

These properties are combined into a single parameter, **Thermal Diffusivity ($D$, $\text{mm}^2/\text{s}$)**, which dictates the rate at which temperature changes propagate through the meat:

$$D = \frac{k}{\rho \cdot C_p}$$

Because meat is composed of 60% to 80% water, its thermal properties are heavily dominated by the properties of liquid water ($k \approx 0.6 \text{ W}/\text{m}\cdot\text{K}$, $D \approx 0.14 \text{ mm}^2/\text{s}$).

### Empirical Thermal Constants
Based on Baldwin's compilations and related food science literature, the thermal property profiles mapped to our solver classes are structured as follows:

| Meat Class | Water Content | Diffusivity ($D$, $\text{mm}^2/\text{s}$) | Conductivity ($k$, $\text{W}/\text{m}\cdot\text{K}$) | Stall Scalar ($\alpha$) |
| :--- | :--- | :--- | :--- | :--- |
| **Beef / Red Meat** | 60% - 65% | $0.138$ | $0.49$ | $12.0$ |
| **Pork** | 65% - 70% | $0.142$ | $0.51$ | $11.5$ |
| **Poultry** | 70% - 75% | $0.150$ | $0.53$ | $10.0$ |
| **Fish / Seafood** | 75% - 80% | $0.160$ | $0.56$ | $6.0$ |

*Note: Fish and seafood have higher diffusivity due to lower fat concentrations and looser muscle fibers, leading to faster thermal equalization and shorter evaporative stalls.*

---

## 2. Geometry-Based Heat Conduction

Baldwin models heat penetration using three primary analytical geometries:
1. **Infinite Flat Slab (Thickness $2L$)**: Heat penetrates symmetrically from both sides (our default model).
2. **Infinite Cylinder (Radius $R$)**: Heat penetrates radially.
3. **Sphere (Radius $R$)**: Heat penetrates from all directions.

For a flat slab of thickness $2L$, the temperature at the center core ($x = 0$) over time is solved using the infinite series representation of the heat equation:

$$T(0, t) = T_{\text{ambient}} - (T_{\text{ambient}} - T_{\text{start}}) \sum_{m=1}^{\infty} B_m e^{-\lambda_m^2 \frac{D t}{L^2}}$$

Where $\lambda_m$ and $B_m$ are coefficients determined by the Biot number ($\text{Bi} = \frac{h L}{k}$), representing the ratio of convective heat transfer at the surface to conductive heat transfer inside the meat.

Our 1D Crank-Nicolson finite difference scheme numerical solver replicates this analytical behavior in real-time, eliminating the need to solve complex infinite series at each time step.

---

## 3. Pasteurization Mathematics: Time-Temperature Lethality

One of the primary contributions of Baldwin's work is mapping transient heat conduction directly to pathogen lethality curves (specifically targeting *Salmonella spp.*, *Listeria monocytogenes*, and *Escherichia coli*).

Rather than relying on instantaneous temperature thresholds (e.g., USDA's traditional $165^\circ\text{F}$ rule for poultry), Baldwin utilizes an integrated time-temperature lethality calculation (SafeCook™ concept).

### D-Value and z-Value Physics
* **$D$-Value**: The time (in minutes) required at a specific temperature to reduce the pathogen population by 90% (a 1-log decimal reduction).
* **$z$-Value**: The temperature change (in °C) required to change the $D$-value by a factor of 10.

For *Salmonella* in beef, the reference parameters are:
* $T_{\text{ref}} = 60^\circ\text{C}$
* $D_{60} \approx 5.5 \text{ minutes}$
* $z \approx 6.0^\circ\text{C}$

The $D$-value at any arbitrary temperature $T$ is calculated as:

$$D(T) = D_{\text{ref}} \cdot 10^{\frac{T_{\text{ref}} - T}{z}}$$

### Integrated Lethality (F-Value)
To determine if food is pasteurized during a transient heating ramp (where core temperature is continuously changing), we calculate the cumulative lethality index ($F$):

$$F = \int_{0}^{t} 10^{\frac{T(\tau) - T_{\text{ref}}}{z}} d\tau$$

Safety is achieved when the integrated value $F$ exceeds the target threshold for a specific log-reduction (e.g., a 6.5-log reduction for beef, or a 7.0-log reduction for poultry):

$$F \ge \text{Target Log Reduction} \times D_{\text{ref}}$$

### Application to FireBoard Pitmaster
This mathematical foundation allows our platform to evaluate food safety dynamically:
1. **Pre-Stall/Stall Monitoring**: Because large cuts stay in the stall range ($65^\circ\text{C}$ to $75^\circ\text{C}$) for hours, they accumulate massive pasteurization lethality units *long* before reaching their final target doneness temp (e.g., $93^\circ\text{C}$).
2. **Carryover Resting Safety**: The thermal lethality index continues to accumulate during the resting phase, which can be dynamically computed using our carryover resting simulation.
