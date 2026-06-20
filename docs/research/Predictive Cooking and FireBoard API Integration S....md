# **Thermodynamic Modeling and FireBoard API Integration for Predictive Cooking Analytics**

The determination of precise cooking times for meat has evolved from empirical rules of thumb to complex state estimation and thermodynamic simulation. In commercial smart kitchen hardware, such as the wireless probes developed by Apption Labs (Meater) and Combustion Inc., multi-sensor arrays continuously measure internal, surface, and ambient temperatures to run real-time predictive analytics. While these proprietary prediction engines remain closely guarded trade secrets, a substantial ecosystem of open-source software, home automation integrations, and mathematical frameworks has emerged.  
This document synthesizes core open-source thermodynamic technologies and establishes an engineering blueprint to construct a custom, high-accuracy predictive cooking web application utilizing the FireBoard Cloud API.

## **1\. Analysis of Existing Open-Source Codebases**

The open-source community addresses predictive cooking through two primary methodologies: statistical machine learning models trained on empirical data, and localized automation integrations designed to aggregate diverse hardware sensors.

### **Machine-Learning-Driven State Estimation: Probe-ability**

The most robust open-source equivalent to commercial predictive cooking software is Probe-ability, a custom integration designed for the Home Assistant ecosystem. This framework operates as a hardware-agnostic predictive engine, allowing users to transform any standard temperature sensor or wired/wireless meat probe into a predictive smart thermometer.  
To calculate the estimated time of arrival (ETA) to target doneness, Probe-ability employs a gradient-boosted machine learning model. This regressor was trained on a dataset of approximately 140 empirical, multi-stage cooks across several major protein categories, including beef, pork, poultry, lamb, and fish. The model reads current internal temperature trajectories and compares them against historical heating curves to forecast remaining minutes.  
Recognizing that pure machine learning models can exhibit high variance when encountering unexpected environmental changes—such as opening a smoker door or adjusting an oven dial—the codebase incorporates a physics-based fallback model. When the gradient-boosted model's prediction confidence drops below a set threshold, the integration switches to an analytical thermodynamic equation, calculating a more stable, albeit conservative, linear-exponential projection.  
To continually refine its predictive accuracy, Probe-ability includes an integrated data-sharing pipeline. Users can choose to export their cook records locally as CSV files or anonymously stream their telemetry directly to a central Supabase database. This collective database acts as a public training set, allowing the gradient-boosted model to be retrained on a broader distribution of cooking vessels, ambient temperatures, and meat cuts.

### **Telemetry Aggregation and Orchestration: Kitchen Cooking Engine**

While Probe-ability acts as the analytical core, the Kitchen Cooking Engine (KCE) represents the local integration and orchestration layer. Designed to bypass proprietary cloud ecosystems, KCE connects directly to local Bluetooth Low Energy (BLE) advertisements from a wide array of hardware devices, including Meater, Inkbird, Govee, and Combustion Inc. probes.  
KCE establishes a local telemetry pipeline by reading raw state values from Home Assistant entities. In its predictive path, the engine relies heavily on pairing core temperature readings with ambient temperature readings to construct real-time heating rate vectors. KCE matches this real-time telemetry with an internal database containing over 185 international cuts and 89 regional Swedish cuts across six primary protein groups.  
By continuously evaluating the mathematical delta between the internal core temperature (T\_{\\text{core}}) and the ambient environment (T\_{\\text{ambient}}), KCE adjusts its ETA calculations to account for localized heat transfer rates, sounding warnings and triggering automated resting sequences when the core approaches the target doneness threshold.

### **Open-Source Client Libraries and Onboard Calculations**

An essential detail regarding commercial predictive thermometers—specifically the Combustion Inc. Predictive Thermometer—is that the core prediction calculations do not run on a connected mobile application. Instead, the predictive engine executes directly on the physical microcontroller embedded inside the probe itself.  
Combustion Inc. has open-sourced its device interface specifications and Bluetooth Low Energy SDKs (combustion-android-ble and combustion-ios-ble) on GitHub under the MIT License. These libraries demonstrate how the physical probe broadcasts its computed analytics over BLE advertising packets.  
Rather than sending raw thermistor resistances for external processing, the probe calculates and transmits two vital structured data payloads:

* virtualTemperatures: A data structure containing the core, surface, and ambient temperatures mapped from the probe's eight physical sensors.  
* predictionInfo: A data structure containing the status of the internal prediction engine, the percentage of the cook completed, and the exact remaining seconds to target doneness.

This hardware-software division indicates that developers using these open-source SDKs can extract precise, manufacturer-calibrated predictive analytics directly from the BLE stream without needing to implement their own mathematical solvers.

## **2\. Analytical Comparison of Predictive Cooking Technologies**

The following table provides a direct comparison of the primary open-source projects, reverse-engineered scripts, and open-source SDKs that perform or expose predictive cooking analytics.

| Project Name & Source | Primary Analytical Model | Telemetry & Inputs Required | Platform & Languages | Key Advantages & Disadvantages |
| :---- | :---- | :---- | :---- | :---- |
| **snelstim/Probe-ability** | Hybrid: Gradient-Boosted ML (XGBoost) with 1D physics fallback. | Internal tip temp, ambient temp, target temp, probe count (1–3). | Home Assistant / Python | **Adv:** Highly accurate for standard cooks; detects stalls; carryover logic. **Dis:** Prediction accuracy is dependent on training data volume. |
| **R00S/meater-in-local-haos** (KCE) | Telemetry tracking & ambient-refined ETA curves. | Tip temp, ambient temp, cut category, meat weight. | Home Assistant / Python | **Adv:** Local-first; massive cut library; maps doneness to USDA standards. **Dis:** Relies on external sensors for predictive calculations. |
| **combustion-inc/combustion-ios-ble** | Parses real-time data from probe-embedded predictive engines. | BLE advertising packets broadcasting predictionInfo. | iOS / Swift / Combine Framework | **Adv:** Unprecedented accuracy utilizing 8 physical sensors. **Dis:** Requires proprietary Combustion Inc. hardware. |
| **nathanfaber/meaterble** | Reverse-engineered BLE parser for local raw telemetry. | Bluetooth Low Energy raw advertisements from Meater probes. | Standalone / Python | **Adv:** Extracts raw tip and ambient variables directly without cloud. **Dis:** Does not compute predictions; requires external solver. |
| **flothesof/heat-equation-cook-my-meat** | 1D transient heat equation solved via Crank-Nicolson method. | Food thickness, thermal diffusivity, surface boundary temperatures. | Standalone / Python (NumPy) | **Adv:** Highly accurate physical representation of continuous heat flow. **Dis:** Highly sensitive to boundary condition inputs; no ML adaptation. |

## **3\. Mathematical Formulations of Heat Transfer and Stall Mechanics**

To build a physics-based cooking prediction engine, the physical meat must be mathematically modeled as a continuous thermodynamic medium.

### **1D Crank-Nicolson Solver**

The spatial temperature profile of a flat cut of meat (modeled as a 1D plate of thickness L) is governed by the transient heat equation:  
\\frac{\\partial T}{\\partial t} \= D \\frac{\\partial^2 T}{\\partial x^2}  
where D represents the thermal diffusivity of the food matrix (typically modeled as 0.14 square millimeters per second for lean meat, based on the physical properties of water). Using the Crank-Nicolson method, a stable implicit discretization scheme, we establish a grid of N+1 spatial nodes with step size \\Delta x and time step \\Delta t. The system of equations is expressed as:  
\\frac{T^{\[span\_89\](start\_span)\[span\_89\](end\_span)n+1}\_i \- T^n\_i}{\\Delta t} \= \\frac{D}{2 \\Delta x^2} \\left\[ \\left( T^n\_{i+1} \- 2T^n\_i \+ T^n\_{i-1} \\right) \+ \\left( T^{n+1}\_{i+1} \- 2T^{n+1}\_i \+ T^{n+1}\_{i-1} \\right) \\right\]  
By defining the dimensionless mesh Fourier parameter \\sigma \= \\frac{D \\Delta t}{2 \\Delta x^2}, we isolate the unknown future temperatures at step n+1 on the left side of the equation:  
\-\\sigma T\[span\_90\](start\_span)\[span\_90\](end\_span)^{n+1}\_{i-1} \+ (1 \+ 2\\sigma) T^{n+1}\_i \- \\sigma T^{n+1}\_{i+1} \= \\sigma T^n\_{i-1} \+ (1 \- 2\\sigma) T^n\_i \+ \\sigma T^n\_{i+1}  
This system is expressed in matrix notation as:  
\\mathbf{A\[span\_91\](start\_span)\[span\_91\](end\_span)} \\underline{T}^{n+1} \= \\mathbf{B} \\underline{T}^n \+ \\underline{C}  
Assuming constant material parameters, the matrices \\mathbf{A} and \\mathbf{B} are static. The temperature profile at the next timestep is calculated using a single matrix multiplication:

\\underlin\[span\_93\](start\_span)\[span\_93\](end\_span)e{T}^{n+1} \= \\mathbf{A}^{-1} \\left( \\mathbf{B} \\underline{T}^n \+ \\underline{C} \\right)

### **Thermodynamic Stall and Transition Modeling**

While the standard heat equation functions well for high-temperature roasting or thin cuts of meat, it breaks down during low-and-slow cooking (e.g., barbecuing large cuts like beef brisket or pork shoulder at ambient temperatures below 120 °C).  
The culinary "stall" is a non-linear thermodynamic event where the core temperature plateaus between 65 °C and 75 °C for hours. This plateau is not caused by collagen denaturation, but rather by evaporative cooling at the meat's surface.  
As heat penetrates the meat, the protein fibers denature and contract, squeezing liquid water outward toward the surface. Once the water reaches the exterior, it evaporates, consuming latent heat (L\_v \\approx 2260 kilojoules per kilogram) and cooling the surface. The stall persists as long as the rate of heat lost via evaporation matches the rate of convective heat conducted inward from the ambient air.  
Advanced open-source thermal models represent this by coupling the 1D heat equation with a mass transfer equation based on Flory-Huggins polymer theory, which models the meat as a porous, water-saturated protein sponge:  
\\frac{\\partial}{\\partial t} \\left( c\_p \\rho T \\right) \= \\nabla \\cdot \\left( k \\nabla T \\right) \- \\dot{m}\_{\\text{evap}} L\_v  
where \\dot{m}\_{\\text{evap}} represents the rate of water evaporation at the boundary, which depends on the local relative humidity and boundary layer air velocity.  
Because modeling these coupled differential equations in real-time requires high computational overhead and precise knowledge of localized convection currents, open-source packages use hybrid approximations:

1. **Dynamic Surface-to-Core Gradient Tracking**: The algorithm monitors the mathematical difference between the surface temperature (T\_{\\text{surface}}) and the core temperature (T\_{\\text{core}}). If the surface temperature plateaus near 100 °C while the core remains below the target, the engine calculates the evaporation limit and holds the projected ETA stable, avoiding the typical "slipped completion time" errors common in simpler algorithms.  
2. **Statistical Stall Overrides**: Using historical profiles, integrations like Probe-ability detect the flat-slope signature of a stall (\\frac{dT}{dt} \\approx 0 within the 65 °C to 75 °C window). It then overrides the active prediction, referencing historical stall durations for that specific protein and weight class to project when the surface moisture will fully deplete, allowing the stall to break and temperature progression to resume.

## **4\. Telemetry Acquisition, Sampling Resolution, and Noise Filtering**

A critical factor in predictive cooking calculations is the relationship between the sensor's physical resolution and the sampling rate. When modeling transient heat transfer, the mathematical rate of change (the first derivative of temperature with respect to time, \\frac{dT}{dt}) is the primary input used to estimate thermal trajectory.

### **The Problem of Discretization Noise**

Standard culinary probes, particularly budget-tier wired thermistors, often transmit temperature readings in integer steps (e.g., 1 °C or 1 °F increments). If an automation script samples this telemetry at high frequencies (such as once per second), the temperature curve appears as a series of flat plateaus broken by sudden step-changes.  
During the plateaus, the calculated rate of change drops to exactly zero. This discontinuous telemetry introduces severe mathematical errors:

* **Division-by-Zero Failures**: Simple linear predictors that estimate remaining time by dividing the remaining temperature delta by the current heating rate (t\_{\\text{remaining}} \= \\frac{T\_{\\text{target}} \- T\_{\\text{current}}}{\\frac{dT}{dt}}) will fail, resulting in infinite values or crash errors.  
* **Extreme ETA Oscillation**: The moment the sensor jumps by 1 degree, the rate of change spikes momentarily, causing the calculated ETA to swing wildly from hours to minutes and back to infinity.

### **Filtering and State Estimation**

To mitigate this discretization noise, open-source developers apply two primary engineering solutions:

1. **Exponential Moving Average (EMA) Smoothing**: Codebases like Probe-ability implement digital filters to reconstruct a continuous, differentiable slope from stepped data. By applying a temporal smoothing factor \\alpha, the smoothed temperature S\_t is calculated as: S\_t \= \\alpha T\_t \+ (1 \- \\alpha) S\_{t-1} This filtering suppresses high-frequency noise but introduces a slight time-lag into the predictive calculation, which must be mathematically compensated for in the algorithm.  
2. **Multivariate Kalman Filtering**: A more advanced state estimation scheme involves tracking the joint state of the temperature and its rate of change. The process model assumes x\_n \= \[T, \\dot{T}\]^T and applies a Kalman filter with tuned covariance parameters Q (process noise) and R (measurement noise) to extract the true underlying state and its derivative directly. This prevents lag while completely eliminating step-discretization spikes.

## **5\. Integration Postulate: Bypassing FireBoard Cloud API Rate Limits**

The FireBoard Cloud API provides an excellent gateway to connect enterprise and residential Wi-Fi/Bluetooth thermometers. In fact, FireBoard's official documentation reveals that they already offer a basic native feature called **FireBoard Analyze**, which utilizes S-shaped curves (to model rise, stall, and completion) or linear modes to forecast cook progress. This confirms that the hardware is designed to generate the precise telemetry needed for predictive thermal analysis.  
However, implementing a custom open-source predictive model on top of FireBoard's infrastructure requires strict adherence to its API limitations.

### **API Protocol and Endpoint Mechanics**

* **Authentication**: Secure token-based HTTP authentication must be established. The app sends credentials to the login endpoint: POST https://fireboard.io/api/rest-auth/login/ This returns an account token: { "key": "9944bb9966cc22cc9418ad846dd0e4bbdfc6ee4b" } All subsequent telemetry requests must supply this key prefixed by the literal "Token " in the Authorization header.  
* **Telemetry Extraction**: Device information and channel states are retrieved via: GET https://fireboard.io/api/v1/devices.json This returns a structured list containing latest\_temps, which represents the current readings from active channels.

### **Rate Limit Restrictions**

According to FireBoard's developer specifications, users are strictly capped at **17 API calls within any 5-minute period**. This averages to exactly **one poll every 17.6 seconds**. Attempting to poll real-time temperature updates at standard web dashboard frequencies (e.g., 1-second intervals) will cause the FireBoard servers to issue an HTTP 429 "Too Many Requests" error, temporarily blocking all API traffic for that IP or account.

### **Decoupled Core Architecture**

To build a highly responsive predictive web application without exceeding the 17 calls per 5 minutes limit, the application must decouple the **API Polling Loop** from the **User Prediction Engine**. This is achieved by implementing a persistent Redis cache layer.  
`+---------------------------------------------------------------------------------+`  
`|                               WEB APP BACKEND                                   |`  
`|                                                                                 |`  
`|  +------------------------+             +------------------------------------+  |`  
`|  |   Celery Poller Worker |             |      Celery Prediction Engine      |  |`  
`|  |                        |             |                                    |  |`  
`|  |  * Polls FireBoard API |             |  * Reads historical series         |  |`  
`|  |    strictly every 20s  |             |  * Runs Kalman/EMA smoothing       |  |`  
`|  |  * Saves raw temps to  |             |  * Executes hybrid ML/CN models   |  |`  
`|  |    Redis TimeSeries    |             |  * Updates prediction in Redis     |  |`  
`|  +------------------------+             +------------------------------------+  |`  
`|               |                                            ^                    |`  
`|               v                                            |                    |`  
`|      +--------------------------------------------------+  |                    |`  
`|      |               Redis In-Memory Cache              |--+                    |`  
`|      |  Stores: Raw temps, filtered states, active ETAs  |                      |`  
`|      +--------------------------------------------------+                      |`  
`|                               |                                                 |`  
`|                               v                                                 |`  
`|                      +------------------+                                       |`  
`|                      |  FastAPI Router  |                                       |`  
`|                      |                  |                                       |`  
`|                      |  Pushes state to |                                       |`  
`|                      |  users via SSE   |                                       |`  
`|                      +------------------+                                       |`  
`+-----------------------------------------------+---------------------------------+`  
                                `|               |`  
                             `(WebSocket / SSE Stream)`  
                                `v               v`  
                       `+---------------------------------+`  
                       `|       React Next.js UI          |`  
                       `|  Smooth 1s UI updates & graphs  |`  
                       `+---------------------------------+`

Under this decoupled architecture, the web application runs two isolated background worker threads:

1. **The Poller Worker**: An asynchronous Python task (running via Celery or asyncio) polls the FireBoard API strictly every 20 seconds. This falls well within the 17-calls-per-5-minutes cap (consuming 15 calls per 5 minutes). It writes the raw temperature measurements for each channel directly to a Redis TimeSeries database.  
2. **The Prediction Engine Worker**: The calculation of the filtered temperature state, its first derivative (\\dot{T}), and the estimated completion time (ETA) is handled inside an offline process. This engine reads the raw historical series from Redis, applies the Kalman Filter to smooth out discretization noise, executes the hybrid ML/Crank-Nicolson models, and writes the resulting prediction object back to a Redis cache.

The Web client (running a Next.js/React frontend) connects to the FastAPI backend via **Server-Sent Events (SSE)** or **WebSockets**. The FastAPI router simply reads the *pre-calculated* prediction object directly from Redis and streams it to the user.  
If ten different browsers are viewing the same active cook, the FireBoard Cloud API is still only polled once every 20 seconds, ensuring zero rate-limiting conflicts and maximum scalability.

## **6\. Target Web Application Stack and Blueprint**

To build the web application, the following open-source software stack and data flow pipeline are recommended:

### **Backend Stack**

* **Application Server**: **FastAPI (Python 3.11+)**. FastAPI is chosen for its native, high-performance asynchronous support, making it ideal for managing continuous WebSocket or SSE channels.  
* **Task Queue & Scheduler**: **Celery \+ Redis**. Celery handles the background scheduling of the poller worker and prediction tasks, while Redis manages the high-speed caching and message brokering.  
* **Thermodynamic Analytics Core**:  
  * **XGBoost / Scikit-learn**: For running the gradient-boosted ML regression model during standard heat progression.  
  * **NumPy / SciPy**: Formulated to execute the Crank-Nicolson finite-difference matrix calculations (T^{n+1} \= \\mathbf{A}^{-1}(\\mathbf{B}T^n \+ \\underline{C})) when modeling fallback trajectories and the latent heat dynamics of the stall.  
  * **FilterPy**: A Python Kalman filtering library to smooth raw FireBoard readings.

### **Telemetry Pipeline & Data Flow**

1. **Authentication**: The user logs into the custom web app using their FireBoard account credentials. The backend calls POST /api/rest-auth/login/ and caches the user's secure token in Redis.  
2. **Continuous Polling Loop**: The Poller worker uses the token to make a single GET /api/v1/devices.json request every 20 seconds.  
3. **Data Ingestion**: The worker reads the current array of temperature sensors. The core probe tip sensor is mapped to T\[span\_95\](start\_span)\[span\_95\](end\_span)\[span\_97\](start\_span)\[span\_97\](end\_span)\_{\\text{core}}, and the corresponding chamber sensor is mapped to T\_{\\text{ambient}}.  
4. **State Smoothing**: The Prediction Worker retrieves the last 10 minutes of raw measurements from Redis. It processes T\_{\\text{core}} and T\_{\\text{ambient}} through a 1D Kalman filter. The Kalman filter outputs a smoothed core temperature S\_{\\text{core}} and a stable, noise-free derivative \\dot{S}\_{\\text{core}}.  
5. **Predictive Execution**:  
   * *Standard Cook*: If the temperature is below 65 °C, the XGBoost ML model evaluates the vector \[S\_{\\text{core}}, \\dot{S}\_{\\text{core}}, T\_{\\text{ambient}}, T\_{\\text\[span\_142\](start\_span)\[span\_142\](end\_span){target}}\] to generate the primary ETA.  
   * *Stall Event*: If the core temperature settles between 65 °C and 75 °C and \\dot{S}\_\[span\_143\](start\_span)\[span\_143\](end\_span){\\text{core}} drops below 0.01 degrees per minute, the solver detects the thermodynamic stall. It switches from the ML model to the physical 1D Crank-Nicolson solver. The Crank-Nicolson solver runs a forward simulation incorporating latent heat of vaporization boundary conditions to model when the surface moisture will deplete, generating a realistic stall completion ETA.  
6. **UI Streaming**: The computed ETA, the target temperature, the smoothed heating rate, and active carryover/resting estimates are compiled into a unified payload:  
   `{`  
     `"channel": 1,`  
     `"core_temp_raw": 58.2,`  
     `"core_temp_filtered": 58.23,`  
     `"ambient_temp": 107.5,`  
     `"heating_rate": 0.45,`  
     `"stall_detected": false,`  
     `"eta_seconds": 1540,`  
     `"confidence": "high"`  
   `}`  
   FastAPI streams this JSON payload to the React frontend every 20 seconds via WebSockets.

### **Frontend Dashboard UI**

* **Framework**: **Next.js (React) \+ TailwindCSS \+ Tremor/D3.js**.  
* **Visualizations**:  
  * **Dynamic Ring Timer**: A circular visual countdown rendering the ETA, accompanied by a shaded "prediction window" that starts wide and progressively narrows as the standard deviation of the prediction model stabilizes.  
  * **Live Sensor Graph**: A real-time chart tracking raw telemetry, smoothed trajectories, and S-shaped predictive projections.  
  * **Carryover Alert Banner**: A mathematical warning that triggers a sound/vibration notification on the client browser when the thermal energy stored in the outer layers of the meat matches the energy required to coast to the target doneness, prompting the cook to remove the meat from the heat source early.

## **7\. Strategic Implementation Roadmap**

To construct this system, development should be phased into sequential engineering sprints:

1. **Sprint 1 (Ingestion & Storage)**: Build the async FastAPI server and configure the background Celery poller. Test the connection to the FireBoard API, ensuring authentication tokens are properly managed and rate limits are rigidly enforced by polling strictly on a 20-second interval. Verify raw records are successfully cached to Redis.  
2. **Sprint 2 (Filtering & Estimation)**: Implement the digital Kalman Filter in Python. Write unit tests using mocked, stepped temperature data (1 degree increments) to verify that the filter successfully reconstructs a smooth, continuous, and differentiable temperature curve with accurate real-time rate-of-change (\\frac{dT}{dt}) metrics.  
3. **Sprint 3 (Predictive Solver Integration)**: Port the Crank-Nicolson thermodynamic equations using NumPy. Configure the boundary conditions to alternate between standard heat transfer and latent heat loss during stall detection (65 °C to 75 °C). Integrate the statistical XGBoost ML model as the standard baseline estimator.  
4. **Sprint 4 (UI & Streaming)**: Create the interactive Next.js dashboard. Connect the client to FastAPI's WebSocket endpoint, ensuring smooth 1-second animations and charts update instantly as the backend publishes revised Redis states. Add client-side visual alerts for carryover resting periods.

#### **Works cited**

1\. combustion-inc/combustion-documentation: Probe BLE specification and other public documentation. \- GitHub, https://github.com/combustion-inc/combustion-documentation 2\. predicting cooking times \- Genuine Ideas, https://genuineideas.com/ArticlesIndex/thumbs.html 3\. Is there a good reason why meat cooking times are generally quoted as linear with respect to weight? \- Seasoned Advice, https://cooking.stackexchange.com/questions/130425/is-there-a-good-reason-why-meat-cooking-times-are-generally-quoted-as-linear-wit 4\. Getting started with the Predictive Thermometer App \- Combustion Inc, https://combustion.inc/pages/apps 5\. Combustion App, https://combustion.inc/pages/setup-guide/combustion-inc-app 6\. R00S/meater-in-local-haos: kitchen cooking for home assistant \- GitHub, https://github.com/R00S/meater-in-local-haos 7\. I built a predictive meat thermometer integration for HA, it tells you when your cook will be done, using any temperature sensors you already have : r/homeassistant \- Reddit, https://www.reddit.com/r/homeassistant/comments/1swmjds/i\_built\_a\_predictive\_meat\_thermometer\_integration/ 8\. Solving the Heat Equation like in Harvard's Cook my Meat App \- Frolian's blog, https://flothesof.github.io/heat-equation-cook-my-meat.html 9\. FireBoard®Cloud Connected Smart BBQ/Smoker Thermometer \- SmartThings Community, https://community.smartthings.com/t/fireboard-cloud-connected-smart-bbq-smoker-thermometer/102339 10\. FireBoard Cloud API, https://docs.fireboard.io/app/app-api/ 11\. best wireless meat thermometer? : r/grilling \- Reddit, https://www.reddit.com/r/grilling/comments/1u92j6s/best\_wireless\_meat\_thermometer/ 12\. combustion-inc/combustion-ios-ble: Bluetooth Low Energy framework for communicating with Combustion Inc. Predictive Thermometers. \- GitHub, https://github.com/combustion-inc/combustion-ios-ble 13\. Combustion Inc. Android Example \- GitHub, https://github.com/combustion-inc/combustion-android-example 14\. Deep Learning model to assess the quality of red meat based on sample photos. \- GitHub, https://github.com/robertofierimonte/meat-quality-assessment 15\. combustion-inc/combustion-android-ble: Bluetooth Low Energy framework for communicating with Combustion Inc. Predictive Thermometers. \- GitHub, https://github.com/combustion-inc/combustion-android-ble 16\. justindean/PitmasterPi: BBQ Automated Temperature Controller using Raspberry Pi \- GitHub, https://github.com/justindean/PitmasterPi 17\. 11 months in, I'm not sure the use case : r/combustion\_inc \- Reddit, https://www.reddit.com/r/combustion\_inc/comments/1ccfddt/11\_months\_in\_im\_not\_sure\_the\_use\_case/ 18\. Low-and-slow BBQ data needed\! : r/combustion\_inc \- Reddit, https://www.reddit.com/r/combustion\_inc/comments/1cjng5s/lowandslow\_bbq\_data\_needed/ 19\. Solving the heat equation in python to cook a turkey (in two dimensions). First, a 2D image representing the cross section of a turkey can be loaded into python. Then, using numerical methods (with NUMBA to assist) the temperature of the turkey at all locations is determined as a function of time : r/ \- Reddit, https://www.reddit.com/r/Physics/comments/moszyq/solving\_the\_heat\_equation\_in\_python\_to\_cook\_a/ 20\. A cooking method is developed to output raw chicken with a 3D printer and bake it with a laser. \- GIGAZINE, https://gigazine.net/gsc\_news/en/20210924-3d-printed-chicken-cook-with-lasers/ 21\. A mathematical model of meat cooking based on polymer-solvent analogy \- University of Pretoria, https://repository.up.ac.za/bitstreams/c20ab7b2-9174-43c6-8e07-7e5327e10e7e/download 22\. (PDF) A Mathematical Model for Meat Cooking \- ResearchGate, https://www.researchgate.net/publication/335462864\_A\_Mathematical\_Model\_for\_Meat\_Cooking 23\. Predicted Time on Display question : r/combustion\_inc \- Reddit, https://www.reddit.com/r/combustion\_inc/comments/13n8bqk/predicted\_time\_on\_display\_question/ 24\. Numerical simulation of heat transfer during meat ball cooking and microbial food safety enhancement \- PubMed, https://pubmed.ncbi.nlm.nih.gov/38258971/ 25\. antmicro/thermal-simulation-scripts \- GitHub, https://github.com/antmicro/thermal-simulation-scripts 26\. Calculate cook time based on meat probe temperature? \- Home Assistant Community, https://community.home-assistant.io/t/calculate-cook-time-based-on-meat-probe-temperature/267649 27\. Kalman Filtering Applied to Sensor Fused Data to Deliver Accurate and Rapid Environmental Feedback of an Occupied Space, https://www.deltacontrols.de/media/White-Papers.pdf 28\. thermodynamic-properties · GitHub Topics, https://github.com/topics/thermodynamic-properties?l=python\&o=desc\&s=updated 29\. Kalman filter (one-dimensional): several approaches? \- Stack Overflow, https://stackoverflow.com/questions/33384112/kalman-filter-one-dimensional-several-approaches 30\. FireBoard Thermometer Monitoring \- InfluxDB, https://www.influxdata.com/integration/fireboard/ 31\. GarthDB/ha-fireboard: Home Assistant integration for FireBoard wireless thermometers, https://github.com/GarthDB/ha-fireboard 32\. FireBoard Analyze, https://docs.fireboard.io/app/app-analyze/ 33\. Boards on Fire REST API, https://boardsonfire.com/en/knowledge-center/technology-integrations/rest-api-boards-on-fire 34\. gordlea/fireboard2mqtt \- GitHub, https://github.com/gordlea/fireboard2mqtt