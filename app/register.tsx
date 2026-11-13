import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, router } from "expo-router";

import { useAuthStore } from "../src/store/useAuthStore";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Błąd", "Podane hasła nie są identyczne.");
      return;
    }

    try {
      await register(email, password);
      Alert.alert(
        "Rejestracja zakończona",
        "Konto zostało utworzone. Możesz się teraz zalogować.",
        [{ text: "OK", onPress: () => router.replace("/login") }],
      );
    } catch (error) {
      Alert.alert(
        "Rejestracja nieudana",
        error instanceof Error ? error.message : "Wystąpił błąd.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>STOP SCOUT</Text>
        <Text style={styles.subtitle}>Transport w Gdańsku</Text>

        <Text style={styles.heading}>Utwórz konto</Text>
        <Text style={styles.description}>
          Zarejestruj się, aby korzystać z aplikacji.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Adres e-mail"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Hasło (min. 8 znaków)"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Powtórz hasło"
          placeholderTextColor="#9CA3AF"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Rejestracja..." : "Zarejestruj się"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Masz już konto? </Text>
          <Link href="/login" style={styles.link}>
            Zaloguj się
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F6FB",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 20,
  },
  logo: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1D4ED8",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 5,
    marginBottom: 35,
  },
  heading: {
    fontSize: 23,
    fontWeight: "800",
    color: "#111827",
  },
  description: {
    color: "#6B7280",
    marginTop: 7,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 15,
    marginBottom: 14,
    fontSize: 15,
    color: "#111827",
  },
  button: {
    backgroundColor: "#1D4ED8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#6B7280",
  },
  link: {
    color: "#1D4ED8",
    fontWeight: "700",
  },
});
