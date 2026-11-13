import { StyleSheet, Text, View } from "react-native";
import { Departure } from "../domain/entities/Departure";
import { RouteNumber } from "../domain/value-objects/RouteNumber";
import { DepartureDelay } from "../domain/value-objects/DepartureDelay";
import { DelayHighlight } from "./DelayHighlight";

type Props = {
  departure: Departure;
};

function formatDepartureTime(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function DepartureCard({ departure }: Props) {
  const route = new RouteNumber(departure.routeId);
  const delay = new DepartureDelay(departure.delayInSeconds);

  return (
    <View style={styles.card}>
      <View style={styles.route}>
        <Text style={styles.routeText}>{route.value}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.destination}>{departure.headsign}</Text>

        <Text style={styles.time}>
          Rozkład: {formatDepartureTime(departure.theoreticalTime)}
        </Text>

        {departure.estimatedTime ? (
          <Text style={styles.estimated}>
            Przewidywany: {formatDepartureTime(departure.estimatedTime)}
          </Text>
        ) : null}
      </View>

      <DelayHighlight delay={delay} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    elevation: 2,
  },
  route: {
    width: 54,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  routeText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  details: {
    flex: 1,
    gap: 3,
  },
  destination: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  time: {
    fontSize: 13,
    color: "#6B7280",
  },
  estimated: {
    fontSize: 13,
    color: "#374151",
  },
});
