import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import http_handler from "../HTTP/HTTPS_INTERFACE";
import BaseModal from "./Base";
import { format } from "date-fns";

const http = new http_handler();

export default function ProductHistory(props) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [startRange, setStartRange] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [endRange, setEndRange] = useState(format(new Date(), "yyyy-MM-dd"));

  const init_process = async () => {
    await init();
  };

  const init = async () => {
    const employees = await http.getEmployeeData();
    setEmployees(employees.data);
    const products = await http.getProducts();
    setProducts(products.data);
  };

  const fetchProductHistory = async () => {
    if (!selectedProduct) {
      return alert("Please select a product");
    }
    const history = await http.getProductHistory(selectedProduct, {
      start: startRange,
      end: endRange,
    });
    setProductHistory(history.data);
  };

  useEffect(() => {
    init_process();
  }, []);

  const groupedHistory = productHistory.reduce((acc, entry) => {
    const entryDate = new Date(entry.date);
    const dayKey = format(entryDate, "yyyy-MM-dd");
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(entry);
    return acc;
  }, {});

  const renderHistory = () => {
    const dayEntries = Object.keys(groupedHistory)
      .sort((a, b) => new Date(b) - new Date(a)) // Sort by most recent date
      .map((dayKey) => {
        const entries = groupedHistory[dayKey];
        return (
          <View key={dayKey} style={styles.dayGroup}>
            <Text style={styles.dayHeader}>
              {format(new Date(dayKey), "eeee, MMMM do, yyyy")}
            </Text>
            {entries.map((entry, index) => (
              <View key={index} style={styles.historyEntry}>
                <Text style={styles.entryText}>
                  Transaction ID: {entry.TRANSACTIONID}
                </Text>
                <Text style={styles.entryText}>
                  Product ID: {entry.PRODUCT_ID}
                </Text>
                <Text style={styles.entryText}>
                  Product Name: {entry.PRODUCT_NAME}
                </Text>
                <Text style={styles.entryText}>Origin: {entry.origin}</Text>
                <Text style={styles.entryText}>
                  Date: {format(new Date(entry.date), "yyyy-MM-dd HH:mm:ss")}
                </Text>
                <Text style={styles.entryText}>
                  Before Stock: {JSON.stringify(entry.before_stock)}
                </Text>
                <Text style={styles.entryText}>
                  After Stock: {JSON.stringify(entry.after_stock)}
                </Text>
              </View>
            ))}
          </View>
        );
      });
    return dayEntries;
  };

  return (
    <BaseModal
      visible={props.visible}
      closeHandler={props.closeHandler}
      title={"Product History"}
      closeName={"productHistory"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.filterContainer}>
          <Text style={styles.label}>Start Date:</Text>
          <TextInput
            style={styles.dateInput}
            value={startRange}
            onChangeText={(text) => setStartRange(text)}
            placeholder="YYYY-MM-DD"
          />
          <Text style={styles.label}>End Date:</Text>
          <TextInput
            style={styles.dateInput}
            value={endRange}
            onChangeText={(text) => setEndRange(text)}
            placeholder="YYYY-MM-DD"
          />
          <TouchableOpacity style={styles.button} onPress={fetchProductHistory}>
            <Text style={styles.buttonText}>Fetch History</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.historyContainer}>{renderHistory()}</View>
      </ScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  filterContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  dateInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  historyContainer: {
    marginTop: 20,
  },
  dayGroup: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    fontWeight: "700",
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  historyEntry: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
  },
  entryText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
});
