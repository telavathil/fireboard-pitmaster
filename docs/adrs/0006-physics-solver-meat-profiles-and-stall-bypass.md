# 6. Dynamic Meat Profiles and Thermodynamic Stall Bypass

Status: Accepted

Context:
The 1D Crank-Nicolson thermodynamic solver was previously configured with static material properties (diffusivity $D = 0.14$, conductivity $k = 0.5$) and estimated the evaporative stall duration solely on core progress. This led to prediction mismatches for thick cuts of meat (e.g. 100mm brisket) where core temperatures lag significantly behind surface wet-bulb plateaus, and ignored the unique thermal characteristics of different meat classes (poultry, fish, beef, pork). 

Additionally, we lacked a standard method to validate prediction accuracy. Initial validation attempts used elapsed-time percentages (e.g., 25% / 75% cook completion) to evaluate error thresholds, but this failed to match the physical progression of the cook since early prediction uncertainty is high prior to the stall. Reference research from the `snelstim/Probe-ability` project indicated that predictions are best evaluated against distinct physical phases of the cook rather than arbitrary elapsed time.

Decision:
1. Map the database and API `meat_type` metadata to scientific physical coefficients ($D$, $k$, and stall budget multiplier $\alpha$) for beef, pork, poultry, and fish.
2. Implement a thermodynamic stall bypass in the solver simulation that sets remaining stall time to zero if the core heating rate indicates the stall has physically completed (rate $> 0.2^\circ\text{C}/\text{min}$ or $0.0033^\circ\text{C}/\text{s}$).
3. Implement a pytest-based model validation suite utilizing physically generated Crank-Nicolson temperature curves to assert prediction accuracy across temperature-delimited stages (pre-stall < 65°C, stall 65°C-75°C, and post-stall >= 75°C).

Consequences:
* Pros:
  * Highly accurate time-remaining (ETA) predictions for thick cuts, dropping stall prediction error by over 95% (e.g., from 86 minutes down to 4 minutes on a 4.6-hour cook).
  * Robust physical modeling that respects different classes of meats and scales heat transfer coefficients appropriately.
  * Automated regression test suite checking model accuracy under various cook scenarios (standard pellet, thick kamado) to prevent model drift.
* Cons:
  * Slightly higher database and query complexity (fetching `meat_type` inside prediction loop).
  * Hardcoded dictionary of physical constants in Python code (though still customizable via manual instantiation parameters).
