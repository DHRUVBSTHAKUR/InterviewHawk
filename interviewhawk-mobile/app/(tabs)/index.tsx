import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

export default function HomeScreen() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const uploadResume = async () => {
    try {
      setError('');
      // Open the phone's native file picker
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setLoading(true);

      // Package the file for Django
      const formData = new FormData();
      formData.append('resume', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      } as any);

      // Hit your LIVE Render Brain
      const response = await axios.post(
        'https://interviewhawk-backend.onrender.com/api/generate-question/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setQuestion(response.data.question);
    } catch (err) {
      setError('Failed to connect to AI. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>InterviewHawk</Text>
      <Text style={styles.subtitle}>Mobile AI Coach</Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={uploadResume}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>📄 Upload PDF Resume</Text>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {question ? (
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>AI QUESTION:</Text>
          <Text style={styles.questionText}>{question}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#bd00ff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff3366',
    marginTop: 20,
  },
  questionCard: {
    marginTop: 40,
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#bd00ff',
  },
  questionLabel: {
    color: '#bd00ff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  questionText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 26,
  },
});