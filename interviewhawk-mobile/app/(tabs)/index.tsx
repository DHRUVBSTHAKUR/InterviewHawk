import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList, RefreshControl } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// Live Render Backend URL
const BACKEND_URL = 'https://interviewhawk-backend.onrender.com/api';

export default function HomeScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Check if logged in on boot
  useEffect(() => {
    const bootCheck = async () => {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        setIsAuthenticated(true);
        fetchHistory(token);
      }
    };
    bootCheck();
  }, []);

  // 2. Fetch the History Data
  const fetchHistory = async (token: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/history/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) handleLogout();
      console.log("History fetch error:", error);
    }
  };

  // 3. Pull-to-refresh logic
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const token = await SecureStore.getItemAsync('access_token');
    if (token) await fetchHistory(token);
    setRefreshing(false);
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/token/`, { username, password });
      const token = response.data.access;
      await SecureStore.setItemAsync('access_token', token);
      setIsAuthenticated(true);
      fetchHistory(token); 
    } catch (error) {
      Alert.alert('Login Failed', 'Check your credentials or network connection.');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    setIsAuthenticated(false);
    setHistory([]);
    setUsername('');
    setPassword('');
  };

  // --- UI: HISTORY CARD COMPONENT ---
  const renderHistoryItem = ({ item }: { item: any }) => {
    // Safety check for score parsing
    const scoreNum = item.score ? parseInt(item.score.split('/')[0]) : 0;
    const scoreColor = scoreNum >= 7 ? '#00ffcc' : scoreNum >= 5 ? '#ffcc00' : '#ff3366';

    return (
      <View style={[styles.card, { borderLeftColor: scoreColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.userBadge}>
            <Text style={styles.userText}>👤 {item.username?.toUpperCase() || 'USER'}</Text>
          </View>
          <Text style={styles.dateText}>📅 {item.date || 'Recent'}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>Score: {item.score || '0/10'}</Text>
        </View>

        <Text style={styles.questionText}>
          <Text style={{ color: '#bd00ff', fontWeight: 'bold' }}>Q: </Text> 
          {item.question || 'No question recorded.'}
        </Text>
        
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackLabel}>HAWK FEEDBACK</Text>
          <Text style={styles.feedbackText}>{item.feedback || 'Analyzing performance...'}</Text>
        </View>
      </View>
    );
  };

  // --- UI: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={{ marginTop: 60 }}>
          <Text style={styles.title}>🦅 InterviewHawk</Text>
          <Text style={styles.subtitle}>Companion Dashboard</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <TextInput 
            style={styles.input} placeholder="Username" placeholderTextColor="#555"
            value={username} onChangeText={setUsername} autoCapitalize="none"
          />
          <TextInput 
            style={styles.input} placeholder="Password" placeholderTextColor="#555"
            value={password} onChangeText={setPassword} secureTextEntry
          />
          <TouchableOpacity 
            style={[styles.button, { opacity: loading ? 0.7 : 1 }]} 
            onPress={handleLogin} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login to Dashboard</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- UI: DASHBOARD SCREEN ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🦅 Team Stats</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No interview history found.</Text>
          <Text style={styles.emptySubtext}>Take an interview on the web app to see stats here!</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderHistoryItem}
          contentContainerStyle={{ paddingBottom: 50 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#bd00ff" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20, paddingTop: 40 },
  
  // Login Styles
  title: { fontSize: 36, fontWeight: 'bold', color: '#bd00ff', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#00ffff', textAlign: 'center', marginBottom: 40, letterSpacing: 2, fontWeight: 'bold' },
  input: { backgroundColor: '#0a0a0a', color: '#fff', padding: 18, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#222', fontSize: 16 },
  button: { backgroundColor: '#bd00ff', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#bd00ff', shadowOpacity: 0.3, shadowRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Dashboard Styles
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ff3366', borderRadius: 8 },
  logoutText: { color: '#ff3366', fontWeight: 'bold', fontSize: 12 },
  
  // Card Styles
  card: { backgroundColor: '#111', padding: 18, borderRadius: 16, marginBottom: 15, borderLeftWidth: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userBadge: { background: '#bd00ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#bd00ff' },
  userText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  dateText: { color: '#555', fontSize: 12, fontWeight: 'bold' },
  scoreText: { fontWeight: '900', fontSize: 20 },
  questionText: { color: '#eee', fontSize: 15, lineHeight: 22, marginBottom: 15 },
  feedbackContainer: { backgroundColor: '#000', padding: 12, borderRadius: 8, borderSize: 1, borderColor: '#222' },
  feedbackLabel: { color: '#bd00ff', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  feedbackText: { color: '#bbb', fontSize: 13, lineHeight: 18 },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptySubtext: { color: '#555', textAlign: 'center', paddingHorizontal: 40, fontSize: 14 },
});