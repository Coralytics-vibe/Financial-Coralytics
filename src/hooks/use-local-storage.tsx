"use client";

import { useState, useEffect, useCallback } from "react";

type Serializer<T> = (value: T) => string;
type Deserializer<T> = (value: string) => T;

// Default serializer for most types
const defaultSerializer = JSON.stringify;

// Default deserializer, with special handling for Date objects
const defaultDeserializer = <T,>(value: string): T => {
  try {
    const parsed = JSON.parse(value, (_key, val) => { // Renamed 'key' to '_key'
      // Revive Date objects
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(val)) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return val;
    });
    return parsed as T;
  } catch (error) {
    console.error("Failed to parse localStorage value:", error);
    return value as T; // Return original value if parsing fails
  }
};

function useLocalStorage<T>(
  key: string,
  initialValue: T,
  serializer: Serializer<T> = defaultSerializer,
  deserializer: Deserializer<T> = defaultDeserializer
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, serializer(valueToStore));
      }
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }, [key, serializer, storedValue]);

  // Update localStorage when storedValue changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, serializer(storedValue));
    }
  }, [key, storedValue, serializer]);

  return [storedValue, setValue];
}

export { useLocalStorage };