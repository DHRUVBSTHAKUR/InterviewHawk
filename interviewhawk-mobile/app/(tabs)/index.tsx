import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList, RefreshControl } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// ⚠️ CHANGE THIS TO YOUR MAC'S IP ADDRESS! 
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
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/token/`, { username, password });
      const token = response.data.access;
      await SecureStore.setItemAsync('access_token', token);
      setIsAuthenticated(true);
      fetchHistory(token); // Grab stats immediately after login
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
  };

  // --- UI: HISTORY CARD COMPONENT ---
  const renderHistoryItem = ({ item }: { item: any }) => {
    const scoreNum = parseInt(item.score);
    const scoreColor = scoreNum >= 7 ? '#00ffcc' : scoreNum >= 5 ? '#ffcc00' : '#ff3366';

    return (
      <View style={[styles.card, { borderLeftColor: scoreColor }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>📅 {item.date}</Text>
          <Text style={[styles.scoreText, { color: scoreColor }]}>Score: {item.score}</Text>
        </View>
        <Text style={styles.questionText}><Text style={{ color: '#bd00ff' }}>Q:</Text> {item.question}</Text>
        <Text style={styles.feedbackText}>Hawk Feedback: {item.feedback}</Text>
      </View>
    );
  };

  // --- UI: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🦅 InterviewHawk</Text>
        <Text style={styles.subtitle}>Companion Dashboard</Text>
        <TextInput 
          style={styles.input} placeholder="Username" placeholderTextColor="#888"
          value={username} onChangeText={setUsername} autoCapitalize="none"
        />
        <TextInput 
          style={styles.input} placeholder="Password" placeholderTextColor="#888"
          value={password} onChangeText={setPassword} secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login to Dashboard</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  // --- UI: DASHBOARD SCREEN ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🦅 Your Stats</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No interview history found.</Text>
          <Text style={styles.emptySubtext}>Take an interview on your laptop to see your stats here!</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
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
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20, paddingTop: 60 },
  
  // Login Styles
  title: { fontSize: 32, fontWeight: 'bold', color: '#bd00ff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#00ffff', textAlign: 'center', marginBottom: 40, letterSpacing: 1 },
  input: { backgroundColor: '#111', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#bd00ff', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Dashboard Styles
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  logoutBtn: { padding: 8, borderWidth: 1, borderColor: '#ff3366', borderRadius: 8 },
  logoutText: { color: '#ff3366', fontWeight: 'bold' },
  
  // Card Styles
  card: { backgroundColor: '#111', padding: 18, borderRadius: 12, marginBottom: 15, borderLeftWidth: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dateText: { color: '#888', fontSize: 14 },
  scoreText: { fontWeight: 'bold', fontSize: 16 },
  questionText: { color: '#fff', fontSize: 16, lineHeight: 24, marginBottom: 10, fontWeight: '500' },
  feedbackText: { color: '#aaa', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptySubtext: { color: '#888', textAlign: 'center', paddingHorizontal: 20 },
});