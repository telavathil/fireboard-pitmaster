# Kalman Filter Theory & Application for Cooking Telemetry

This document explains the mathematical theory, design, and practical necessity of the Kalman Filter implemented in the FireBoard Pitmaster application.

---

## 1. The Core Problem: Sensor Discretization

Standard temperature probes (such as wired NTC thermistors) report values in discrete steps. For instance, a budget probe might only transmit temperatures in integer steps: `54.0°C`, `55.0°C`, `56.0°C`. 

This step-wise reporting introduces severe mathematical challenges when calculating the rate of temperature change over time ($\frac{dT}{dt}$), which is the critical variable needed to forecast the remaining cook time:

1. **Infinite Spikes**: At the exact moment the temperature jumps from `54.0°C` to `55.0°C`, the instantaneous rate of change spikes.
2. **Zero Plateaus**: During the long period when the temperature is held at `55.0°C`, the rate of change drops to exactly zero.

Using these raw derivatives to calculate an Estimated Time of Arrival (ETA) leads to extreme division-by-zero oscillations (the countdown timer swinging between hours and minutes). To calculate a stable ETA, we must extract the true, continuous temperature trajectory and its stable derivative.

---

## 2. Mathematical Formulation of the 1D Kalman Filter

A Kalman Filter is an optimal estimator that tracks the "state" of a system over time. For cooking, we define the state vector $x$ as:

$$x = \begin{bmatrix} T \\ \dot{T} \end{bmatrix}$$

Where:
* $T$ is the true internal temperature (°C).
* $\dot{T}$ is the true heating rate (°C/second).

### A. The State Transition Model (Prediction)
Assuming a constant heating rate between samples, the physical system progresses over time step $\Delta t$ (which is strictly 20 seconds in our FireBoard poller) according to:

$$T_{k} = T_{k-1} + \dot{T}_{k-1} \cdot \Delta t$$
$$\dot{T}_{k} = \dot{T}_{k-1}$$

In matrix form, the state transition matrix $F$ is:

$$F = \begin{bmatrix} 1 & \Delta t \\ 0 & 1 \end{bmatrix}$$

The prediction steps are:

$$x_{pred} = F x_{k-1}$$
$$P_{pred} = F P_{k-1} F^T + Q$$

Where:
* $P$ is the state covariance matrix (uncertainty of our estimate).
* $Q$ is the process noise covariance matrix (representing changes in cooker temperature or heating rates).

### B. The Measurement Model (Update)
The thermometer only measures the raw temperature ($T_{raw}$), not the heating rate. Therefore, the measurement matrix $H$ is:

$$H = \begin{bmatrix} 1 & 0 \end{bmatrix}$$

When a new measurement $z = [T_{raw}]$ arrives:
1. Calculate the measurement residual $y$ (the difference between the sensor value and our physics prediction):
   $$y = z - H x_{pred}$$
2. Calculate the residual covariance $S$:
   $$S = H P_{pred} H^T + R$$
   *Where $R$ is the measurement noise covariance (representing the sensor's discretization noise).*
3. Calculate the **Kalman Gain** $K$ (which determines how much we trust the sensor measurement versus our physical model prediction):
   $$K = P_{pred} H^T S^{-1}$$
4. Update the estimated state $x$ and covariance $P$:
   $$x_{updated} = x_{pred} + K y$$
   $$P_{updated} = (I - K H) P_{pred}$$

---

## 3. Parameter Tuning ($Q$ and $R$)

The responsiveness and smoothing of the filter are governed by the ratio between the process noise $Q$ and the measurement noise $R$:

* **Measurement Noise ($R$)**: Set relatively high (e.g., $R = 0.5$) because we know the sensor has a high discretization error (staircase jumps).
* **Process Noise ($Q$)**: Set low (e.g., $Q_{1,1} = 0.001$, $Q_{2,2} = 0.0001$) because thermodynamic heat transfer in meat is highly continuous and changes slowly.

By tuning these parameters, the Kalman Filter behaves like a self-correcting low-pass filter, producing a differentiable, smooth temperature curve and a stable heating rate.
