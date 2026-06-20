import numpy as np

class CookingKalmanFilter:
    def __init__(self, R: float = 0.5, Q_temp: float = 0.001, Q_rate: float = 0.0001):
        """
        Initializes a 1D Kalman Filter to track temperature and its first derivative (heating rate).
        
        Args:
            R: Measurement noise covariance (reflecting sensor discretization error).
            Q_temp: Process noise covariance for temperature state.
            Q_rate: Process noise covariance for heating rate state.
        """
        # State vector: [T, dT_dt]^T (Temperature, Rate of Change)
        self.x = np.zeros((2, 1))
        
        # State Covariance matrix (initial uncertainty estimate)
        self.P = np.eye(2) * 10.0
        
        # Measurement matrix (we only measure temperature, not its rate)
        self.H = np.array([[1.0, 0.0]])
        
        # Measurement noise covariance
        self.R = np.array([[R]])
        
        # Process noise covariance
        self.Q = np.array([
            [Q_temp, 0.0],
            [0.0, Q_rate]
        ])
        
        self.initialized = False

    def update(self, measurement: float, dt: float) -> tuple[float, float]:
        """
        Executes a single predict-update step of the Kalman Filter.
        
        Args:
            measurement: The raw temperature measurement.
            dt: The time difference (seconds) since the last measurement.
            
        Returns:
            A tuple of (filtered_temperature, rate_of_change_c_per_second)
        """
        if not self.initialized:
            self.x[0, 0] = measurement
            self.x[1, 0] = 0.0
            self.initialized = True
            return measurement, 0.0

        if dt <= 0:
            # Fallback if time did not progress
            return self.x[0, 0], self.x[1, 0]

        # 1. PREDICT step
        # State transition matrix F
        F = np.array([
            [1.0, dt],
            [0.0, 1.0]
        ])
        
        # Predicted state estimate
        x_pred = np.dot(F, self.x)
        
        # Predicted covariance estimate
        P_pred = np.dot(np.dot(F, self.P), F.T) + self.Q

        # 2. UPDATE step
        # Measurement residual
        y = measurement - x_pred[0, 0]
        
        # Residual covariance
        S = P_pred[0, 0] + self.R[0, 0]
        
        # Kalman Gain
        K = np.array([
            [P_pred[0, 0] / S],
            [P_pred[1, 0] / S]
        ])
        
        # Updated state estimate
        self.x = x_pred + K * y
        
        # Updated covariance estimate
        I = np.eye(2)
        self.P = np.dot((I - np.dot(K, self.H)), P_pred)

        return float(self.x[0, 0]), float(self.x[1, 0])
