// mobile/src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#0f172a',
  secondary: '#1e293b',
  accent: '#10b981',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
};

const HomeScreen = ({ navigation }) => {
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    loadRecentAnalyses();
    const unsubscribe = navigation.addListener('focus', loadRecentAnalyses);
    return unsubscribe;
  }, []);

  const loadRecentAnalyses = async () => {
    try {
      const data = await AsyncStorage.getItem('savedAnalyses');
      if (data) {
        const analyses = JSON.parse(data).slice(-3);
        setRecentAnalyses(analyses.reverse());
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>WealthPath AI</Text>
          <Text style={styles.subtitle}>
            Before you apply, know if the job builds your wealth.
          </Text>
        </View>

        {/* Quick Start Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('AnalysisTab')}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.buttonText}>Start New Analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('SavedTab')}
          >
            <Ionicons name="bookmark" size={24} color={COLORS.accent} />
            <Text style={[styles.buttonText, { color: COLORS.accent }]}>
              View Saved Jobs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.featureGrid}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name="cash" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.featureTitle}>Wealth Impact</Text>
              <Text style={styles.featureText}>
                See how salary, taxes, and expenses affect your wealth
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name="trending-up" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.featureTitle}>Market Demand</Text>
              <Text style={styles.featureText}>
                Understand demand and growth potential
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.featureTitle}>Job Security</Text>
              <Text style={styles.featureText}>
                Learn your role's resilience to automation
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name="rocket" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.featureTitle}>Investment Potential</Text>
              <Text style={styles.featureText}>
                Calculate wealth-building potential
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Analyses</Text>

            {recentAnalyses.map((analysis, index) => (
              <TouchableOpacity key={index} style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <Text style={styles.analysisTitle} numberOfLines={1}>
                    {analysis.jobTitle || 'Job Analysis'}
                  </Text>
                  <View
                    style={[
                      styles.scoreBadge,
                      {
                        backgroundColor:
                          (analysis.overallScore || 0) >= 85
                            ? COLORS.accent
                            : '#f59e0b',
                      },
                    ]}
                  >
                    <Text style={styles.scoreBadgeText}>
                      {Math.round(analysis.overallScore || 0)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.analysisCompany}>
                  {analysis.companyName || 'Company'}
                </Text>
                <Text style={styles.analysisDate}>
                  {new Date(analysis.savedAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About WealthPath AI</Text>

          <View style={styles.statBox}>
            <Text style={styles.statText}>
              ✨ <Text style={styles.bold}>Real Data</Text> - Using official BLS,
              Stack Overflow, Yahoo Finance, and IRS data
            </Text>
            <Text style={styles.statText}>
              🚀 <Text style={styles.bold}>7-Factor Scoring</Text> - Analyzing
              salary, demand, company health, automation risk, taxes, COL, and
              investment potential
            </Text>
            <Text style={styles.statText}>
              📊 <Text style={styles.bold}>20-Year Projections</Text> - See how
              jobs impact long-term wealth building
            </Text>
            <Text style={styles.statText}>
              💾 <Text style={styles.bold}>Save Offline</Text> - All your
              analyses stored on your device
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Make smarter career decisions with real data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  feature: {
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  analysisCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  scoreBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreBadgeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  analysisCompany: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  analysisDate: {
    fontSize: 11,
    color: '#64748b',
  },
  statBox: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  statText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen;
