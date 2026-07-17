// mobile/src/services/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save Analysis
export const saveAnalysis = async (analysis) => {
  try {
    const existing = await AsyncStorage.getItem('savedAnalyses');
    const analyses = existing ? JSON.parse(existing) : [];

    analyses.push({
      ...analysis,
      id: `analysis_${Date.now()}`,
      savedAt: new Date().toISOString(),
    });

    await AsyncStorage.setItem('savedAnalyses', JSON.stringify(analyses));
    return analysis;
  } catch (error) {
    console.error('Save error:', error);
    throw error;
  }
};

// Get Saved Analyses
export const getSavedAnalyses = async () => {
  try {
    const data = await AsyncStorage.getItem('savedAnalyses');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
};

// Get Single Analysis
export const getAnalysis = async (id) => {
  try {
    const analyses = await getSavedAnalyses();
    return analyses.find(a => a.id === id);
  } catch (error) {
    console.error('Get error:', error);
    return null;
  }
};

// Delete Analysis
export const deleteAnalysis = async (id) => {
  try {
    const existing = await AsyncStorage.getItem('savedAnalyses');
    const analyses = existing ? JSON.parse(existing) : [];

    const filtered = analyses.filter(a => a.id !== id);
    await AsyncStorage.setItem('savedAnalyses', JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

// Update Analysis
export const updateAnalysis = async (id, updates) => {
  try {
    const analyses = await getSavedAnalyses();
    const index = analyses.findIndex(a => a.id === id);

    if (index !== -1) {
      analyses[index] = { ...analyses[index], ...updates };
      await AsyncStorage.setItem('savedAnalyses', JSON.stringify(analyses));
      return analyses[index];
    }
    return null;
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
};

// Clear All Analyses
export const clearAllAnalyses = async () => {
  try {
    await AsyncStorage.setItem('savedAnalyses', JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Clear error:', error);
    throw error;
  }
};

// Save Theme Preference
export const saveTheme = async (theme) => {
  try {
    await AsyncStorage.setItem('theme', theme);
  } catch (error) {
    console.error('Theme save error:', error);
  }
};

// Get Theme Preference
export const getTheme = async () => {
  try {
    const theme = await AsyncStorage.getItem('theme');
    return theme || 'dark';
  } catch (error) {
    console.error('Theme get error:', error);
    return 'dark';
  }
};

// Save User Preferences
export const saveUserPreferences = async (preferences) => {
  try {
    await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Preferences save error:', error);
  }
};

// Get User Preferences
export const getUserPreferences = async () => {
  try {
    const prefs = await AsyncStorage.getItem('userPreferences');
    return prefs ? JSON.parse(prefs) : {};
  } catch (error) {
    console.error('Preferences get error:', error);
    return {};
  }
};
