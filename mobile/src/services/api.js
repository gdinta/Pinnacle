// mobile/src/services/api.js
import axios from 'axios';

// UPDATE THIS WITH YOUR FLASK SERVER IP
const API_BASE_URL = 'http://10.100.184.47:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Analyze Job
export const analyzeJob = async (formData) => {
  try {
    const response = await apiClient.post('/analyze', formData);
    return response.data;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
};

// Get Sample Job
export const getSampleJob = async () => {
  try {
    const response = await apiClient.get('/sample-job');
    return response.data;
  } catch (error) {
    console.error('Sample job error:', error);
    throw error;
  }
};

// Test Data
export const testData = async () => {
  try {
    const response = await apiClient.get('/test-data');
    return response.data;
  } catch (error) {
    console.error('Test data error:', error);
    throw error;
  }
};

// Health Check
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

export default apiClient;
