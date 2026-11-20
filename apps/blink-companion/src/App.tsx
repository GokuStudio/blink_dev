import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { auth, database, firestore } from "./firebase";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blink Companion</Text>
      <Text style={styles.detail}>
        Firebase Authentication and Realtime Database are configured.
      </Text>
      <Text style={styles.detail}>
        Authentication: {auth.name} | Live state: {database.app.name} | History:{" "}
        {firestore.app.name}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  detail: {
    textAlign: "center",
  },
});
